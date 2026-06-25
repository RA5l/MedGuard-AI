<div align="center">

#  MedGuard AI 

### AI-Powered Mammography Screening & Clinical Decision Support Platform

**SDA AI Engineering Bootcamp**

---

![Bootcamp](https://img.shields.io/badge/SDA-AI%20Engineering%20Bootcamp-1a7f5a?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Completed-brightgreen?style=for-the-badge)
![License](https://img.shields.io/badge/License-Academic-blue?style=for-the-badge)

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?style=flat-square&logo=fastapi)
![PyTorch](https://img.shields.io/badge/PyTorch-AI-EE4C2C?style=flat-square&logo=pytorch)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=flat-square&logo=supabase)
![Docker](https://img.shields.io/badge/Docker-Inference-2496ED?style=flat-square&logo=docker)

</div>

---

> **Academic Submission — Publication-Quality Documentation**

---

##  Key Highlights 

| | |
|---|---|
|  **Multitask Deep Learning** | EfficientNetV2-S classifier + U-Net segmenter in a single bundle | 
|  **Explainable AI** | Grad-CAM++ heatmap + pixel-level segmentation mask per scan | 
|  **Microservice Architecture** | 3 independent services: Frontend · Backend · Dockerized Inference | 
|  **Clinical-Grade Security** | Defense in Depth · RBAC at 3 layers · Supabase RLS · Audit Trail | 
|  **WCAG 2.1 Compliant** | Color contrast · accessible design system throughout | 
|  **PDF Report Generation** | 7-section clinical report with BI-RADS, density, and physician sign-off | 
|  **Real-time Workflow** | Supabase Realtime assignment notifications between doctors & radiologists | 
|  **Privacy by Design** | Patient alias only — no real names stored anywhere | 

---

## Abstract

MedGuard AI is a full-stack clinical decision-support platform for breast cancer screening based on digital mammography. The system combines a multitask deep learning model (simultaneous lesion classification and segmentation) with a structured radiological workflow that connects administrators, physicians, and radiologists. The AI model produces a binary malignancy prediction, per-class probabilities, a Grad-CAM++ saliency heatmap, and a pixel-level lesion segmentation mask. These outputs are presented to the physician as assistive information only; the platform enforces physician authority over every clinical decision through role-based access control, a structured reporting workflow, and an append-only audit trail. The backend is built on FastAPI and Supabase (PostgreSQL with Row-Level Security), and the frontend is a React/TypeScript single-page application with a dark-first clinical design system.

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [System Overview](#2-system-overview)
3. [Implemented Features](#3-implemented-features)
4. [End-to-End Workflow](#4-end-to-end-workflow)
5. [Architecture](#5-architecture)
6. [Directory Structure](#6-directory-structure)
7. [Technology Stack](#7-technology-stack)
8. [AI Model Details](#8-ai-model-details)
9. [Dataset Information](#9-dataset-information)
10. [Installation & Setup](#10-installation--setup)
11. [Environment Variables](#11-environment-variables)
12. [Running the System](#12-running-the-system)
13. [Usage Guide](#13-usage-guide)
14. [Clinical Report Generation Pipeline](#14-clinical-report-generation-pipeline)
15. [API Documentation](#15-api-documentation)
16. [Directory Reference](#16-directory-reference)
17. [Key Dependencies](#17-key-dependencies)
18. [Performance Metrics](#18-performance-metrics)
19. [Current Capabilities & Known Limitations](#19-current-capabilities--known-limitations)
20. [Future Work](#20-future-work)
21. [Reproducibility](#21-reproducibility)
22. [Security & Privacy](#22-security--privacy)
23. [Troubleshooting](#23-troubleshooting)
24. [Quick Start](#24-quick-start)
25. [License & Legal](#25-license--legal)
26. [Project Team](#26-project-team)
27. [Acknowledgements](#27-acknowledgements)
28. [References](#28-references)
29. [BibTeX Citation](#29-bibtex-citation)

---

## 1. Problem Statement

Breast cancer is among the leading causes of cancer mortality worldwide. Early detection through mammographic screening significantly improves patient outcomes, but manual radiological interpretation is time-intensive, subject to inter-reader variability, and constrained by radiologist availability. Existing AI-assisted tools often operate as black boxes, provide binary outputs without localization, and do not integrate into a structured clinical workflow that preserves physician authority.

MedGuard AI addresses these gaps by:

- Automating initial mammographic triage using a multitask deep learning model.
- Providing lesion localization (segmentation mask) and saliency attribution (Grad-CAM++) alongside a binary prediction.
- Integrating the AI output into a structured radiology reporting workflow with explicit physician sign-off.
- Maintaining a complete, immutable audit trail of every clinical action.
- Enforcing role-based access so that AI predictions are assistive, never final.

---

## 2. System Overview

MedGuard AI consists of three independently deployable services that communicate over HTTP:

| Service | Technology | Default Port | Responsibility |
|---|---|---|---|
| **Inference Service** | FastAPI + PyTorch | `8001` | Runs the AI model; stateless; no database access |
| **Application Backend** | FastAPI + Supabase | `8000` | Business logic, authentication, orchestration |
| **Frontend** | React + Vite | `5173` | Clinical UI for all user roles |

Data persistence is managed entirely by **Supabase** (hosted PostgreSQL), which also handles authentication (JWT), file storage (mammogram images, AI outputs), and Row-Level Security policies.

```
Browser
  │
  ▼
React SPA (Vite, port 5173)
  │  Supabase JS SDK (direct DB calls, RLS-scoped)
  │  Axios (calls to Application Backend)
  ▼
Application Backend (FastAPI, port 8000)
  │  supabase-py (admin client, bypasses RLS for orchestration)
  │  httpx (calls Inference Service)
  ▼
Inference Service (FastAPI, port 8001)
  │  PyTorch, timm, smp, Albumentations
  ▼
MedGuard_multitask_bundle_v1.pth
  (classifier + segmenter weights, thresholds, metadata)
```

---

## 3. Implemented Features

### Authentication & Access Control

| Feature | Details |
|---|---|
| Email/password login | Via Supabase Auth; JWT returned to frontend |
| Three user roles | `admin`, `doctor`, `radiologist` |
| Role-based route protection | Frontend `ProtectedRoute`; backend `require_role` dependency |
| User creation | Admin-only; creates Supabase auth user + DB profile via RPC |
| Account deactivation | Admin-only soft deactivation (`is_active = false`) |
| Session persistence | Supabase session stored in browser; `AuthContext` resolves on mount |

### Case Management

| Feature | Details |
|---|---|
| Case creation | Doctors/admins; auto-generated `case_code` |
| Patient alias | Privacy-preserving identifier instead of real name |
| Status lifecycle | `pending → processing → ai_complete → assigned → in_review → reviewed → reported → archived` |
| Priority levels | 0 (Routine), 1 (Low), 2 (High), 3 (Urgent) |
| Soft delete | Admin-only; sets `deleted_at`, `deleted_by`, `delete_reason`; hidden from dashboards |
| Role-scoped visibility | Admins see all cases; doctors see assigned cases; radiologists see assigned cases only |

### Scan Management

| Feature | Details |
|---|---|
| Upload formats | PNG, JPEG, AVIF, WebP, DICOM (MIME), generic binary |
| Size limit | 20 MB per file |
| Storage | Converted to PNG; uploaded to Supabase Storage (`mammograms/{schema}/{case_id}/{uuid}.png`) |
| View types | RCC, RMLO, LCC, LMLO (and others; stored as `scan_view_type` enum) |
| Laterality | Recorded per scan |
| Audit | Every upload logged to `audit_logs` |

### AI Analysis

| Feature | Details |
|---|---|
| Trigger | Doctor/admin POST to `/api/ai/analyze/{scan_id}` |
| Localization | Segmentation-first: coarse mask → largest component → context-expanded crop |
| Classification | Binary: Benign / Malignant |
| Confidence | Float probability for the predicted class |
| Heatmap | Grad-CAM++ overlay PNG, base64-encoded, uploaded to Storage |
| Segmentation mask | Fine-pass binary mask PNG, base64-encoded, uploaded to Storage |
| ROI source | Reported per request: `manual_roi`, `segmentation_predicted_mask`, `center_crop_fallback` |
| Result storage | `ai_results` table; upsert on `scan_id` (latest run only) |
| Case status bump | Advances case to `ai_complete` (never regresses a further-along status) |

### Radiology Assignment Workflow

| Feature | Details |
|---|---|
| Send to Radiologist | Doctor selects radiologist; creates `case_assignments` row; case → `assigned` |
| Radiologist worklist | Radiologist sees pending assignments; dedicated `/worklist` page |
| Accept | Radiologist accepts; case → `in_review` |
| Reject | Radiologist rejects with reason; case → `rejected` |
| Request More Info | Radiologist requests additional information; doctor notified |
| Doctor reply | Doctor replies to info request; assignment reset to `pending` |
| Re-assignment | Doctor can re-assign after rejection or info request |
| Completion | Radiologist marks complete after finalizing report; case → `reported` |
| Realtime notifications | Supabase Realtime channel on `case_assignments`; toast notifications for status changes |

### Clinical Reporting

| Feature | Details |
|---|---|
| AI-generated summary | Draft text from AI result metadata, editable by physician |
| Findings section | Free-text structured radiologist observations |
| Breast density | Dropdown: A (Almost entirely fatty), B (Scattered fibroglandular), C (Heterogeneously dense), D (Extremely dense) |
| Impression | Overall radiologist assessment |
| BI-RADS category | Physician-assigned; not derived from AI classification |
| Recommendation | Separate editable field |
| Doctor notes | Internal notes field |
| PDF export | jsPDF; all seven sections in clinical order; header band, footer with physician name and timestamps |
| Finalization | Boolean flag; finalized reports locked from casual edits |
| Audit | Report creation, update, finalization, and PDF export all logged |

### Dashboard

| Feature | Details |
|---|---|
| Stats cards | Active studies, awaiting review, AI analysis ready, urgent findings |
| Recent cases table | Last 5 cases with status quick-edit |
| Radiologist worklist | Cases pending review, AI-flagged cases surfaced first |
| Recent clinical reports | Finalized and draft reports |
| High priority findings | Cases with priority ≥ 3 |
| Clinical workflow actions | Quick links to upload, cases, reports |
| Audit trail | Admin-only; recent audit log entries |
| Assignment activity | Doctor role: recent radiologist responses |
| Worklist quick view | Radiologist role: pending assignments with navigation |

### Admin Panel

| Feature | Details |
|---|---|
| User list | All users with role, specialty, active status |
| Create user | Email, password, role, specialty; Supabase auth + DB profile |
| Deactivate user | Soft deactivation; audit logged |

---

## 4. End-to-End Workflow

```
1. ADMIN creates user accounts (doctors, radiologists)

2. DOCTOR creates a case (case_code, patient_alias, priority)

3. DOCTOR uploads mammography scans (RCC, RMLO, LCC, LMLO)
   └─ Scans converted to PNG, stored in Supabase Storage

4. DOCTOR triggers AI analysis on a scan
   └─ Backend fetches image from Storage
   └─ Calls Inference Service POST /predict
   └─ Inference Service:
       a. Segmenter runs on full image → coarse lesion mask
       b. Largest connected component → ROI bounding box
       c. ROI context-expanded, cropped from original image
       d. Classifier + Grad-CAM++ run on crop → prediction, confidence, heatmap
       e. Segmenter runs again on crop → fine lesion mask
   └─ Backend uploads heatmap + mask to Storage
   └─ Backend inserts ai_results row
   └─ Case status advances to ai_complete

5. DOCTOR views AI Results page
   └─ Sees prediction, confidence, heatmap, segmentation mask
   └─ AI output is informational only

6. DOCTOR sends case to RADIOLOGIST
   └─ Selects radiologist from list
   └─ Assignment created (status: pending); case → assigned

7. RADIOLOGIST receives notification (Supabase Realtime)
   └─ Opens worklist → sees pending assignment
   └─ Can Accept / Reject / Request More Info

8a. RADIOLOGIST accepts → Case → in_review
8b. RADIOLOGIST rejects (with reason) → Case → rejected; doctor can re-assign
8c. RADIOLOGIST requests more info → Doctor notified; can reply

9. RADIOLOGIST opens Report page
   └─ Generates AI summary → fills Findings, Density, Impression, BI-RADS
   └─ Finalizes report → marks assignment Complete → Case → reported

10. DOCTOR / RADIOLOGIST exports PDF report
    └─ Audit log entry created

11. ADMIN reviews audit trail at any time
```

---

## 5. Architecture

### System Layer Diagram

```
┌──────────────────────────────────────────────────────┐
│                    FRONTEND (React)                   │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌───────────┐  │
│  │  Auth  │  │ Cases  │  │Reports │  │ Assignment│  │
│  │Context │  │ Hooks  │  │ Service│  │  Service  │  │
│  └───┬────┘  └───┬────┘  └───┬────┘  └─────┬─────┘  │
│      └───────────┴───────────┴──────────────┘        │
│                  Supabase JS SDK                      │
│         getScopedQuery() → schema('dev')              │
└────────────────────────┬──────────────────────────────┘
                         │ HTTPS
                         ▼
┌────────────────────────────────────────────────────┐
│              SUPABASE (PostgreSQL)                 │
│  Schema: dev (development) / public (production)  │
│  Auth · Storage · Realtime · Row-Level Security   │
└────────────────────────────────────────────────────┘
                         ▲
                         │ supabase-py (service role)
┌────────────────────────┴──────────────────────────┐
│           APPLICATION BACKEND (FastAPI)            │
│  /api/auth · /api/cases · /api/scans · /api/ai   │
│  JWT validation · require_role() dependency       │
└────────────────────────┬──────────────────────────┘
                         │ httpx POST /predict
┌────────────────────────▼──────────────────────────┐
│     INFERENCE SERVICE (FastAPI · Docker)           │
│  GET /health · POST /predict                      │
│  Stateless — no DB, no Storage access             │
└────────────────────────┬──────────────────────────┘
                         │ torch.load()
┌────────────────────────▼──────────────────────────┐
│      MedGuard_multitask_bundle_v1.pth             │
│  EfficientNetV2-S classifier                      │
│  U-Net + EfficientNet-B3 segmenter                │
│  Grad-CAM++ · thresholds · metadata               │
└───────────────────────────────────────────────────┘
```

### Frontend Feature Architecture

```
Layer         Location                    Rule
────────────  ──────────────────────────  ──────────────────────────────
Routing       src/App.tsx                 Composition only; no logic
Layout        src/layouts/               Structure and chrome
Pages         features/*/pages/          Orchestrate hooks and components
Hooks         features/*/hooks/          Domain state; calls services
Services      features/*/services/       Supabase/API calls only; no state
Shared UI     src/components/            Stateless or minimal local state
Utilities     src/utils/                 Pure functions; no React imports
Design        src/styles/, src/lib/      CSS tokens, Tailwind config
```

### Database Schema

| Table | Purpose |
|---|---|
| `cases` | Patient screening cases with status lifecycle and soft delete |
| `scans` | Uploaded mammogram images with view type and laterality |
| `ai_results` | AI inference outputs: prediction, confidence, heatmap URL, mask URL |
| `reports` | Clinical reports: BI-RADS, findings, impression, finalization |
| `users` | User profiles with role, specialty, active status |
| `roles` | `admin`, `doctor`, `radiologist` |
| `audit_logs` | Immutable append-only event log |
| `case_assignments` | Radiology assignment workflow with status and reply chain |

---

## 6. Directory Structure

```
MedGuard-AI/
│
├── backend/                        # Application backend (FastAPI)
│   ├── app/
│   │   ├── config.py               # Settings from environment variables
│   │   ├── database.py             # Supabase client instances (anon + admin)
│   │   ├── main.py                 # FastAPI app, CORS middleware
│   │   ├── routers/
│   │   │   ├── auth.py             # Login, logout, user management
│   │   │   ├── cases.py            # Case CRUD endpoints
│   │   │   ├── scans.py            # Scan upload + PNG conversion
│   │   │   ├── ai.py               # AI analysis orchestration
│   │   │   └── dependencies.py     # JWT validation, role guards
│   │   └── schemas/                # Pydantic request/response models
│   └── requirements.txt
│
├── inference/                      # AI inference microservice (stateless)
│   ├── app/
│   │   ├── main.py                 # FastAPI: /health, /predict
│   │   ├── inference.py            # InferenceEngine; segmentation-first pipeline
│   │   └── model.py                # ClsModel, U-Net, GradCAMpp, preprocessing
│   ├── scripts/
│   │   ├── make_dummy_bundle.py    # Generates dummy weights for testing
│   │   └── smoke_test.py           # API contract test (no server needed)
│   ├── weights/                    # ← NOT tracked by git (.gitignore)
│   │   └── MedGuard_multitask_bundle_v1.pth   # download from HuggingFace
│   ├── Dockerfile                  # CPU-only; python:3.11-slim
│   └── requirements.txt
│
├── frontend/                       # React SPA
│   ├── src/
│   │   ├── features/
│   │   │   ├── auth/               # Login, AuthContext, ProtectedRoute
│   │   │   ├── cases/              # Case list, case details, scan gallery
│   │   │   ├── ai-results/         # AI results viewer, Circular Gauge, Canvas Workstation
│   │   │   ├── reports/            # Clinical report + jsPDF export
│   │   │   ├── upload/             # Scan upload
│   │   │   ├── dashboard/          # Role-aware dashboard + audit log
│   │   │   ├── admin/              # User management
│   │   │   └── assignment/         # Realtime assignment workflow
│   │   ├── components/             # CircularGauge, StatusQuickEdit, Spinner…
│   │   ├── layouts/                # AppLayout, Navbar, Sidebar
│   │   └── lib/                    # Supabase client, audit log, design tokens
│   ├── tailwind.config.ts
│   └── ARCHITECTURE_DECISIONS.md
│
├── notebooks/                      # AI training pipeline
│   └── MedGuard_MultiTask_v1.ipynb # Full training notebook (see §9)
│
├── start-all.ps1                   # Starts all three services (Windows)
└── README.md
```

> **`inference/weights/` is in `.gitignore`** — weights are hosted on HuggingFace (see §8).

---

## 7. Technology Stack

### Frontend

| Library | Version | Purpose |
|---|---|---|
| React | 19.2.6 | UI framework |
| TypeScript | ~6.0.2 | Static typing |
| Vite | 8.0.12 | Build tool |
| React Router DOM | 7.16.0 | Client-side routing |
| @supabase/supabase-js | 2.107.0 | Database, auth, storage, realtime |
| Axios | 1.17.0 | HTTP client |
| fabric.js | — | Dual-view canvas workstation |
| Framer Motion | 12.40.0 | Page animations |
| jsPDF | 4.2.1 | PDF report generation |
| Tailwind CSS | 4.3.0 | Utility-first CSS |

### Application Backend

| Library | Version | Purpose |
|---|---|---|
| FastAPI | 0.136.3 | Web framework |
| supabase-py | 2.30.0 | Supabase client |
| python-jose | 3.3.0 | JWT decoding |
| httpx | 0.28.1 | Async HTTP client |
| Pillow | 10.3.0 | Image conversion |

### Inference Service

| Library | Version | Purpose |
|---|---|---|
| PyTorch | 2.4.1 | Deep learning inference |
| timm | latest | EfficientNetV2-S backbone |
| segmentation-models-pytorch | 0.5.0 | U-Net segmenter |
| Albumentations | 1.4.18 | CLAHE + normalization |
| OpenCV (headless) | 4.10.0.84 | Image processing, Grad-CAM colormap |

### Infrastructure

| Component | Details |
|---|---|
| Supabase | PostgreSQL · Auth · Storage · Realtime · RLS |
| Schema | `dev` (development) / `public` (production) — single config change |
| Docker | Inference service containerized |

---

## 8. AI Model Details

### Model Weights

 **[HuggingFace: Raseel5/MedGuard-AI-Weights](https://huggingface.co/Raseel5/MedGuard-AI-Weights)** 

| File | Description |
|---|---|
| `MedGuard_multitask_bundle_v1.pth` | Combined bundle — used by inference service |
| `MedGuard_classifier_v1.pth` | Classifier weights only |
| `MedGuard_segmenter_v1.pth` | Segmenter weights only |
| `MedGuard_summary_v1.json` | Training summary and metrics |

### Performance (Test Set: 680 samples)

**Classification**

| Metric | Value |
|---|---|
| AUC | 0.7139 |
| Balanced Accuracy | 0.6450 |
| Malignant Recall | **0.9754** |
| Tuned Threshold | 0.20 |
| False Negatives | 7 |
| False Positives | 318 |

> Threshold tuned to prioritize sensitivity — minimizing false negatives is critical in cancer screening.

**Segmentation**

| Metric | Value |
|---|---|
| Dice Score | 0.8786 |
| IoU | 0.7997 |

**Explainability (Grad-CAM++)**

| Metric | Value |
|---|---|
| Mean CAM-IoU | 0.5234 |
| CAM-IoU > 0.25 | 97.5% |

### Architecture

| Component | Architecture |
|---|---|
| Classifier | EfficientNetV2-S (`tf_efficientnetv2_s.in21k_ft_in1k`) + custom head |
| Segmenter | U-Net + EfficientNet-B3 encoder |
| Explainability | Grad-CAM++ on last conv layer |
| Input size | 384 × 384 |
| Training | Cost-sensitive (class imbalance) |

### Inference Pipeline (Segmentation-First)

```
Step 1 — Coarse localization
  Full image → segmenter → coarse mask → largest component bbox

Step 2 — Map to original coordinates
  Expand bbox with context_crop_ratio → x1, y1, x2, y2

Step 3 — Crop and classify
  Cropped image → classifier + GradCAMpp → prediction, confidence, heatmap

Step 4 — Fine segmentation
  Same crop → segmenter → fine mask

Step 5 — Return
  prediction · confidence · heatmap_base64 · mask_base64 · roi_source · processing_ms
```

**ROI source priority:**

| Priority | `roi_source` | Condition |
|---|---|---|
| 1 | `manual_roi` | Doctor supplied coordinates |
| 2 | `segmentation_predicted_mask` | Segmenter found lesion |
| 3 | `center_crop_fallback` | Empty mask — **clinically unvalidated** |

---

## 9. Dataset Information

| Property | Details |
|---|---|
| Dataset | CBIS-DDSM (Curated Breast Imaging Subset of DDSM) |
| Source | The Cancer Imaging Archive (TCIA) |
| Access | https://www.cancerimagingarchive.net/collection/cbis-ddsm/ |
| Test set | 680 samples |
| Training | Cost-sensitive to address class imbalance |

> Dataset images are **not included** in this repository — see [§25 License & Legal](#25-license--legal).

**Training Notebook:** `notebooks/MedGuard_MultiTask_v1.ipynb`

**Citation:**
> Lee, R. S., et al. (2017). A curated mammography data set for use in computer-aided detection and diagnosis research. *Scientific Data*, 4, 170177. https://doi.org/10.1038/sdata.2017.177

---

## 10. Installation & Setup

### Prerequisites

| Requirement | Version |
|---|---|
| Python | ≥ 3.11 |
| Node.js | ≥ 18 |
| Supabase account | Free tier sufficient |

### Clone & Download Weights

```bash
git clone https://github.com/RA5l/MedGuard-AI.git
cd MedGuard-AI

mkdir -p inference/weights
curl -L "https://huggingface.co/Raseel5/MedGuard-AI-Weights/resolve/main/MedGuard_multitask_bundle_v1.pth?download=true" \
     -o inference/weights/MedGuard_multitask_bundle_v1.pth
```

### Dependencies

```bash
# Backend
cd backend && python -m venv venv && venv\Scripts\activate
pip install -r requirements.txt

# Inference
cd inference && python -m venv venv && venv\Scripts\activate
pip install -r requirements.txt

# Frontend
cd frontend && npm install
```

---

## 11. Environment Variables

### Backend (`backend/.env`)

```env
SUPABASE_URL=https://<project-id>.supabase.co
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
SUPABASE_JWT_SECRET=<jwt-secret>
APP_ENV=development
DB_SCHEMA=dev
INFERENCE_SERVICE_URL=http://localhost:8001
```

### Inference Service

```env
MODEL_BUNDLE_PATH=weights/MedGuard_multitask_bundle_v1.pth
INFERENCE_DEVICE=cpu
```

### Frontend (`frontend/.env`)

```env
VITE_SUPABASE_URL=https://<project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_DB_SCHEMA=dev
VITE_API_URL=http://localhost:8000
```

> **Environment switching:** Change `DB_SCHEMA=dev` → `DB_SCHEMA=public` (and `VITE_DB_SCHEMA`) to move from development to production. No code changes required.

---

## 12. Running the System

### Option A — PowerShell (Windows, recommended)

```powershell
.\start-all.ps1
```

### Option B — Manual (three terminals)

```bash
# Terminal 1 — Inference
cd inference && source venv/bin/activate
MODEL_BUNDLE_PATH=weights/MedGuard_multitask_bundle_v1.pth uvicorn app.main:app --port 8001

# Terminal 2 — Backend
cd backend && source venv/bin/activate
uvicorn app.main:app --port 8000

# Terminal 3 — Frontend
cd frontend && npm run dev
```

### Option C — Docker (Inference only)

```bash
cd inference
docker build -t medguard-inference .
docker run --rm -p 8001:8001 \
  -v "$(pwd)/weights:/app/weights:ro" \
  -e MODEL_BUNDLE_PATH=/app/weights/MedGuard_multitask_bundle_v1.pth \
  medguard-inference
```

---

## 13. Usage Guide

### First-Time Setup (Supabase)

1. Create Supabase project
2. Run SQL migrations (dev schema, enums, RLS policies, `create_user_by_admin` RPC)
3. Enable Realtime: `ALTER PUBLICATION supabase_realtime ADD TABLE dev.case_assignments;`
4. Create storage bucket `mammograms`
5. Create first admin user via Supabase Dashboard

### Clinical Workflow

| Step | Role | Action |
|---|---|---|
| 1 | Admin | Create doctor/radiologist accounts |
| 2 | Doctor | Create case → upload scans |
| 3 | Doctor | AI Results → Run Analysis |
| 4 | Doctor | Send case to Radiologist |
| 5 | Radiologist | Worklist → Accept / Reject / Request Info |
| 6 | Radiologist | Reports → Finalize → Export PDF |
| 7 | Admin | Dashboard → Audit Trail |

---

## 14. Clinical Report Generation Pipeline

```
1. AI Generated Summary   — assembled from ai_results; fully editable
2. Findings               — free-text radiologist observations
3. Breast Density         — ACR category A / B / C / D
4. Impression             — overall radiologist assessment
5. BI-RADS Category       — physician-assigned (0–6); independent of AI
6. Recommendation         — screening / biopsy / ultrasound correlation
7. Doctor Notes           — internal notes; included in PDF
```

PDF: header band · all seven sections · physician name · timestamps · clinical disclaimer
Filename: `MedGuard-Report-{case_code}.pdf`

---

## 15. API Documentation

### Application Backend (`http://localhost:8000`)

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | None | Email/password login; returns JWT |
| `GET` | `/api/auth/me` | Bearer | Current user profile |
| `POST` | `/api/auth/create-user` | Admin | Create user account |
| `GET` | `/api/cases` | Bearer | List cases (role-scoped) |
| `POST` | `/api/cases` | Bearer | Create case |
| `POST` | `/api/scans` | Bearer | Upload scan |
| `GET` | `/api/scans/case/{case_id}` | Bearer | List scans for case |
| `POST` | `/api/ai/analyze/{scan_id}` | Doctor/Admin | Trigger AI analysis |

### Inference Service (`http://localhost:8001`)

**`GET /health`** — returns `status`, `device`, `threshold`, `image_size`, `pipeline_version`

**`POST /predict`** — `multipart/form-data`: `image` (required) + optional `roi_x/y/w/h`

Returns: `prediction` · `confidence` · `heatmap_png_base64` · `segmentation_mask_png_base64` · `roi_source` · `processing_ms`

---

## 16. Directory Reference

| Path | Description |
|---|---|
| `backend/app/routers/dependencies.py` | JWT validation; `require_role()` factory |
| `backend/app/routers/ai.py` | 7-step AI orchestration pipeline |
| `inference/app/inference.py` | `InferenceEngine`; segmentation-first pipeline |
| `inference/app/model.py` | Model classes, preprocessing (ported from notebook) |
| `notebooks/MedGuard_MultiTask_v1.ipynb` | Full training pipeline |
| `frontend/src/lib/supabaseClient.ts` | Schema-scoped Supabase client |
| `frontend/src/features/reports/utils/exportReportPdf.ts` | PDF generation |
| `frontend/ARCHITECTURE_DECISIONS.md` | Engineering decision log |

---

## 17. Key Dependencies

| Dependency | Purpose |
|---|---|
| `timm` | EfficientNetV2-S backbone |
| `segmentation-models-pytorch` | U-Net segmenter |
| `albumentations` | CLAHE + normalization preprocessing |
| `opencv-python-headless` | Image I/O, Grad-CAM colormap |
| `supabase-py` | Backend database client |
| `httpx` | Async HTTP client for inference calls |
| `fabric.js` | Interactive dual-view canvas workstation |
| `jsPDF` | Client-side PDF generation |
| `@supabase/supabase-js` | Frontend database + realtime client |

---

## 18. Performance Metrics

See [§8 AI Model Details](#8-ai-model-details) for full metrics.

Inference latency is returned as `processing_ms` per `/predict` call. The segmentation-first pipeline (coarse + fine pass) roughly doubles per-request compute vs. single-pass — not load-tested.

---

## 19. Current Capabilities & Known Limitations

### Capabilities

- Binary mammographic classification (Benign / Malignant) with calibrated threshold
- Automated lesion localization via segmentation-first ROI
- Grad-CAM++ saliency heatmap + pixel-level segmentation mask
- Complete RBAC clinical workflow (admin / doctor / radiologist)
- Structured seven-section clinical report with PDF export
- Realtime assignment notifications
- Immutable audit trail
- Dual-schema deployment (dev / public)

### Known Limitations

| Limitation | Details |
|---|---|
| Single scan per analysis | One image per `/predict` call |
| No DICOM native support | DICOM decoded via Pillow; metadata not parsed |
| Segmenter fallback | `center_crop_fallback` is clinically unvalidated |
| No AI history | Re-analysis overwrites previous result |
| CPU-only Docker | No GPU Dockerfile provided |

---

## 20. Future Work

- Manual ROI selection tool on canvas before analysis
- Multi-view fusion (RCC + RMLO + LCC + LMLO)
- AI analysis history (append-only)
- GPU-enabled Dockerfile
- Queue system (Celery) for inference scalability
- LLM-generated report drafts (Gemini integration)
- DICOM metadata parsing

---

## 21. Reproducibility

```bash
pip install -r inference/requirements.txt

mkdir -p inference/weights
curl -L "https://huggingface.co/Raseel5/MedGuard-AI-Weights/resolve/main/MedGuard_multitask_bundle_v1.pth?download=true" \
     -o inference/weights/MedGuard_multitask_bundle_v1.pth

cd inference
MODEL_BUNDLE_PATH=weights/MedGuard_multitask_bundle_v1.pth python scripts/smoke_test.py
# Expected: ALL SMOKE TESTS PASSED
```

---

## 22. Security & Privacy

| Standard | Implementation |
|---|---|
| **WCAG 2.1** | Color contrast compliance; icons + labels (never color alone) |
| **Principle of Least Privilege** | RBAC at frontend, backend, and database layers |
| **Defense in Depth** | 3 independent authorization layers |
| **Data Privacy by Design** | Patient alias only — no real names stored |
| **Auditability & Traceability** | Append-only audit log on every system action |
| **Secrets Management** | `.env` files; never committed; `.gitignore` enforced |
| **CORS** | Localhost regex in dev; explicit origins in production |

---

## 23. Troubleshooting

| Problem | Cause | Solution |
|---|---|---|
| `GET /health` returns 503 | Bundle not found | Verify `MODEL_BUNDLE_PATH`; download weights |
| `new row violates RLS policy` | Missing INSERT policy | Add RLS policy; verify role |
| Frontend empty radiologist list | `role_id` mismatch | Verify role UUID in `roles` table |
| CORS errors | Frontend port changed | Restart backend |
| `Cannot coerce result to single JSON` | Missing UPDATE RLS on `case_assignments` | Add policy for authenticated users |
| `Could not find column in schema cache` | PostgREST cache stale | Run `NOTIFY pgrst, 'reload schema';` in Supabase SQL Editor |

---

## 24. Quick Start

```bash
# 1. Clone
git clone https://github.com/RA5l/MedGuard-AI.git && cd MedGuard-AI

# 2. Download weights
mkdir -p inference/weights
curl -L "https://huggingface.co/Raseel5/MedGuard-AI-Weights/resolve/main/MedGuard_multitask_bundle_v1.pth?download=true" \
     -o inference/weights/MedGuard_multitask_bundle_v1.pth

# 3. Run (Windows)
.\start-all.ps1

# 4. Open http://localhost:5173
```

---

## 25. License & Legal

### Code License

This repository is released for **academic and research purposes only.**
All rights reserved by the authors © 2025–2026.

For commercial or clinical use, contact the authors directly.

### Dataset License

Trained on **CBIS-DDSM**, provided by The Cancer Imaging Archive (TCIA).

> CBIS-DDSM is available under **Creative Commons Attribution 3.0 (CC BY 3.0)**
> https://creativecommons.org/licenses/by/3.0/

Dataset images are **not distributed with this repository** per TCIA data usage policies.
Access the dataset: https://www.cancerimagingarchive.net/collection/cbis-ddsm/

Required attribution:
> Lee, R. S., et al. (2017). A curated mammography data set for use in computer-aided detection and diagnosis research. *Scientific Data*, 4, 170177. https://doi.org/10.1038/sdata.2017.177

### Clinical Disclaimer

> ⚠️ **This system is for research and educational purposes only.**
> MedGuard AI is **not** a certified medical device and is **not** approved for clinical diagnosis.
> AI outputs are assistive information only. All clinical decisions must be made by a licensed physician.
> The authors assume no liability for clinical use of this system.

---

## 26. Project Team

MedGuard AI was developed collaboratively as a graduation project during the SDAIA AI Engineering Bootcamp (Cohort RCP-6, Team 2).

| Name | Role | GitHub |
|---|---|---|
| Raseel Mohammed | Full-Stack Development, System Architecture, Platform Engineering & AI Integration | [@RA5l](https://github.com/RA5l) |
| Maram Alzahrani | AI Research, Model Development & Data Preparation | [@Maram1alzahrani](https://github.com/Maram1alzahrani) |
| Arwa Alshanbari | AI Research, Model Development & Data Preparation | [@Arwa-Alshanbari](https://github.com/Arwa-Alshanbari) |
| Saja Abdullah | AI Research, Model Development & Data Preparation | [@IS-Saja](https://github.com/IS-Saja) |

### Contribution Summary

- **AI Team** — Dataset preparation, experimentation, model training, evaluation, explainability validation, and model optimization.
- **Platform Engineering** — Full-stack system architecture, frontend development, backend development, database design, AI integration, deployment preparation, security implementation, reporting pipeline, and workflow orchestration.

Model weights:  https://huggingface.co/Raseel5/MedGuard-AI-Weights 

---

## 27. Acknowledgements

We would like to express our sincere gratitude to the **Saudi Data & AI Authority (SDAIA)** for organizing and supporting the AI Engineering Bootcamp, which provided the foundation for this project.

We are especially grateful to our instructors and mentors at **WeCloudData**:

-  Majid Jaberipour
- Yusuf Mesbah
- Stan Taov
- Shaohua Zhang

for their continuous guidance, technical mentorship, valuable feedback, and support throughout the development of MedGuard AI.

We also acknowledge the open-source community and the organizations whose tools, frameworks, and datasets made this work possible:

- [PyTorch](https://pytorch.org/) — Deep learning framework
- [timm](https://github.com/huggingface/pytorch-image-models) — EfficientNet-V2 backbone
- [segmentation-models-pytorch](https://github.com/qubvel/segmentation_models.pytorch) — U-Net implementation
- [Albumentations](https://albumentations.ai/) — Image preprocessing
- [FastAPI](https://fastapi.tiangolo.com/) — Backend framework
- [Supabase](https://supabase.com/) — Database, authentication, storage, and realtime infrastructure
- [React](https://react.dev/) — Frontend framework
- [fabric.js](http://fabricjs.com/) — Interactive medical image workstation
- [jsPDF](https://github.com/parallax/jsPDF) — PDF report generation
- [The Cancer Imaging Archive (TCIA)](https://www.cancerimagingarchive.net/) — CBIS-DDSM dataset hosting

---

## 28. References

1. Selvaraju, R. R., et al. (2017). *Grad-CAM: Visual Explanations from Deep Networks.* ICCV 2017.
2. Chattopadhay, A., et al. (2018). *Grad-CAM++: Generalized Gradient-based Visual Explanations.* WACV 2018.
3. Tan, M., & Le, Q. V. (2021). *EfficientNetV2: Smaller Models and Faster Training.* ICML 2021.
4. Ronneberger, O., et al. (2015). *U-Net: Convolutional Networks for Biomedical Image Segmentation.* MICCAI 2015.
5. American College of Radiology. *ACR BI-RADS® Atlas, 5th Edition.* ACR, 2013.
6. Lee, R. S., et al. (2017). *A curated mammography data set for use in computer-aided detection and diagnosis research.* Scientific Data, 4, 170177.

---

## 29. BibTeX Citation

```bibtex
@software{medguard_ai_2025,
  title        = {{MedGuard AI}: A Multitask Deep Learning Platform for
                  Mammographic Breast Cancer Screening},
  author       = {Mohammed, Raseel and Alzahrani, Maram and
                  Alshanbari, Arwa and Abdullah, Saja},
  year         = {2025},
  institution  = {SDAIA AI Engineering Bootcamp, Cohort RCP-6, Team 2},
  url          = {https://huggingface.co/Raseel5/MedGuard-AI-Weights},
  note         = {Three-service architecture: React SPA, FastAPI backend,
                  Dockerized inference microservice. EfficientNetV2-S classifier
                  + U-Net segmenter + Grad-CAM++ XAI. Trained on CBIS-DDSM.},
}
```

---

<div align="center">

Made by Team MedGuard AI · SDA Bootcamp 2026

</div>
