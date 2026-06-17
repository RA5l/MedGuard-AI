# MedGuard AI — Architecture Decisions

## Overview

This document captures the reasoning behind every significant structural change made during the frontend deep cleanup. All changes target architectural correctness and long-term maintainability, not cosmetic preference.

---

## 1. What Was Broken (Diagnosis Summary)

### 1.1 App.tsx — Unmountable Routes

The root entry point imported from paths that do not exist in the project:

- `./contexts/AuthContext` — this path never existed
- `./components/layout/AppLayout` — path is `./layouts/AppLayout`
- `./pages/Login`, `./pages/Dashboard`, etc. — all features live under `src/features/`

`AppLayout` received `isDarkMode={false}` and an `onThemeToggle` that unconditionally threw. The app could not start cleanly.

**Fix:** All imports corrected. Theme state moved inside `AppLayout`. Routes now point to feature-level pages.

### 1.2 AuthContext.tsx Was Empty

`src/features/auth/context/AuthContext.tsx` existed as an empty file. The actual auth implementation lived in `src/features/auth/hooks/useAuth.ts`, which is the wrong file for a context provider. Additionally, the auth hook did not expose `signIn`, which `LoginPage` called.

**Fix:** Full auth implementation (`AuthContext`, `AuthProvider`, `useAuth`) moved to `AuthContext.tsx`. `useAuth.ts` is now a thin re-export for consumers who import from the hooks layer. `signIn` added.

### 1.3 Pervasive Broken Import Paths

Every feature except `cases/services/caseService.ts` had at least one import resolving to a path that does not exist. Common patterns:

| Wrong | Correct |
|---|---|
| `'../contexts/AuthContext'` | `'../../../features/auth/context/AuthContext'` |
| `'../lib/supabaseClient'` | `'../../../lib/supabaseClient'` |
| `'../lib/badges'` | `'../../../lib/badges'` |
| `'../components/Spinner'` (from a page) | `'../../components/Spinner'` (shared) |
| `'../hooks/useCases'` (from dashboard/upload) | `'../../cases/hooks/useCases'` |

**Fix:** Every import path corrected globally. No local patch — every broken path was traced to its real target.

### 1.4 `useUsers.ts` Did Not Manage Users

The file exported a function named `useCases` and a duplicated `Case` type. `AdminPanelPage` imported `useUsers` from it, which does not exist. The admin user management feature had zero implementation.

**Fix:** File rewritten from scratch. Exports `useUsers`, `AdminUser`. Fetches users from Supabase, creates users via the backend API (service key operations), and deactivates via Supabase update.

### 1.5 Missing Exports in `badges.ts`

Pages referenced `ROLE_CONFIG`, `ACTIVE_STATUS_CLASSES`, and `PREDICTION_COLORS` — none of which existed in the file. Status and priority configs also lacked an optional `icon` field that badges in pages expected.

**Fix:** All missing exports added. Icons matched to each status and role. Priority keys corrected from 1–4 to 0–3 to match the form values in `CasesListPage`.

### 1.6 Field Name Inconsistency (`id` vs `case_id`)

`Case` type declared `id: string`. All page-level code referenced `c.case_id` for navigation and keying, which returned `undefined`. This caused silent broken links.

**Fix:** All page references updated to `c.id`. Type extended with optional fields that the database returns (`total_scans`, `assigned_doctor_name`, `assigned_doctor_id`, `created_by`).

### 1.7 `createCase` Missing from `useCases`

`CasesListPage` destructured `createCase` from `useCases()`. The hook did not expose it. The create-case functionality existed only in `admin/hooks/useUsers.ts` (misplaced and misnamed).

**Fix:** `createCase` added to `caseService.ts` and exposed from `useCases.ts`. Removed from admin hook.

### 1.8 Shared Components Placed in a Feature Folder

`Spinner` and `Select` lived in `features/cases/components/`. Both were imported by admin, dashboard, and upload features — cross-feature imports from a sibling feature are an architectural boundary violation.

**Fix:** Both moved to `src/components/`. Case-level imports updated to the shared path. Original feature files deleted.

---

## 2. Structural Decisions

### 2.1 Theme Management

The CSS design system uses `.light-theme` / `.dark-theme` class selectors on `<html>`, not Tailwind's `dark:` prefix utilities. Theme state is managed inside `AppLayout` via `useState` + `localStorage`, toggling the class on `document.documentElement`. This removes the need for a `ThemeContext` and the broken prop-drill that caused the startup error.

