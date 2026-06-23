"""
Inference pipeline. Loads the .pth bundle and exposes a single run()
function used by the FastAPI route.

BUNDLE FORMAT - three shapes have been seen so far (inspected directly via
torch.load each time, never assumed):

  V7 ("medguard_v7_api_ready_bundle.pth"):
    classifier_state_dict, segmenter_state_dict, test_metrics (top-level)
    config: { cls_encoder, seg_encoder, image_size, label_names, threshold,
              mean, std, important_note, ... }
    No context_crop_ratio anywhere - see DEFAULT_CONTEXT_RATIO.

  V3-flat (the training notebook / scripts/make_dummy_bundle.py):
    Everything as flat top-level keys, plus context_crop_ratio and
    training_notes.roi_caveat.

  V1-final ("MedGuard_multitask_bundle_v1.pth" - the bundle this AI-team
  delivery is built around):
    Flat top-level keys (image_size, label_names, threshold,
    context_crop_ratio, cls_encoder, seg_encoder - all present directly),
    PLUS a separate preprocessing: { mean, std, ... } dict, PLUS
    deployment_notes: { training_roi_source, recommended_api_roi_source,
    fallback_roi_source, recommended_api_flow, roi_warning }.
    This is the bundle that specifies the segmentation-first ROI flow
    implemented below.

_cfg() reads "config.<key>" first (V7), falling back to a flat top-level
key (V3/V1-final), so all shapes work without an if/else per field.
mean/std additionally check a "preprocessing" sub-dict (V1-final).

=== ROI / localization strategy ===
Per deployment_notes.recommended_api_flow (V1-final bundle, confirmed by
the AI team): the correct production flow is NOT "crop first, then
classify" - it's:
  1. segmenter predicts a coarse lesion mask on the FULL uploaded image
  2. the largest connected component of that mask becomes the ROI
  3. that ROI (context-expanded) is cropped from the ORIGINAL image
  4. classifier + Grad-CAM++ run on that crop
  5. segmenter runs AGAIN on that same crop for the final displayed mask
     (the first pass was only for coarse localization)

Three roi_source values are now possible, matching the bundle's own
terminology (deployment_notes.training_roi_source /
recommended_api_roi_source / fallback_roi_source):
  "manual_roi"                 - caller supplied an explicit box (still
                                  supported, takes priority if given)
  "segmentation_predicted_mask"- the new default automatic path
  "center_crop_fallback"       - only used if the coarse segmenter finds
                                  no component at all (empty mask)
"""
import base64
import io
import os
import time

import cv2
import numpy as np
import torch
from PIL import Image

from app.model import (
    ClsModel, build_segmenter, GradCAMpp, find_last_conv,
    normalize_uint8, resize_pad, expand_bbox, largest_component_bbox,
    map_bbox_from_canvas_to_original,
    load_gray_as_rgb_from_bytes, eval_transform,
)

PIPELINE_VERSION = "medguard-seg-first-v1"

# Only relevant for bundles that omit context_crop_ratio entirely (V7).
# V1-final (the bundle currently in use) provides this directly - see the
# model_metadata.context_ratio_source field in every response to check
# which path was actually taken for a given bundle. 
DEFAULT_CONTEXT_RATIO = float(os.environ.get("CONTEXT_CROP_RATIO", "0.60"))


def _cfg(bundle, key, default=None):
    cfg = bundle.get("config")
    if isinstance(cfg, dict) and key in cfg:
        return cfg[key]
    return bundle.get(key, default)


def _cfg_mean_std(bundle, key, default):
    # Checks config.<key> (V7), then preprocessing.<key> (V1-final), then a
    # flat top-level key, before falling back to the ImageNet default.
    cfg = bundle.get("config")
    if isinstance(cfg, dict) and key in cfg:
        return cfg[key]
    pre = bundle.get("preprocessing")
    if isinstance(pre, dict) and key in pre:
        return pre[key]
    return bundle.get(key, default)


