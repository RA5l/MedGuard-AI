"""
Builds a dummy .pth bundle with the exact structure the real trained bundle
has (same keys, same encoder names, same shapes), but with RANDOM weights.
This is only for verifying the serving code works end to end (loads,
predicts, returns well-formed JSON) - predictions from this dummy bundle are
meaningless. Swap in the real bundle for actual use.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import torch
from app.model import ClsModel, build_segmenter

CLS_ENCODER = "tf_efficientnetv2_s.in21k_ft_in1k"
SEG_ENCODER = "timm-efficientnet-b3"

device = torch.device("cpu")

print("Building dummy classifier...")
classifier = ClsModel(CLS_ENCODER, num_classes=2, drop=0.40).to(device)

print("Building dummy segmenter...")
segmenter = build_segmenter(SEG_ENCODER, device)

bundle = {
    "classifier_state_dict": classifier.state_dict(),
    "segmenter_state_dict": segmenter.state_dict(),
    "cls_encoder": CLS_ENCODER,
    "seg_encoder": SEG_ENCODER,
    "image_size": 384,
    "label_names": ["Benign", "Malignant"],
    "threshold": 0.42,
    "context_crop_ratio": 0.60,
    "test_metrics": {"note": "dummy bundle - not real metrics"},
    "training_notes": {
        "roi_caveat": "Crops are generated using ground-truth ROI masks. For production/API, replace this with predicted segmentation/detection or a non-mask crop.",
    },
}

out_path = os.path.join(os.path.dirname(__file__), "dummy_bundle.pth")
torch.save(bundle, out_path)
print(f"Saved dummy bundle to {out_path}")