### 2.2 Layer Separation

| Layer | Location | Rule |
|---|---|---|
| Routing | `App.tsx` | Composition only — no logic |
| Layout | `src/layouts/` | Structure and chrome — no domain logic |
| Pages | `feature/pages/` | Composition only — orchestrate hooks and components |
| Hooks | `feature/hooks/` | Domain state — calls services, no JSX |
| Services | `feature/services/` | API calls only — no state |
| Shared components | `src/components/` | Stateless or minimal local state |
| Shared utilities | `src/utils/` | Pure functions — no imports from React |

Business logic (date formatting, time-of-day greeting) extracted to `src/utils/date.ts`. No utility function should live inside a page or component.

### 2.3 Auth Context Structure

`AuthContext.tsx` is the single source of truth for:

- Supabase session and user object
- Resolved `UserProfile` (joined with `roles` table)
- `signIn` / `signOut` actions
- Derived flag `isAdmin`

The two-query profile fetch (users → roles join) is kept as-is because it reflects the current schema. A future improvement would be to use a Supabase database view that joins `users` with `roles`, reducing this to a single query.

### 2.4 `caseService` as the Canonical Data Layer

All Supabase calls for the `cases` domain live in `caseService.ts`. Hooks call the service; pages call hooks. Pages never call Supabase directly — `CaseDetailsPage` previously called `getScopedQuery` inline, which violated this rule.

### 2.5 User Copy Standards

AI-generated pseudo-technical copy removed from all user-facing strings:

| Before | After |
|---|---|
| "Awaiting Diagnostic Evaluation" | "Pending Review" |
| "Algorithmic Segmentation Active" | "Processing" |
| "AI Insights Computed" | "AI Complete" |
| "Diagnostic Report Emitted" | "Report Issued" |
| "Archived Vault Record" | "Archived" |
| "Clinical record reference identity target unresolvable" | "Case not found." |
| "Mammography Scan Intake Base" | "Scan Upload" |
| "Target Clinical Case Binding Allocation" | "Link to Case" |
| "Awaiting payload allocation configuration…" | "Select a case to view its linked scans." |
| "Failure mapping clinical registries" | "Failed to load cases." |

**Rule:** Labels describe what the user sees or does, not what the system is doing internally.

### 2.6 `supabaseClient.ts` Comments

Removed: "Global Configuration Proxy Strategy" / "Isolates environments dynamically using schema hooks fetched via environment runtime context injection variables." This is AI filler with no technical content. The code is self-explanatory.

### 2.7 `tokens.ts` Scope

Design tokens retained for colors and spacing. Typography scale Tailwind strings kept as exported constants since they are already used across pages. A future iteration should migrate these to Tailwind `@layer components` or a CSS token file.

---

## 3. Files Deleted

| File | Reason |
|---|---|
| `src/features/cases/components/Spinner.tsx` | Moved to `src/components/Spinner.tsx` (shared) |
| `src/features/cases/components/Select.tsx` | Moved to `src/components/Select.tsx` (shared) |

---

## 4. Files Added

| File | Purpose |
|---|---|
| `src/components/Spinner.tsx` | Shared loading spinner |
| `src/components/Select.tsx` | Shared accessible dropdown |
| `src/utils/date.ts` | `formatDate`, `getTimeOfDay` — pure utility functions |

---

## 5. Suggested Schema / Contract Additions

The following fields are referenced in the UI but assumed to come from a database view or RPC — they should be confirmed in the backend schema:

- `cases.total_scans` — count of scans per case (likely from a view)
- `cases.assigned_doctor_name` — joined from `users` (likely from a view)

**Recommendation:** Create a `case_summary` view in Supabase that joins `cases` with `users` and counts `scans`. Eliminates the need for frontend joins and keeps data fetching to a single query.

---

## 6. What Was Not Changed

- `index.css` — CSS design token system is well-structured; no changes required
- `lib/api.ts` — Axios interceptor is correct
- `layouts/AppLayout.tsx` structure — HTML skeleton is appropriate; only theme management was changed
- `layouts/Sidebar.tsx` — Logic is sound; only import paths were fixed
- Route structure in `App.tsx` — The URL paths are correct; only the component imports were broken