class InferenceEngine:
    def __init__(self, bundle_path, device=None):
        self.device = torch.device(device or ("cuda" if torch.cuda.is_available() else "cpu"))
        bundle = torch.load(bundle_path, map_location=self.device, weights_only=False)

        self.image_size = _cfg(bundle, "image_size")
        self.label_names = _cfg(bundle, "label_names")
        self.threshold = float(_cfg(bundle, "threshold"))
        self.mean = _cfg_mean_std(bundle, "mean", [0.485, 0.456, 0.406])
        self.std = _cfg_mean_std(bundle, "std", [0.229, 0.224, 0.225])
        self.test_metrics = bundle.get("test_metrics", {})

        context_ratio = _cfg(bundle, "context_crop_ratio")
        self.context_ratio = float(context_ratio) if context_ratio is not None else DEFAULT_CONTEXT_RATIO
        self.context_ratio_is_default = context_ratio is None

        # Most specific caveat wins: deployment_notes.roi_warning (V1-final,
        # explicitly written for API integrators) > training_notes.roi_caveat
        # (V3/V1-final) > config.important_note (V7).
        deployment_notes = bundle.get("deployment_notes", {})
        training_notes = bundle.get("training_notes", {})
        self.roi_caveat = (
            deployment_notes.get("roi_warning")
            or training_notes.get("roi_caveat")
            or _cfg(bundle, "important_note")
        )
        self.recommended_api_flow = deployment_notes.get("recommended_api_flow")

        cls_encoder = _cfg(bundle, "cls_encoder")
        seg_encoder = _cfg(bundle, "seg_encoder")

        self.classifier = ClsModel(cls_encoder, num_classes=len(self.label_names)).to(self.device)
        self.classifier.load_state_dict(bundle["classifier_state_dict"])
        self.classifier.eval()

        self.segmenter = build_segmenter(seg_encoder, self.device)
        self.segmenter.load_state_dict(bundle["segmenter_state_dict"])
        self.segmenter.eval()

        _, self.cam_layer = find_last_conv(self.classifier.backbone)
        self.eval_tf = eval_transform(self.mean, self.std)

    def _to_tensor(self, gray_uint8):
        """normalize_uint8 + resize_pad + CLAHE/normalize/ToTensor, the full
        preprocessing chain used for both the coarse localization pass and
        the final classification crop."""
        normalized = normalize_uint8(gray_uint8)
        squared = resize_pad(normalized, self.image_size, is_mask=False)
        rgb = cv2.cvtColor(squared, cv2.COLOR_GRAY2RGB)
        tensor = self.eval_tf(image=rgb)["image"].unsqueeze(0).to(self.device)
        return squared, tensor

    def _segment(self, tensor):
        with torch.no_grad():
            seg_logits = self.segmenter(tensor)
            seg_prob = torch.sigmoid(seg_logits)[0, 0].cpu().numpy()
        return (seg_prob > 0.5).astype(np.uint8)

    def _locate_and_crop(self, gray, roi):
        """Returns (crop_uint8_squared, crop_tensor, roi_source,
        coarse_mask_for_debug_or_None)."""
        H, W = gray.shape[:2]

        if roi is not None:
            x, y, w, h = roi
            x1, y1, x2, y2 = expand_bbox(x, y, w, h, W, H, self.context_ratio)
            cropped = gray[y1:y2, x1:x2]
            squared, tensor = self._to_tensor(cropped)
            return squared, tensor, "manual_roi"

        coarse_squared, coarse_tensor = self._to_tensor(gray)
        coarse_mask = self._segment(coarse_tensor)  # binary, image_size x image_size
        bbox_canvas = largest_component_bbox(coarse_mask)

        if bbox_canvas is None:
            # Segmenter found nothing - fall back to a center crop rather
            # than failing outright. Flagged distinctly in the response.
            side = min(H, W)
            y1 = (H - side) // 2
            x1 = (W - side) // 2
            cropped = gray[y1:y1 + side, x1:x1 + side]
            squared, tensor = self._to_tensor(cropped)
            return squared, tensor, "center_crop_fallback"

        cx, cy, cw, ch = bbox_canvas
        ox, oy, ow, oh = map_bbox_from_canvas_to_original(cx, cy, cw, ch, H, W, self.image_size)
        x1, y1, x2, y2 = expand_bbox(ox, oy, ow, oh, W, H, self.context_ratio)
        cropped = gray[y1:y2, x1:x2]
        if cropped.size == 0:
            # Degenerate crop (shouldn't normally happen, but never silently
            # pass an empty array to the model) - fall back safely.
            side = min(H, W)
            y1 = (H - side) // 2
            x1 = (W - side) // 2
            cropped = gray[y1:y1 + side, x1:x1 + side]
            squared, tensor = self._to_tensor(cropped)
            return squared, tensor, "center_crop_fallback"

        squared, tensor = self._to_tensor(cropped)
        return squared, tensor, "segmentation_predicted_mask"

    def run(self, image_bytes, roi=None):
        t0 = time.time()

        gray = load_gray_as_rgb_from_bytes(image_bytes)
        crop_squared, x, roi_source = self._locate_and_crop(gray, roi)

        cam_engine = GradCAMpp(self.classifier, self.cam_layer)
        cam, probs = cam_engine(x, class_idx=1, image_size=self.image_size)
        cam_engine.remove()

        malignant_prob = float(probs[1])
        pred_idx = int(malignant_prob >= self.threshold)
        prediction = self.label_names[pred_idx]
        confidence = float(probs[pred_idx])

        fine_mask = self._segment(x) * 255

        heatmap_b64 = self._encode_heatmap_overlay(crop_squared, cam)
        mask_b64 = self._encode_png(fine_mask)

        processing_ms = int((time.time() - t0) * 1000)

        return {
            "prediction": prediction,
            "confidence": round(confidence, 4),
            "probabilities": {
                self.label_names[0]: round(float(probs[0]), 4),
                self.label_names[1]: round(float(probs[1]), 4),
            },
            "threshold_used": self.threshold,
            "heatmap_png_base64": heatmap_b64,
            "segmentation_mask_png_base64": mask_b64,
            "roi_source": roi_source,
            "pipeline_version": PIPELINE_VERSION,
            "processing_ms": processing_ms,
            "model_metadata": {
                "image_size": self.image_size,
                "label_names": self.label_names,
                "test_metrics": self.test_metrics,
                "roi_caveat": self.roi_caveat,
                "recommended_api_flow": self.recommended_api_flow,
                "context_ratio_used": self.context_ratio,
                "context_ratio_source": "default_assumed_not_confirmed_by_ai_team" if self.context_ratio_is_default else "bundle",
            },
        }

    @staticmethod
    def _encode_png(arr):
        ok, buf = cv2.imencode(".png", arr)
        if not ok:
            raise RuntimeError("PNG encoding failed.")
        return base64.b64encode(buf.tobytes()).decode("ascii")

    @staticmethod
    def _encode_heatmap_overlay(gray, cam):
        cam_color = (cam * 255).astype(np.uint8)
        cam_color = cv2.applyColorMap(cam_color, cv2.COLORMAP_JET)
        base = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)
        overlay = cv2.addWeighted(base, 0.6, cam_color, 0.4, 0)
        overlay_rgb = cv2.cvtColor(overlay, cv2.COLOR_BGR2RGB)
        buf = io.BytesIO()
        Image.fromarray(overlay_rgb).save(buf, format="PNG")
        return base64.b64encode(buf.getvalue()).decode("ascii")
