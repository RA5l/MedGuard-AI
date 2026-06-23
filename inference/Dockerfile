# MedGuard Inference Service
# CPU-only image by default. For GPU, switch the base image to a CUDA-enabled
# PyTorch image (e.g. pytorch/pytorch:2.4.1-cuda12.1-cudnn9-runtime) and
# install the matching torch build in requirements.txt.

FROM python:3.11-slim

# System libs needed by opencv-python-headless and image codecs.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

# Mount or bake the trained bundle at this path. See README for details.
ENV MODEL_BUNDLE_PATH=/app/weights/medguard_multitask_bundle_v3_cost_sensitive.pth
ENV INFERENCE_DEVICE=cpu

EXPOSE 8001

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
