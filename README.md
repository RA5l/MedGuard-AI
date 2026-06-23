# MedGuard AI — Mammography Breast Cancer Screening Platform

> **Academic Submission — Publication-Quality Documentation**

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
25. [License](#25-license)
26. [Authors](#26-authors)
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

8a. RADIOLOGIST accepts
    └─ Case → in_review
    └─ Radiologist opens case detail: sees scans, AI result, heatmap

8b. RADIOLOGIST rejects (with reason)
    └─ Case → rejected; doctor notified; can re-assign

8c. RADIOLOGIST requests more info (with message)
    └─ Doctor notified; can reply; assignment resets to pending

9. RADIOLOGIST opens Report page
   └─ Generates AI summary (draft from AI result)
   └─ Fills in: Findings, Breast Density, Impression, BI-RADS, Recommendation
   └─ Finalizes report

10. RADIOLOGIST marks assignment Complete
    └─ Case → reported

11. DOCTOR / RADIOLOGIST exports PDF report
    └─ jsPDF renders all clinical sections in order
    └─ Audit log entry created

12. ADMIN reviews audit trail at any time
    └─ Immutable append-only log of all actions
```

---

## 5. Architecture

### Layer Diagram

```
┌──────────────────────────────────────────────────────┐
│                    FRONTEND (React)                   │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌───────────┐  │
│  │  Auth  │  │ Cases  │  │Reports │  │ Assignment│  │
│  │Context │  │ Hooks  │  │ Service│  │  Service  │  │
│  └───┬────┘  └───┬────┘  └───┬────┘  └─────┬─────┘  │
│      │           │           │              │        │
│  ┌───▼───────────▼───────────▼──────────────▼─────┐  │
│  │            Supabase JS SDK                      │  │
│  │  getScopedQuery() → schema('dev').from(table)   │  │
│  └─────────────────────┬───────────────────────────┘  │
└────────────────────────┼──────────────────────────────┘
                         │ HTTPS (Supabase API)
                         ▼
┌────────────────────────────────────────────────────┐
│              SUPABASE (PostgreSQL)                 │
│  Schema: dev (development) / public (production)  │
│  Tables: cases, scans, ai_results, reports,        │
│          users, roles, audit_logs, invitations,    │
│          case_assignments                          │
│  RLS policies on every table                       │
│  Storage bucket: mammograms                        │
│  Auth: Supabase Auth (JWT)                         │
│  Realtime: case_assignments updates                │
└────────────────────────────────────────────────────┘
                         ▲
                         │ supabase-py (service role)
┌────────────────────────┴──────────────────────────┐
│           APPLICATION BACKEND (FastAPI)            │
│  Routers: /api/auth, /api/cases,                  │
│           /api/scans, /api/ai                     │
│  Middleware: CORS (regex in dev, explicit in prod) │
│  Auth: JWT validation via supabase_admin.auth      │
│  Role enforcement: require_role() dependency       │
└────────────────────────┬──────────────────────────┘
                         │ httpx (POST /predict)
┌────────────────────────▼──────────────────────────┐
│          INFERENCE SERVICE (FastAPI)               │
│  GET  /health  — readiness probe                  │
│  POST /predict — full inference pipeline           │
│  InferenceEngine loads .pth bundle at startup     │
│  Stateless: no DB, no Storage access              │
└────────────────────────┬──────────────────────────┘
                         │ torch.load()
┌────────────────────────▼──────────────────────────┐
│      MedGuard_multitask_bundle_v1.pth             │
│  classifier_state_dict (timm EfficientNet-V2)     │
│  segmenter_state_dict  (smp U-Net)                │
│  config: image_size, label_names, threshold,       │
│          cls_encoder, seg_encoder                  │
│  preprocessing: mean, std                          │
│  deployment_notes: roi_warning, recommended_flow   │
└───────────────────────────────────────────────────┘
```

### Frontend Feature Architecture

The frontend follows a strict feature-first architecture enforced by `ARCHITECTURE_DECISIONS.md`:

```
Layer         Location                    Rule
────────────  ──────────────────────────  ────────────────────────────────
Routing       src/App.tsx                 Composition only; no logic
Layout        src/layouts/               Structure and chrome
Pages         features/*/pages/          Orchestrate hooks and components
Hooks         features/*/hooks/          Domain state; calls services
Services      features/*/services/       Supabase/API calls only; no state
Shared UI     src/components/            Stateless or minimal local state
Utilities     src/utils/                 Pure functions; no React imports
Design        src/styles/, src/lib/      CSS tokens, Tailwind config
```

### Database Schema (confirmed from Supabase)

| Table | Key Columns | Purpose |
|---|---|---|
| `cases` | `id`, `case_code`, `patient_alias`, `created_by`, `assigned_doctor_id`, `status` (enum), `priority`, `notes`, `deleted_at`, `deleted_by`, `delete_reason` | Patient screening cases |
| `scans` | `id`, `case_id`, `original_scan_url`, `scan_view_type`, `laterality`, `mime_type`, `file_size_bytes`, `uploaded_by` | Uploaded mammogram images |
| `ai_results` | `id`, `case_id`, `scan_id`, `prediction`, `confidence`, `heatmap_url`, `generated_report` (JSONB), `pipeline_version`, `processing_ms` | AI inference outputs |
| `reports` | `id`, `case_id`, `doctor_id`, `bi_rads`, `final_recommendation`, `findings`, `impression`, `recommendation`, `breast_density`, `doctor_notes`, `is_finalized`, `finalized_at` | Clinical reports |
| `users` | `id`, `full_name`, `email`, `role_id`, `specialty`, `is_active`, `created_by_admin` | User profiles |
| `roles` | `id`, `role_name` | `admin`, `doctor`, `radiologist` |
| `audit_logs` | `id`, `user_id`, `action`, `entity_type`, `entity_id`, `metadata` (JSONB), `created_at` | Immutable event log |
| `invitations` | `id`, `email`, `role_id`, `token`, `is_used`, `expires_at` | User invitation tokens |
| `case_assignments` | `id`, `case_id`, `assigned_by`, `assigned_to`, `status`, `decision_reason`, `doctor_reply`, `assigned_at`, `responded_at` | Radiology assignment workflow |

---

## 6. Directory Structure

```
clean_project_modern/
│
├── backend/                        # Application backend (FastAPI)
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py               # Settings from environment variables
│   │   ├── database.py             # Supabase client instances (anon + admin)
│   │   ├── main.py                 # FastAPI app, CORS middleware, router registration
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py             # Login, logout, user management endpoints
│   │   │   ├── cases.py            # Case CRUD endpoints; uses v_case_dashboard view
│   │   │   ├── scans.py            # Scan upload endpoint; PNG conversion
│   │   │   ├── ai.py               # AI analysis orchestration; calls inference service
│   │   │   └── dependencies.py     # JWT validation, role enforcement guards
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py             # Login/response/user Pydantic models
│   │   │   ├── cases.py            # CaseCreate, CaseUpdate, CaseResponse
│   │   │   ├── scans.py            # ScanResponse, ScanViewType enum
│   │   │   └── ai.py               # AnalyzeRequest, AIResultResponse
│   │   └── services/               # (reserved; currently empty)
│   ├── requirements.txt            # fastapi, uvicorn, supabase, pydantic, httpx, Pillow
│   └── run.bat                     # Windows convenience start script
│
├── inference/                      # AI inference microservice (stateless)
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI app; /health, /predict endpoints
│   │   ├── inference.py            # InferenceEngine class; full pipeline logic
│   │   └── model.py                # ClsModel, build_segmenter, GradCAMpp,
│   │                               #   preprocessing functions (ported from notebook)
│   ├── scripts/
│   │   ├── make_dummy_bundle.py    # Generates dummy_bundle.pth for CI/smoke testing
│   │   ├── dummy_bundle.pth        # Dummy weights (shapes only; random init)
│   │   └── smoke_test.py           # In-process API contract test; no real server needed
│   ├── weights/
│   │   └── MedGuard_multitask_bundle_v1.pth   # ← REAL TRAINED WEIGHTS (see §10)
│   ├── requirements.txt            # torch, timm, smp, albumentations, opencv, pillow
│   ├── Dockerfile                  # CPU-only; python:3.11-slim base
│   └── README.md                   # Inference service documentation
│
├── frontend/                       # React SPA
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg
│   ├── src/
│   │   ├── App.tsx                 # Root router; AuthProvider; all routes
│   │   ├── main.tsx                # React DOM entry point
│   │   ├── App.css                 # Global reset
│   │   ├── index.css               # CSS custom properties (design tokens)
│   │   ├── app/config/
│   │   │   └── constants.ts        # Application-level constants
│   │   ├── components/             # Shared stateless components
│   │   │   ├── CircularGauge.tsx   # Confidence gauge visualization
│   │   │   ├── InfoTooltip.tsx     # Contextual help tooltip
│   │   │   ├── Select.tsx          # Accessible dropdown
│   │   │   ├── Spinner.tsx         # Loading indicator
│   │   │   └── StatusQuickEdit.tsx # Inline case status editor
│   │   ├── layouts/
│   │   │   ├── AppLayout.tsx       # Shell: sidebar, navbar, page outlet;
│   │   │   │                       #   theme management; Realtime subscription
│   │   │   ├── Navbar.tsx          # Top navigation bar
│   │   │   ├── Sidebar.tsx         # Role-aware navigation links
│   │   │   └── ProtectedRoute.tsx  # Auth guard; optional role restriction
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   │   ├── context/AuthContext.tsx     # AuthProvider, useAuth hook
│   │   │   │   ├── hooks/useAuth.ts            # Re-export of useAuth
│   │   │   │   ├── pages/LoginPage.tsx         # Login form
│   │   │   │   └── types/                      # Auth type definitions
│   │   │   ├── cases/
│   │   │   │   ├── hooks/useCases.ts           # Case list state management
│   │   │   │   ├── hooks/useScans.ts           # Scan list state management
│   │   │   │   ├── pages/CasesListPage.tsx     # Case list with filters
│   │   │   │   ├── pages/CaseDetailsPage.tsx   # Case detail; scan gallery;
│   │   │   │   │                               #   assignment integration
│   │   │   │   ├── services/caseService.ts     # All Supabase case operations
│   │   │   │   ├── services/scanService.ts     # Scan fetch operations
│   │   │   │   ├── components/ScanList.tsx     # Scan grid component
│   │   │   │   └── types/index.ts              # Case, CaseStatus, payloads
│   │   │   ├── ai-results/
│   │   │   │   ├── pages/AIResultsPage.tsx     # AI result viewer; heatmap; gauge
│   │   │   │   ├── services/aiService.ts       # AI result fetch operations
│   │   │   │   └── types/                      # AIResult type definitions
│   │   │   ├── reports/
│   │   │   │   ├── pages/ReportsPage.tsx       # Full reporting workflow UI
│   │   │   │   ├── services/reportService.ts   # Report CRUD operations
│   │   │   │   └── utils/exportReportPdf.ts    # jsPDF PDF generation
│   │   │   ├── upload/
│   │   │   │   └── pages/ScanUploadPage.tsx    # Scan file upload UI
│   │   │   ├── dashboard/
│   │   │   │   ├── pages/DashboardPage.tsx     # Role-aware dashboard
│   │   │   │   └── services/auditService.ts    # Audit log fetch (admin only)
│   │   │   ├── admin/
│   │   │   │   ├── pages/AdminPanelPage.tsx    # User management UI
│   │   │   │   └── hooks/useUsers.ts           # User list and create hook
│   │   │   └── assignment/
│   │   │       ├── services/assignmentService.ts    # Assignment CRUD; doctor reply
│   │   │       ├── hooks/useAssignment.ts           # Assignment state hooks
│   │   │       ├── hooks/useAssignmentRealtime.ts   # Supabase Realtime subscription
│   │   │       ├── components/AssignmentPanel.tsx   # Accept/Reject/Info UI panel
│   │   │       ├── components/AssignRadiologistModal.tsx  # Radiologist selector
│   │   │       ├── components/AssignmentStatusBadge.tsx   # Status pill badge
│   │   │       ├── components/AssignmentToast.tsx         # Realtime toast messages
│   │   │       ├── components/ClinicalNotificationsWidget.tsx # Dashboard widget
│   │   │       └── pages/RadiologistWorklistPage.tsx      # Radiologist worklist
│   │   ├── lib/
│   │   │   ├── api.ts              # Axios instance (points to backend port 8000)
│   │   │   ├── auditLog.ts         # logAudit() helper (inserts to audit_logs)
│   │   │   ├── badges.ts           # Status, priority, role badge configs
│   │   │   ├── errorMessages.ts    # User-facing error string map
│   │   │   ├── supabaseClient.ts   # Supabase client; getScopedQuery(); schema helper
│   │   │   ├── tokens.ts           # Design system token constants
│   │   │   └── userLookup.ts       # getUserNamesByIds() batch lookup
│   │   ├── styles/
│   │   │   ├── globals.css         # Tailwind base imports
│   │   │   ├── theme.css           # Dark/light theme definitions
│   │   │   └── tokens.css          # CSS custom property declarations
│   │   └── utils/
│   │       └── date.ts             # formatDate(), formatTime(), getTimeOfDay()
│   ├── package.json
│   ├── tailwind.config.ts          # Tailwind v4 config; custom color tokens
│   ├── vite.config.ts              # Vite build config; React plugin
│   ├── tsconfig.json               # TypeScript project config
│   └── ARCHITECTURE_DECISIONS.md  # Documented engineering decisions
│
├── start-all.ps1                   # PowerShell: starts all three services
├── start-backend.ps1               # PowerShell: starts backend only
├── start-frontend.ps1              # PowerShell: starts frontend only
└── start-inference.ps1             # PowerShell: starts inference service only
```

---

## 7. Technology Stack

### Frontend

| Library / Tool | Version | Purpose |
|---|---|---|
| React | 19.2.6 | UI framework |
| TypeScript | ~6.0.2 | Static typing |
| Vite | 8.0.12 | Build tool and dev server |
| React Router DOM | 7.16.0 | Client-side routing |
| @supabase/supabase-js | 2.107.0 | Database, auth, storage, realtime |
| Axios | 1.17.0 | HTTP client for backend API calls |
| Framer Motion | 12.40.0 | Page transition animations |
| jsPDF | 4.2.1 | Client-side PDF generation |
| Lucide React | 0.542.0 | Clinical icon set |
| Tailwind CSS | 4.3.0 | Utility-first CSS framework |

### Application Backend

| Library | Version | Purpose |
|---|---|---|
| FastAPI | 0.136.3 | Web framework |
| Uvicorn | 0.48.0 | ASGI server |
| supabase-py | 2.30.0 | Supabase client (anon + admin) |
| python-jose[cryptography] | 3.3.0 | JWT decoding |
| pydantic | 2.13.4 | Request/response validation |
| python-multipart | 0.0.9 | Multipart form parsing |
| httpx | 0.28.1 | Async HTTP client (calls inference service) |
| Pillow | 10.3.0 | Image format conversion for uploads |
| PyJWT | 2.13.0 | JWT utilities |
| python-dotenv | 1.2.2 | `.env` file loading |

### Inference Service

| Library | Version | Purpose |
|---|---|---|
| FastAPI | 0.115.6 | Web framework |
| Uvicorn[standard] | 0.32.1 | ASGI server |
| PyTorch | 2.4.1 | Deep learning inference |
| timm | latest | `efficientnetv2_rw_s` backbone |
| segmentation-models-pytorch | 0.5.0 | U-Net segmenter construction |
| Albumentations | 1.4.18 | CLAHE + normalization preprocessing |
| OpenCV (headless) | 4.10.0.84 | Image decoding, mask processing, GradCAM colormap |
| Pillow | 10.4.0 | PNG encoding for heatmap export |
| NumPy | 1.26.4 | Numerical array operations |

### Database & Infrastructure

| Component | Details |
|---|---|
| Supabase | Hosted PostgreSQL; Auth; Storage; Realtime; Row-Level Security |
| Schema | `dev` (development) / `public` (production); configurable via environment |
| Storage bucket | `mammograms` — original scans, heatmaps, segmentation masks |
| Auth | Supabase Auth (JWT-based); `auth.users` linked to `public/dev.users` |
| Realtime | PostgreSQL publication on `case_assignments` table |

---

## 8. AI Model Details

### Overview

MedGuard AI uses a **multitask deep learning bundle** (`MedGuard_multitask_bundle_v1.pth`) containing two jointly trained but separately stored model state dictionaries: a classifier and a segmenter. Both are loaded at inference service startup and remain in memory for the lifetime of the process.

### Bundle Format

The `.pth` file is a `torch.save()` dictionary with the following top-level keys:

| Key | Type | Content |
|---|---|---|
| `classifier_state_dict` | `OrderedDict` | Trained weights for `ClsModel` |
| `segmenter_state_dict` | `OrderedDict` | Trained weights for U-Net |
| `image_size` | `int` | Input resolution (e.g. 384) |
| `label_names` | `list[str]` | `["Benign", "Malignant"]` |
| `threshold` | `float` | Tuned decision threshold (not 0.5) |
| `cls_encoder` | `str` | timm model name (e.g. `efficientnetv2_rw_s`) |
| `seg_encoder` | `str` | smp encoder name |
| `context_crop_ratio` | `float` | Context expansion factor for ROI crops |
| `preprocessing` | `dict` | `{mean, std}` (ImageNet values) |
| `deployment_notes` | `dict` | ROI flow recommendation, caveats |
| `test_metrics` | `dict` | Evaluation metrics from training |

### Classifier Architecture (`ClsModel`)

```
Input: RGB image tensor [1, 3, H, H]  (H = image_size from bundle)
       ↓
timm backbone: efficientnetv2_rw_s
  global_pool="avg"  →  feature vector [1, F]
       ↓
Head:
  LayerNorm(F)
  Dropout(0.40)
  Linear(F → 256)
  SiLU
  Dropout(0.40)
  Linear(256 → 2)       ← 2 = len(label_names)
       ↓
Output: logits [1, 2]
```

### Segmenter Architecture

```
smp.Unet(
    encoder_name  = seg_encoder,   # from bundle (e.g. resnet34)
    encoder_weights = None,        # weights loaded from bundle, not downloaded
    in_channels   = 3,
    classes       = 1,
    activation    = None           # sigmoid applied post-hoc during inference
)
Input:  RGB tensor [1, 3, H, H]
Output: logit map  [1, 1, H, H]
        → sigmoid → probability map
        → threshold at 0.5 → binary mask [H, H]
```

### Preprocessing Pipeline

Every image — whether used for coarse localization or for final classification — passes through the same preprocessing chain:

```
1. load_gray_as_rgb_from_bytes()
   └─ cv2.imdecode(bytes, IMREAD_GRAYSCALE)

2. normalize_uint8(img, lo_pct=0.5, hi_pct=99.7)
   └─ Percentile clip [0.5th, 99.7th]
   └─ Linear rescale to [0, 255] uint8

3. resize_pad(img, image_size)
   └─ Aspect-preserving resize (max(H,W) → image_size)
   └─ Zero-pad to square (image_size × image_size)

4. cv2.COLOR_GRAY2RGB
   └─ Replicate single channel to 3 channels

5. Albumentations eval_transform():
   └─ A.CLAHE(clip_limit=2.0, p=1.0)
   └─ A.Normalize(mean=bundle.mean, std=bundle.std)
   └─ ToTensorV2()

Output: FloatTensor [1, 3, image_size, image_size]
```

> **Note:** The preprocessing is ported verbatim from the training notebook (`MedGuard_MultiTask_v3_cost_sensitive_strong_classifier.ipynb`). Any modification to percentile values, CLAHE parameters, or normalization constants will silently degrade accuracy.

### Inference Pipeline (Segmentation-First)

Per `deployment_notes.recommended_api_flow` in the V1-final bundle:

```
Step 1: Coarse localization
  full_gray_image
       ↓ preprocessing
  full_tensor [1, 3, H, H]
       ↓ segmenter
  coarse_mask [H, H]  (binary, threshold=0.5)
       ↓ largest_component_bbox()
  bounding_box (x, y, w, h) in canvas coordinates

Step 2: Map to original image coordinates
  map_bbox_from_canvas_to_original()
       ↓ expand_bbox(context_ratio)
  x1, y1, x2, y2 (in original image pixels)

Step 3: Crop and classify
  cropped_gray = original_image[y1:y2, x1:x2]
       ↓ preprocessing (same chain)
  crop_tensor [1, 3, H, H]
       ↓ GradCAMpp(classifier, last_conv_layer)
  cam [H, H] ∈ [0,1],  probs [2]

Step 4: Fine segmentation
  crop_tensor (same tensor from Step 3)
       ↓ segmenter
  fine_mask [H, H]  (binary, threshold=0.5)

Step 5: Encode outputs
  heatmap_png  = overlay(cropped_gray_squared, cam, COLORMAP_JET, alpha=0.4)
  mask_png     = fine_mask × 255

Step 6: Return
  {prediction, confidence, probabilities, threshold_used,
   heatmap_png_base64, segmentation_mask_png_base64,
   roi_source, pipeline_version, processing_ms, model_metadata}
```

**ROI source priority:**

| Priority | `roi_source` value | Condition |
|---|---|---|
| 1 (highest) | `"manual_roi"` | Caller supplied `roi_x/y/w/h` |
| 2 | `"segmentation_predicted_mask"` | Coarse segmenter found a lesion component |
| 3 (fallback) | `"center_crop_fallback"` | Coarse mask was empty; center crop used |

### Grad-CAM++ Implementation

```
GradCAMpp(model=classifier, target_layer=last_Conv2d_in_backbone)

Forward hook  → captures activations A  [1, C, h, w]
Backward hook → captures gradients  G   [1, C, h, w]

alpha = G² / (2·G² + A.sum(dim=(2,3)) · G³)    (per channel)
weight = (alpha · ReLU(G)).sum(dim=(2,3))        [1, C, 1, 1]
CAM   = ReLU((weight · A).sum(dim=1))            [1, 1, h, w]
      → bilinear upsample to [1, 1, image_size, image_size]
      → normalize to [0, 1]
      → numpy [image_size, image_size]
```

### Post-processing

| Output | Post-processing |
|---|---|
| `prediction` | `label_names[int(malignant_prob >= threshold)]` |
| `confidence` | `probs[pred_idx]` (probability of the predicted class) |
| `probabilities` | `torch.softmax(logits, dim=1)` for both classes |
| `heatmap_png_base64` | `cv2.applyColorMap(cam×255, COLORMAP_JET)` blended 60/40 with grayscale crop; PNG; base64 |
| `segmentation_mask_png_base64` | `fine_mask × 255` (0 or 255); PNG; base64 |

### Model Weights Location

```
inference/
└── weights/
    └── MedGuard_multitask_bundle_v1.pth    ← place file here
```

The Inference Service reads the path from `MODEL_BUNDLE_PATH` environment variable. Default value in `main.py`:

```python
BUNDLE_PATH = os.environ.get(
    "MODEL_BUNDLE_PATH",
    "/app/weights/medguard_multitask_bundle_v3_cost_sensitive.pth"
)
```

For local development (without Docker), set:

```bash
# Windows PowerShell
$env:MODEL_BUNDLE_PATH = "weights/MedGuard_multitask_bundle_v1.pth"

# Linux / macOS
export MODEL_BUNDLE_PATH=weights/MedGuard_multitask_bundle_v1.pth
```

**Download URL:**

```
https://huggingface.co/Raseel5/MedGuard-AI-Weights/resolve/main/MedGuard_multitask_bundle_v1.pth?download=true
```

```bash
# Download to correct location
mkdir -p inference/weights
curl -L "https://huggingface.co/Raseel5/MedGuard-AI-Weights/resolve/main/MedGuard_multitask_bundle_v1.pth?download=true" \
     -o inference/weights/MedGuard_multitask_bundle_v1.pth
```

---

## 9. Dataset Information

The training dataset and specific split information are not documented in the source code or configuration files of this repository. The bundle's `test_metrics` field (accessible via `GET /health` on the inference service) contains evaluation metrics recorded at training time. The training notebook referenced in code comments is `MedGuard_MultiTask_v3_cost_sensitive_strong_classifier.ipynb`, which is not included in this repository.

The model comments note the use of **cost-sensitive training** (implied by the notebook name and bundle naming convention), suggesting the training set exhibited class imbalance between Benign and Malignant cases.

---

## 10. Installation & Setup

### Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Python | ≥ 3.11 | For both backend and inference service |
| Node.js | ≥ 18 | For frontend |
| npm | ≥ 9 | Bundled with Node.js |
| Supabase account | — | Free tier sufficient for development |

### Clone Repository

```bash
git clone <repository-url>
cd clean_project_modern
```

### Download Model Weights

```bash
mkdir -p inference/weights

# curl
curl -L "https://huggingface.co/Raseel5/MedGuard-AI-Weights/resolve/main/MedGuard_multitask_bundle_v1.pth?download=true" \
     -o inference/weights/MedGuard_multitask_bundle_v1.pth

# wget
wget -O inference/weights/MedGuard_multitask_bundle_v1.pth \
     "https://huggingface.co/Raseel5/MedGuard-AI-Weights/resolve/main/MedGuard_multitask_bundle_v1.pth?download=true"
```

### Backend Dependencies

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux / macOS
source venv/bin/activate

pip install -r requirements.txt
```

### Inference Service Dependencies

```bash
cd inference
python -m venv venv

# Windows
venv\Scripts\activate

# Linux / macOS
source venv/bin/activate

pip install -r requirements.txt
```

### Frontend Dependencies

```bash
cd frontend
npm install
```

---

## 11. Environment Variables

### Backend (`backend/.env`)

```env
# Supabase connection (required)
SUPABASE_URL=https://<project-id>.supabase.co
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
SUPABASE_JWT_SECRET=<jwt-secret>

# Application
APP_ENV=development          # "development" or "production"
DB_SCHEMA=dev                # "dev" or "public"

# AI inference service location
INFERENCE_SERVICE_URL=http://localhost:8001

# Optional: OpenAI API (not used in current codebase)
OPENAI_API_KEY=
```

### Inference Service (environment or shell)

```env
MODEL_BUNDLE_PATH=weights/MedGuard_multitask_bundle_v1.pth
INFERENCE_DEVICE=cpu          # "cpu" or "cuda"
CONTEXT_CROP_RATIO=0.60       # Only used if bundle omits context_crop_ratio
```

### Frontend (`frontend/.env`)

```env
VITE_SUPABASE_URL=https://<project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_DB_SCHEMA=dev            # "dev" or "public"
VITE_API_URL=http://localhost:8000
```

---

## 12. Running the System

### Option A — Manual (three terminals)

**Terminal 1 — Inference Service**

```bash
cd inference
source venv/bin/activate      # or venv\Scripts\activate on Windows

export MODEL_BUNDLE_PATH=weights/MedGuard_multitask_bundle_v1.pth
export INFERENCE_DEVICE=cpu

uvicorn app.main:app --reload --port 8001
```

**Terminal 2 — Application Backend**

```bash
cd backend
source venv/bin/activate

uvicorn app.main:app --reload --port 8000
```

**Terminal 3 — Frontend**

```bash
cd frontend
npm run dev
```

### Option B — PowerShell (Windows)

```powershell
# Start all three services
.\start-all.ps1

# Or individually
.\start-inference.ps1
.\start-backend.ps1
.\start-frontend.ps1
```

### Option C — Docker (Inference Service only)

```bash
cd inference
docker build -t medguard-inference .

docker run --rm \
  -p 8001:8001 \
  -v "$(pwd)/weights:/app/weights:ro" \
  -e MODEL_BUNDLE_PATH=/app/weights/MedGuard_multitask_bundle_v1.pth \
  -e INFERENCE_DEVICE=cpu \
  medguard-inference
```

### Verifying Services

```bash
# Inference service health
curl http://localhost:8001/health

# Application backend health
curl http://localhost:8000/

# Frontend
open http://localhost:5173
```

---

## 13. Usage Guide

### First-Time Setup (Supabase)

1. Create a Supabase project.
2. Run the SQL migrations to create the `dev` schema tables, enums, RLS policies, and the `create_user_by_admin` RPC function.
3. Enable Realtime on `dev.case_assignments`:
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE dev.case_assignments;
   ```
4. Create a storage bucket named `mammograms` (set to public or configure signed URLs).
5. Create the first admin user via Supabase Dashboard → Authentication → Users, then insert the corresponding row in `dev.users` with the admin role ID.

### Daily Clinical Workflow

| Step | Role | Action |
|---|---|---|
| 1 | Admin | Create doctor/radiologist accounts via Admin Panel |
| 2 | Doctor | Navigate to Cases → Create New Case |
| 3 | Doctor | Navigate to Scan Upload → select case → upload scans |
| 4 | Doctor | Navigate to AI Results → select scan → Run Analysis |
| 5 | Doctor | View heatmap, prediction, confidence |
| 6 | Doctor | Case Detail → Send to Radiologist → select radiologist |
| 7 | Radiologist | My Worklist → Accept / Reject / Request More Info |
| 8 | Radiologist | Case Detail → view scans and AI result |
| 9 | Radiologist | Reports → Generate AI Summary → complete all fields → Finalize |
| 10 | Radiologist | Reports → Export PDF |
| 11 | Admin | Dashboard → Audit Trail to review all actions |

---

## 14. Clinical Report Generation Pipeline

The report page enforces the following section order, reflecting standard breast imaging report structure:

```
1. AI Generated Summary
   └─ Draft text assembled from ai_results (prediction, confidence,
      scan view types, pipeline version, ROI caveat)
   └─ Fully editable before saving

2. Findings
   └─ Free-text radiologist observations
   └─ Physician-controlled; not populated by AI

3. Breast Density (ACR category)
   └─ A: Almost entirely fatty
   └─ B: Scattered fibroglandular densities
   └─ C: Heterogeneously dense
   └─ D: Extremely dense

4. Impression
   └─ Overall radiologist assessment

5. BI-RADS Category (0–6)
   └─ Physician-assigned; NOT derived from AI classification
   └─ AI prediction and BI-RADS are kept independent by design

6. Recommendation
   └─ e.g. Routine screening / Tissue biopsy / Ultrasound correlation

7. Doctor Notes
   └─ Internal notes; included in PDF
```

**PDF export** (`exportReportPdf.ts`) uses jsPDF to render:
- Header band (MedGuard AI branding, project title)
- Patient/case block (case code, patient alias, views, BI-RADS, density, status)
- All seven sections above with section headings
- Footer (physician name, creation date, finalization date, export timestamp)
- Disclaimer: AI-assisted content; reviewed by licensed physician

The PDF filename format is: `MedGuard-Report-{case_code}.pdf`

---

## 15. API Documentation

### Application Backend (`http://localhost:8000`)

Interactive docs available at `/docs` when `APP_ENV=development`.

#### Authentication

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | None | Email/password login; returns JWT |
| `GET` | `/api/auth/me` | Bearer | Returns current user profile |
| `POST` | `/api/auth/logout` | Bearer | Invalidates session |
| `POST` | `/api/auth/create-user` | Admin | Creates Supabase auth user + DB profile |
| `GET` | `/api/auth/users` | Admin | Lists all users |
| `PATCH` | `/api/auth/users/{user_id}/deactivate` | Admin | Deactivates a user account |

#### Cases

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/cases` | Bearer | List cases (role-scoped); supports `status`, `priority`, `search`, `limit`, `offset` |
| `POST` | `/api/cases` | Bearer | Create a case |
| `GET` | `/api/cases/{case_id}` | Bearer | Get single case |
| `PATCH` | `/api/cases/{case_id}` | Bearer | Update case fields |
| `DELETE` | `/api/cases/{case_id}` | Admin | Delete case |

#### Scans

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/scans` | Bearer | Upload scan (`multipart/form-data`): `case_id`, `scan_view_type`, `file` |
| `GET` | `/api/scans/case/{case_id}` | Bearer | List scans for a case |

#### AI Analysis

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/ai/analyze/{scan_id}` | Doctor/Admin | Trigger AI analysis; optional JSON body `{"roi": {"roi_x":…,"roi_y":…,"roi_w":…,"roi_h":…}}` |

---

### Inference Service (`http://localhost:8001`)

#### `GET /health`

```json
{
  "status": "ok",
  "device": "cpu",
  "label_names": ["Benign", "Malignant"],
  "threshold": 0.42,
  "image_size": 384,
  "pipeline_version": "medguard-seg-first-v1"
}
```

Returns HTTP 503 with `{"status": "model_not_loaded"}` if the bundle was not found at startup.

#### `POST /predict`

**Request:** `multipart/form-data`

| Field | Type | Required | Description |
|---|---|---|---|
| `image` | file | Yes | Mammography image (PNG, JPEG, etc.) |
| `roi_x` | int | No | Manual ROI top-left X (original image pixels) |
| `roi_y` | int | No | Manual ROI top-left Y |
| `roi_w` | int | No | Manual ROI width |
| `roi_h` | int | No | Manual ROI height |

> All four ROI fields must be provided together or omitted together.

**Response:**

```json
{
  "prediction": "Malignant",
  "confidence": 0.8741,
  "probabilities": {
    "Benign": 0.1259,
    "Malignant": 0.8741
  },
  "threshold_used": 0.42,
  "heatmap_png_base64": "<base64 PNG>",
  "segmentation_mask_png_base64": "<base64 PNG>",
  "roi_source": "segmentation_predicted_mask",
  "pipeline_version": "medguard-seg-first-v1",
  "processing_ms": 1243,
  "model_metadata": {
    "image_size": 384,
    "label_names": ["Benign", "Malignant"],
    "test_metrics": {},
    "roi_caveat": "...",
    "recommended_api_flow": "...",
    "context_ratio_used": 0.60,
    "context_ratio_source": "bundle"
  }
}
```

**Error responses:**

| HTTP | Condition |
|---|---|
| 400 | Empty image; partial ROI (some but not all of roi_x/y/w/h) |
| 503 | Model bundle not loaded at startup |
| 500 | Inference runtime error |

---

## 16. Directory Reference

| Path | Description |
|---|---|
| `backend/app/config.py` | Reads all environment variables; raises on missing required vars |
| `backend/app/database.py` | Two Supabase clients: `supabase` (anon, RLS applies), `supabase_admin` (service role, bypasses RLS) |
| `backend/app/routers/dependencies.py` | `get_current_user()` validates JWT; `require_role()` factory enforces role access |
| `backend/app/routers/ai.py` | 7-step orchestration: fetch scan → download image → call inference → upload artifacts → upsert ai_results → advance case status → audit log |
| `inference/app/model.py` | All model classes and preprocessing functions; ported verbatim from training notebook |
| `inference/app/inference.py` | `InferenceEngine` class; bundle format detection; segmentation-first pipeline |
| `inference/app/main.py` | FastAPI app; startup model load; `/health` and `/predict` routes |
| `inference/scripts/smoke_test.py` | Self-contained API contract test using `TestClient`; no live server required |
| `frontend/src/lib/supabaseClient.ts` | Single Supabase client; `getScopedQuery()` applies active schema; `getActiveSchema()` reads `VITE_DB_SCHEMA` |
| `frontend/src/layouts/AppLayout.tsx` | Application shell; dark/light theme toggle; Supabase Realtime subscription for assignment notifications |
| `frontend/src/features/reports/utils/exportReportPdf.ts` | `exportReportToPdf()`; jsPDF; all clinical sections; header/footer |
| `frontend/ARCHITECTURE_DECISIONS.md` | Engineering decision log; broken import analysis; layer separation rules |

---

## 17. Key Dependencies

| Dependency | Purpose | Why This One |
|---|---|---|
| `timm` | EfficientNet-V2 backbone | Provides `efficientnetv2_rw_s` with `pretrained=False` and feature extraction via `num_classes=0, global_pool="avg"` |
| `segmentation-models-pytorch` | U-Net segmenter | `smp.Unet` with `encoder_weights=None`; weights loaded from bundle state dict |
| `albumentations` | Inference-time preprocessing | CLAHE + normalization; matches training pipeline exactly |
| `opencv-python-headless` | Image I/O, mask processing, Grad-CAM colormap | Headless variant (no GUI); required by albumentations |
| `supabase-py` | Backend database client | Official Python SDK; supports schema scoping, storage, admin auth |
| `httpx` | Async HTTP client in backend | Used for downloading scan images and calling inference service asynchronously |
| `jsPDF` | Client-side PDF generation | No server required; generates full clinical report PDF in the browser |
| `framer-motion` | Page transitions | Smooth animated route changes; `staggerChildren` for dashboard cards |
| `@supabase/supabase-js` | Frontend database client | Direct Supabase access with RLS; Realtime subscriptions |

---

## 18. Performance Metrics

Performance metrics recorded at training time are embedded in the model bundle and returned by `GET /health` under `model_metadata.test_metrics`. These are not hardcoded in this repository; they vary by bundle version and training run.

**Inference latency** is measured per request and returned as `processing_ms` in the `/predict` response. The segmentation-first pipeline (coarse pass + fine pass) performs approximately twice the computation of a single-pass pipeline.

> The inference README notes: *"Not load-tested. The coarse + fine double segmentation pass roughly doubles per-request compute versus the old single-pass flow — worth profiling before assuming current latency is acceptable at scale."*

Specific AUC, sensitivity, specificity, or F1 values are not available from the repository source code.

---

## 19. Current Capabilities & Known Limitations

### Current Capabilities

- Binary mammographic classification (Benign / Malignant) with calibrated threshold
- Automated lesion localization via segmentation-first ROI extraction
- Grad-CAM++ saliency heatmap for prediction attribution
- Fine-pass pixel-level segmentation mask on the classification crop
- Complete role-based clinical workflow (admin / doctor / radiologist)
- Structured seven-section clinical report with PDF export
- Realtime assignment notifications via Supabase channels
- Immutable audit trail for all clinical actions
- Soft delete for cases (admin only)
- Dual-schema deployment (dev / public) configurable via environment

### Known Limitations

| Limitation | Details |
|---|---|
| Single scan per analysis | The `/predict` endpoint processes one image per call; multi-view analysis requires multiple calls |
| No DICOM native support | DICOM files are decoded via Pillow's generic reader; DICOM-specific metadata (modality, patient info, window level) is not parsed |
| Segmenter fallback | If the coarse segmenter produces an empty mask, a center crop is used; this is flagged in `roi_source` but the classification should be treated as unvalidated |
| No AI history | `ai_results` uses upsert on `scan_id` (unique constraint); re-running analysis on the same scan overwrites the previous result |
| No multi-instance deployment | `InferenceEngine` is a module-level singleton; horizontal scaling requires separate container instances |
| No GPU Dockerfile | The provided Dockerfile targets CPU; GPU inference requires a CUDA-enabled base image and matching torch build |
| Backend not fully integrated | Most case/report operations in the frontend use the Supabase JS SDK directly (bypassing the application backend); the backend routers handle scan upload, AI orchestration, and auth only |
| `context_crop_ratio` default | If the bundle omits this field (V7 format), the service uses `DEFAULT_CONTEXT_RATIO = 0.60` which may not match the training crop geometry |

---

## 20. Future Work

Based on code comments and `ARCHITECTURE_DECISIONS.md`:

- **DICOM metadata parsing** — Extract window level/center, patient orientation, and modality from DICOM files
- **Multi-view fusion** — Combine RCC, RMLO, LCC, LMLO predictions into a single case-level assessment
- **AI analysis history** — Replace upsert with an append-only `ai_results` table; separate `ai_results_history`
- **Gemini/LLM report generation** — Code references `handleGenerateSummary` with a TODO for a real Gemini backend endpoint
- **Case summary database view** — `v_case_dashboard` referenced in backend; a dedicated `case_summary` view joining cases, users, and scan counts
- **GPU deployment** — CUDA-enabled Dockerfile for production inference latency
- **Load testing** — Profiling the double-pass segmentation pipeline under concurrent load
- **Rate limiting and authentication on inference service** — Currently assumes it sits behind the application backend; not safe to expose directly
- **Shared status rank module** — `STATUS_RANK` enum ordering is duplicated in `ai.py` (backend) and `caseService.ts` (frontend); should be a single source of truth

---

## 21. Reproducibility

### Inference Service

```bash
# 1. Install exact versions from requirements.txt
pip install -r inference/requirements.txt

# 2. Download weights to the correct path
mkdir -p inference/weights
curl -L "https://huggingface.co/Raseel5/MedGuard-AI-Weights/resolve/main/MedGuard_multitask_bundle_v1.pth?download=true" \
     -o inference/weights/MedGuard_multitask_bundle_v1.pth

# 3. Run smoke test (uses dummy_bundle.pth by default; pass real bundle for full test)
cd inference
MODEL_BUNDLE_PATH=weights/MedGuard_multitask_bundle_v1.pth \
INFERENCE_DEVICE=cpu \
python scripts/smoke_test.py
```

Expected output: `ALL SMOKE TESTS PASSED`

### Bundle Inspection

```python
import torch
bundle = torch.load("inference/weights/MedGuard_multitask_bundle_v1.pth",
                    map_location="cpu", weights_only=False)
print(bundle.keys())
print("image_size:", bundle.get("image_size"))
print("label_names:", bundle.get("label_names"))
print("threshold:", bundle.get("threshold"))
print("cls_encoder:", bundle.get("cls_encoder"))
print("seg_encoder:", bundle.get("seg_encoder"))
print("test_metrics:", bundle.get("test_metrics"))
```

---

## 22. Security & Privacy

| Area | Implementation |
|---|---|
| Authentication | Supabase Auth (JWT); tokens validated server-side via `supabase_admin.auth.get_user(token)` |
| Authorization | Backend: `require_role()` dependency; Frontend: `ProtectedRoute` with `allowedRoles` |
| Row-Level Security | All Supabase tables have RLS policies; frontend queries are RLS-scoped; backend uses service role key only where necessary |
| Patient privacy | No real patient names stored; `patient_alias` field only |
| Audit trail | Append-only `audit_logs` table; non-admin users cannot read or write audit logs directly |
| Secrets | All credentials stored in `.env` files; never committed (`.gitignore` present) |
| CORS | Development: regex matching any localhost origin; Production: explicit `CORS_ORIGINS` environment variable |
| Inference service | No authentication; intended to be placed behind the application backend on a private network, not exposed publicly |
| File uploads | MIME type whitelist; 20 MB size limit; converted to PNG before storage |
| Storage | Supabase Storage bucket (`mammograms`); access controlled by Supabase Storage policies |

---

## 23. Troubleshooting

| Problem | Likely Cause | Solution |
|---|---|---|
| `Missing environment variables: SUPABASE_URL` | `.env` file missing or not loaded | Create `backend/.env` with all required variables |
| `GET /health` returns 503 | Bundle not found at `MODEL_BUNDLE_PATH` | Verify file path; download weights; set `MODEL_BUNDLE_PATH` correctly |
| `Could not find the 'column' in the schema cache` | PostgREST schema cache stale after migration | Run `NOTIFY pgrst, 'reload schema';` in Supabase SQL Editor |
| `new row violates row-level security policy` | Missing RLS INSERT policy | Add appropriate policy; verify user role matches policy condition |
| `dev.case_assignments` not found | Table created in wrong schema | Re-run Block 2 SQL targeting `dev.case_assignments` |
| Frontend shows empty radiologist list | `role_id` filter mismatch | Verify radiologist role UUID matches `roles` table; check `is_active` filter |
| Vite parse error: unexpected token | Unescaped `"` in JSX attribute | Replace inner quotes with `&quot;` |
| Inference crashes on empty mask | Degenerate coarse segmentation | Expected behavior; `roi_source` will be `center_crop_fallback`; treat result as unvalidated |
| CORS errors in development | Frontend port changed | Backend regex matches all localhost ports; restart backend if CORS config cached |
| `Cannot coerce the result to a single JSON object` | `.single()` on empty result set | Missing UPDATE RLS policy on `case_assignments`; add policy for authenticated users |

---

## 24. Quick Start

```bash
# 1. Clone
git clone <repository-url> && cd clean_project_modern

# 2. Download weights
mkdir -p inference/weights
curl -L "https://huggingface.co/Raseel5/MedGuard-AI-Weights/resolve/main/MedGuard_multitask_bundle_v1.pth?download=true" \
     -o inference/weights/MedGuard_multitask_bundle_v1.pth

# 3. Backend
cd backend && python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
# Create backend/.env (see §11)
uvicorn app.main:app --reload --port 8000 &
cd ..

# 4. Inference service
cd inference && python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
MODEL_BUNDLE_PATH=weights/MedGuard_multitask_bundle_v1.pth \
uvicorn app.main:app --reload --port 8001 &
cd ..

# 5. Frontend
cd frontend
# Create frontend/.env (see §11)
npm install && npm run dev

# 6. Open http://localhost:5173
```

---

## 25. License

Not specified in the repository. All rights reserved by the authors unless otherwise stated.

---

## 26. Authors

The model weights are hosted at:
`https://huggingface.co/Raseel5/MedGuard-AI-Weights`

indicating the primary author's identifier as **Raseel5**. Additional authors are not documented in the repository source files.

---

## 27. Acknowledgements

The following open-source projects are integral to MedGuard AI:

- [PyTorch](https://pytorch.org/) — deep learning framework
- [timm](https://github.com/huggingface/pytorch-image-models) — EfficientNet-V2 backbone
- [segmentation-models-pytorch](https://github.com/qubvel/segmentation_models.pytorch) — U-Net implementation
- [Albumentations](https://albumentations.ai/) — image augmentation and preprocessing
- [FastAPI](https://fastapi.tiangolo.com/) — web framework
- [Supabase](https://supabase.com/) — database, auth, storage, realtime
- [React](https://react.dev/) — frontend framework
- [jsPDF](https://github.com/parallax/jsPDF) — client-side PDF generation

---

## 28. References

1. Selvaraju, R. R., et al. (2017). *Grad-CAM: Visual Explanations from Deep Networks via Gradient-based Localization.* ICCV 2017.
2. Chattopadhay, A., et al. (2018). *Grad-CAM++: Generalized Gradient-based Visual Explanations for Deep Convolutional Networks.* WACV 2018.
3. Tan, M., & Le, Q. V. (2021). *EfficientNetV2: Smaller Models and Faster Training.* ICML 2021.
4. Ronneberger, O., Fischer, P., & Brox, T. (2015). *U-Net: Convolutional Networks for Biomedical Image Segmentation.* MICCAI 2015.
5. American College of Radiology. *ACR BI-RADS® Atlas, 5th Edition.* Reston, VA: ACR, 2013.
6. Hendrycks, D., & Gimpel, K. (2016). *Gaussian Error Linear Units (GELUs).* arXiv:1606.08415. [Referenced via SiLU activation in classifier head.]

---

## 29. BibTeX Citation

```bibtex
@software{medguard_ai_2025,
  title        = {{MedGuard AI}: A Multitask Deep Learning Platform for
                  Mammographic Breast Cancer Screening},
  author       = {Raseel5},
  year         = {2025},
  url          = {https://huggingface.co/Raseel5/MedGuard-AI-Weights},
  note         = {Three-service architecture: React SPA, FastAPI application
                  backend, and stateless FastAPI inference service.
                  Model: multitask EfficientNetV2 classifier + U-Net segmenter
                  with Grad-CAM++ saliency and segmentation-first ROI pipeline.
                  Database: Supabase (PostgreSQL + RLS + Realtime).
                  Bundle: MedGuard\_multitask\_bundle\_v1.pth},
}
```

---

*This document was generated by static analysis of the repository source code, configuration files, inline comments, and existing documentation. No information has been invented or assumed beyond what is directly evidenced in the codebase.*
