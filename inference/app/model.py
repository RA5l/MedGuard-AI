"""
Model architecture, preprocessing, and Grad-CAM++ - ported 1:1 from the
training notebook (MedGuard_MultiTask_v3_cost_sensitive_strong_classifier.ipynb).

IMPORTANT: every function/class here is copied to match the notebook exactly
(same layer order, same crop math, same normalization), because a classifier
is only valid on inputs that match its training distribution. Do not "tidy up"
this code without re-validating against the notebook - small preprocessing
differences (e.g. percentile clip values, CLAHE clip_limit) can silently
degrade accuracy.
"""
import cv2
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
import timm
import segmentation_models_pytorch as smp
import albumentations as A
from albumentations.pytorch import ToTensorV2

MEAN = [0.485, 0.456, 0.406]
STD = [0.229, 0.224, 0.225]


# Classifier (notebook cell 21)
class ClsModel(nn.Module):
    def __init__(self, name, num_classes=2, drop=0.40):
        super().__init__()
        self.backbone = timm.create_model(name, pretrained=False, num_classes=0, global_pool="avg")
        f = self.backbone.num_features
        self.head = nn.Sequential(
            nn.LayerNorm(f),
            nn.Dropout(drop),
            nn.Linear(f, 256),
            nn.SiLU(),
            nn.Dropout(drop),
            nn.Linear(256, num_classes),
        )

    def forward(self, x):
        return self.head(self.backbone(x))


# Segmenter (notebook cell 29)
def build_segmenter(encoder_name: str, device: torch.device):
    # pretrained=False here - we always overwrite with the trained state_dict
    # from the bundle right after construction. encoder_weights=None avoids a
    # network download for ImageNet/noisy-student weights at inference time.
    m = smp.Unet(encoder_name=encoder_name, encoder_weights=None,
                 in_channels=3, classes=1, activation=None)
    return m.to(device)


# Grad-CAM++ (notebook cell 34)
def find_last_conv(module: nn.Module):
    last_name, last = None, None
    for name, m in module.named_modules():
        if isinstance(m, nn.Conv2d):
            last_name, last = name, m
    return last_name, last


class GradCAMpp:
    def __init__(self, model, target_layer):
        self.model = model
        self.acts = None
        self.grads = None
        self.fh = target_layer.register_forward_hook(self._fh)
        self.bh = target_layer.register_full_backward_hook(self._bh)

    def _fh(self, m, i, o):
        self.acts = o

    def _bh(self, m, gi, go):
        self.grads = go[0]

    def remove(self):
        self.fh.remove()
        self.bh.remove()

    def __call__(self, x, class_idx=1, image_size=384):
        self.model.eval()
        self.model.zero_grad(set_to_none=True)
        logits = self.model(x)
        score = logits[:, class_idx].sum()
        score.backward()
        g, a = self.grads, self.acts
        g2, g3 = g.pow(2), g.pow(3)
        sa = a.sum(dim=(2, 3), keepdim=True)
        denom = 2 * g2 + sa * g3
        denom = torch.where(denom != 0, denom, torch.ones_like(denom))
        alpha = g2 / denom
        weights = (alpha * torch.relu(g)).sum(dim=(2, 3), keepdim=True)
        cam = torch.relu((weights * a).sum(dim=1, keepdim=True))
        cam = F.interpolate(cam, size=(image_size, image_size), mode="bilinear", align_corners=False)
        cam = cam.squeeze().detach().cpu().numpy()
        cam = (cam - cam.min()) / (cam.max() - cam.min() + 1e-8)
        probs = torch.softmax(logits, 1).detach().cpu().numpy()[0]
        return cam, probs


# Preprocessing (notebook cell 13)
def normalize_uint8(img, lo_pct=0.5, hi_pct=99.7):
    img = img.astype(np.float32)
    lo, hi = np.percentile(img, (lo_pct, hi_pct))
    img = np.clip(img, lo, hi)
    img = (img - lo) / (hi - lo + 1e-6)
    return (img * 255).astype(np.uint8)


def resize_pad(img, size, is_mask=False):
    h, w = img.shape[:2]
    scale = size / max(h, w)
    nh, nw = max(1, int(h * scale)), max(1, int(w * scale))
    interp = cv2.INTER_NEAREST if is_mask else cv2.INTER_LINEAR
    r = cv2.resize(img, (nw, nh), interpolation=interp)
    canvas = np.zeros((size, size), dtype=img.dtype)
    y0, x0 = (size - nh) // 2, (size - nw) // 2
    canvas[y0:y0 + nh, x0:x0 + nw] = r
    return canvas


def expand_bbox(x, y, w, h, W, H, ctx):
    """Same context-expansion math used to build training crops (cell 13).
    Used here when a manual ROI box (e.g. drawn by a radiologist) is supplied,
    so the inference-time crop matches the training-time crop geometry."""
    cx, cy = x + w / 2.0, y + h / 2.0
    nw, nh = w * (1 + ctx), h * (1 + ctx)
    x1 = int(max(0, cx - nw / 2)); y1 = int(max(0, cy - nh / 2))
    x2 = int(min(W, cx + nw / 2)); y2 = int(min(H, cy + nh / 2))
    return x1, y1, x2, y2


def largest_component_bbox(mask_bin):
    """Verbatim from the training notebook (cell 13). Returns (x, y, w, h) of
    the largest connected component in a binary mask, or None if the mask is
    empty (no foreground pixels)."""
    n, lbl, stats, _ = cv2.connectedComponentsWithStats(mask_bin.astype(np.uint8), connectivity=8)
    if n <= 1:
        return None
    idx = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    x = stats[idx, cv2.CC_STAT_LEFT]; y = stats[idx, cv2.CC_STAT_TOP]
    w = stats[idx, cv2.CC_STAT_WIDTH]; h = stats[idx, cv2.CC_STAT_HEIGHT]
    return x, y, w, h


def map_bbox_from_canvas_to_original(x, y, w, h, orig_h, orig_w, canvas_size):
    """Inverts resize_pad's transform: given a bbox in the square
    canvas_size x canvas_size space that resize_pad() produced from an
    (orig_h, orig_w) image, returns the equivalent bbox in the original
    image's pixel coordinates. Needed because the coarse lesion mask is
    predicted on the resized/padded 384x384 input, but the actual crop for
    classification must be taken from the full-resolution original image."""
    scale = canvas_size / max(orig_h, orig_w)
    nh, nw = max(1, int(orig_h * scale)), max(1, int(orig_w * scale))
    y0, x0 = (canvas_size - nh) // 2, (canvas_size - nw) // 2
    # Remove padding offset, then undo the scale.
    orig_x = max(0, (x - x0) / scale)
    orig_y = max(0, (y - y0) / scale)
    orig_w_box = w / scale
    orig_h_box = h / scale
    return int(orig_x), int(orig_y), int(orig_w_box), int(orig_h_box)


def load_gray_as_rgb_from_bytes(image_bytes: bytes) -> np.ndarray:
    arr = np.frombuffer(image_bytes, dtype=np.uint8)
    gray = cv2.imdecode(arr, cv2.IMREAD_GRAYSCALE)
    if gray is None:
        raise ValueError("Could not decode image bytes (unsupported or corrupt format).")
    return gray


def eval_transform(mean=None, std=None):
    # Identical to `eval_tf` in the notebook (cell 19) - CLAHE + ImageNet
    # normalization, no augmentation (this is inference, not training).
    # mean/std default to ImageNet stats but can be overridden by the
    # bundle's own config (V7's config.mean / config.std happen to be the
    # same ImageNet values, read dynamically rather than assumed).
    return A.Compose([
        A.CLAHE(clip_limit=2.0, p=1.0),
        A.Normalize(mean=mean or MEAN, std=std or STD),
        ToTensorV2(),
    ])
