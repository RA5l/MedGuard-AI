import { useState, useEffect, useMemo } from 'react';
import {
  ClipboardList, Sparkles, Pencil, FileCheck2, FileDown,
  ShieldCheck, AlertCircle, Gauge, ScanLine, Hash, List,
  Brain, MessageSquare, Stethoscope,
} from 'lucide-react';
import { useCases } from '../../cases/hooks/useCases';
import { useScans } from '../../cases/hooks/useScans';
import { useAuth } from '../../auth/context/AuthContext';
import { reportService } from '../services/reportService';
import type { MedicalReport } from '../services/reportService';
import { aiService } from '../../ai-results/services/aiService';
import type { AIResult } from '../../ai-results/services/aiService';
import { logAudit } from '../../../lib/auditLog';
import { supabase } from '../../../lib/supabaseClient';
import { exportReportToPdf } from '../utils/exportReportPdf';
import Select from '../../../components/Select';
import Spinner from '../../../components/Spinner';
import { formatDate } from '../../../utils/date';

const BIRADS_OPTIONS = ['0', '1', '2', '3', '4A', '4B', '4C', '5', '6'].map(v => ({
  value: v,
  label: `BI-RADS ${v}`,
}));

const BREAST_DENSITY_OPTIONS = [
  { value: 'A', label: 'A – Almost entirely fatty' },
  { value: 'B', label: 'B – Scattered fibroglandular densities' },
  { value: 'C', label: 'C – Heterogeneously dense' },
  { value: 'D', label: 'D – Extremely dense' },
];

// Derived display label only — not a stored DB field.
function riskLevelFor(prediction?: string): { label: string; tone: string } {
  switch (prediction) {
    case 'Malignant': return { label: 'High',    tone: 'text-medical-malignant' };
    case 'Benign':    return { label: 'Low',      tone: 'text-medical-success'   };
    default:          return { label: 'Pending',  tone: 'text-medical-text/40'   };
  }
}

interface ReportForm {
  biRads: string;
  finalRecommendation: string;
  findings: string;
  impression: string;
  recommendation: string;
  breastDensity: string;
  doctorNotes: string;
}

const EMPTY_FORM: ReportForm = {
  biRads: '',
  finalRecommendation: '',
  findings: '',
  impression: '',
  recommendation: '',
  breastDensity: '',
  doctorNotes: '',
};

type ReportStatus = 'draft' | 'ready' | 'finalized';

// ── Small reusable section wrapper ──────────────────────────────────────────
function SectionBlock({
  icon, title, badge, children,
}: {
  icon: React.ReactNode;
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-medical-accent">{icon}</span>
        <h3 className="text-sm font-bold text-medical-text">{title}</h3>
        {badge && (
          <span className="ml-auto text-[10px] font-medium text-medical-text/40 bg-medical-border/40 px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

// ── Editable textarea ────────────────────────────────────────────────────────
function EditableTextarea({
  value, onChange, readOnly, rows = 4, placeholder,
}: {
  value: string;
  onChange?: (v: string) => void;
  readOnly: boolean;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange?.(e.target.value)}
      readOnly={readOnly}
      rows={rows}
      placeholder={placeholder}
      className={`w-full px-4 py-3 rounded-xl border text-sm leading-relaxed outline-none resize-none transition-colors ${
        readOnly
          ? 'border-medical-border bg-medical-bg/50 text-medical-text/80 cursor-default'
          : 'border-medical-accent/40 bg-medical-bg text-medical-text focus:ring-2 focus:ring-medical-accent/30'
      }`}
    />
  );
}

// ── Read-only display value ──────────────────────────────────────────────────
function ReadValue({ value }: { value?: string }) {
  return (
    <p className="px-3 py-2.5 rounded-lg border border-medical-border bg-medical-bg/50 text-sm text-medical-text/80">
      {value || '—'}
    </p>
  );
}

export default function ReportsPage() {
  const { cases, loading: casesLoading } = useCases();
  const { profile } = useAuth();
  const canWrite = profile?.role === 'admin' || profile?.role === 'doctor' || profile?.role === 'radiologist';

  const [selectedCaseId, setSelectedCaseId] = useState('');
  const selectedCase = useMemo(() => cases.find(c => c.id === selectedCaseId) ?? null, [cases, selectedCaseId]);
  const { scans } = useScans(selectedCaseId);

  const [report, setReport]               = useState<MedicalReport | null>(null);
  const [doctorName, setDoctorName]       = useState('');
  const [loadingReport, setLoadingReport] = useState(false);
  const [loadError, setLoadError]         = useState('');

  const [aiResult, setAiResult]               = useState<AIResult | null>(null);
  const [aiResultLoading, setAiResultLoading] = useState(false);

  const [editing, setEditing]   = useState(false);
  const [form, setForm]         = useState<ReportForm>(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [saveError, setSaveError] = useState('');
  const [exporting, setExporting] = useState(false);

  const caseOptions = cases.map(c => ({
    value: c.id,
    label: c.patient_alias ? `${c.case_code} · ${c.patient_alias}` : c.case_code,
  }));

  // Derived: unique scan view types for this case
  const scanTypesLabel = useMemo(
    () => scans.length ? [...new Set(scans.map(s => s.scan_view_type))].join(', ') : '—',
    [scans]
  );

  const loadReport = async (caseId: string) => {
    setLoadingReport(true);
    setLoadError('');
    setReport(null);
    setDoctorName('');
    try {
      const data = await reportService.getReportByCaseId(caseId);
      setReport(data);
      if (data) {
        const names = await reportService.getDoctorNames([data.doctor_id]);
        setDoctorName(names[data.doctor_id] ?? 'Unknown doctor');
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load report.');
    } finally {
      setLoadingReport(false);
    }
  };

  useEffect(() => {
    if (selectedCaseId) {
      loadReport(selectedCaseId);
      setAiResultLoading(true);
      aiService.getResultByCaseId(selectedCaseId)
        .then(setAiResult)
        .catch(() => setAiResult(null))
        .finally(() => setAiResultLoading(false));
    } else {
      setReport(null); setEditing(false); setAiResult(null);
    }
  }, [selectedCaseId]);

  // "Generate AI Summary" — composes a structured draft from ai_results.
  // Swap this for a real backend call once a Gemini endpoint exists.
  const handleGenerateSummary = async () => {
    if (!selectedCase) return;
    const scanTypes = scans.length
      ? [...new Set(scans.map(s => s.scan_view_type))].join(', ')
      : 'no scans on file';

    let draft: string;
    if (aiResult) {
      const probs = aiResult.generated_report?.probabilities;
      const probsLine = probs
        ? Object.entries(probs).map(([label, p]) => `${label} ${(p * 100).toFixed(1)}%`).join(', ')
        : `${(aiResult.confidence * 100).toFixed(1)}% confidence`;
      const roiNote = aiResult.generated_report?.roi_source === 'center_crop_fallback'
        ? ' Note: this analysis used an automatic center-crop (no lesion marking) and should be treated as preliminary, not validated.'
        : '';

      draft =
`Mammography screening for case ${selectedCase.case_code}${selectedCase.patient_alias ? ` (${selectedCase.patient_alias})` : ''} was reviewed across the following views: ${scanTypes}.

Automated analysis (pipeline ${aiResult.pipeline_version ?? 'unknown'}) returned a "${aiResult.prediction}" classification (${probsLine}).${roiNote} ${
  aiResult.prediction === 'Malignant'
    ? 'Findings are suspicious for malignancy and warrant prompt radiologist correlation and follow-up imaging or biopsy as clinically indicated.'
    : 'No findings suspicious for malignancy were identified on automated review.'
}

[Draft generated from the case's AI analysis result — review and edit before finalizing.]`;
    } else {
      draft =
`Mammography screening for case ${selectedCase.case_code}${selectedCase.patient_alias ? ` (${selectedCase.patient_alias})` : ''} was reviewed across the following views: ${scanTypes}.

No AI analysis has been completed for this case yet. Run an analysis from the AI Results page first, or proceed with a fully manual report.

[Draft generated from stored case data — review and edit before finalizing.]`;
    }

    setForm(f => ({ ...f, finalRecommendation: draft }));
    if (!editing) setEditing(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await logAudit(session.user.id, 'AI_SUMMARY_GENERATED', 'reports', selectedCase.id, {
        case_id: selectedCase.id, used_real_ai_result: !!aiResult,
      });
    }
  };

  const startEditExisting = () => {
    setForm({
      biRads:              report?.bi_rads              ?? '',
      finalRecommendation: report?.final_recommendation ?? '',
      findings:            report?.findings             ?? '',
      impression:          report?.impression           ?? '',
      recommendation:      report?.recommendation       ?? '',
      breastDensity:       report?.breast_density       ?? '',
      doctorNotes:         report?.doctor_notes         ?? '',
    });
    setSaveError('');
    setEditing(true);
  };

  const handleSave = async (finalize: boolean) => {
    if (!selectedCaseId || !form.biRads || !form.finalRecommendation) return;
    setSaving(true);
    setSaveError('');
    try {
      const payload = {
        caseId:              selectedCaseId,
        biRads:              form.biRads,
        finalRecommendation: form.finalRecommendation,
        findings:            form.findings,
        impression:          form.impression,
        recommendation:      form.recommendation,
        breastDensity:       form.breastDensity,
        doctorNotes:         form.doctorNotes,
        isFinalized:         finalize,
      };
      if (report) {
        await reportService.updateReport(report.id, payload);
      } else {
        await reportService.createReport(payload);
      }
      setEditing(false);
      await loadReport(selectedCaseId);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save report.');
    } finally {
      setSaving(false);
    }
  };

  const handleExportPdf = async () => {
    if (!report || !selectedCase) return;
    setExporting(true);
    try {
      exportReportToPdf({
        caseCode:            selectedCase.case_code,
        patientAlias:        selectedCase.patient_alias,
        biRads:              report.bi_rads,
        finalRecommendation: report.final_recommendation,
        findings:            report.findings,
        impression:          report.impression,
        recommendation:      report.recommendation,
        breastDensity:       report.breast_density,
        views:               scanTypesLabel !== '—' ? scanTypesLabel : undefined,
        doctorNotes:         report.doctor_notes,
        isFinalized:         report.is_finalized,
        doctorName,
        createdAt:           report.created_at,
        finalizedAt:         report.finalized_at,
      });

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await logAudit(session.user.id, 'REPORT_PDF_EXPORTED', 'reports', report.id, {
          case_id: selectedCase.id, case_code: selectedCase.case_code,
        });
      }
    } finally {
      setExporting(false);
    }
  };

  const canSubmit = !!(form.biRads && form.finalRecommendation.trim().length > 0 && !saving);

  const status: ReportStatus = report?.is_finalized
    ? 'finalized'
    : (editing ? canSubmit : !!report)
      ? 'ready'
      : 'draft';

  const STATUS_DISPLAY: Record<ReportStatus, { label: string; classes: string }> = {
    draft:     { label: 'Draft',             classes: 'bg-medical-pending-soft text-medical-pending' },
    ready:     { label: 'Ready to Finalize', classes: 'bg-medical-warning-bg text-medical-warning'   },
    finalized: { label: 'Finalized',         classes: 'bg-medical-success-bg text-medical-success'   },
  };

  const risk = riskLevelFor(aiResult?.prediction);

  const densityLabel = (val?: string) =>
    BREAST_DENSITY_OPTIONS.find(o => o.value === val)?.label ?? val ?? '—';

  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-medical-primary/10 text-medical-primary flex items-center justify-center shrink-0">
            <ClipboardList className="w-5 h-5" strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-medical-text tracking-tight">Clinical Report</h2>
            <p className="text-medical-text/40 text-sm">Generate, review, edit, and finalize the mammography report.</p>
          </div>
        </div>

        <button
          onClick={handleExportPdf}
          disabled={!report || exporting}
          title={!report ? 'Create or finalize a report first' : undefined}
          className="self-start sm:self-auto bg-medical-surface border border-medical-border text-medical-text text-sm font-semibold px-4 py-2.5 rounded-lg hover:border-medical-accent/50 transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {exporting ? <Spinner size="sm" /> : <FileDown className="w-4 h-4" strokeWidth={2} />} Export PDF
        </button>
      </div>

      {/* Case selector */}
      <div className="bg-medical-surface border border-medical-border rounded-xl p-5">
        <label className="block text-medical-text/70 text-sm font-medium mb-2">Case</label>
        {casesLoading ? (
          <div className="h-10 bg-medical-border/30 rounded-lg animate-pulse" />
        ) : (
          <Select
            value={selectedCaseId}
            onChange={setSelectedCaseId}
            placeholder="Select a case…"
            options={caseOptions}
          />
        )}
      </div>

      {selectedCaseId && selectedCase && (
        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] items-start">

          {/* ── Main editor card ── */}
          <div className="bg-medical-surface border border-medical-border rounded-2xl shadow-sm p-6 space-y-6">

            {loadingReport ? (
              <div className="flex justify-center py-10"><Spinner /></div>

            ) : loadError ? (
              <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" /><p className="font-medium">{loadError}</p>
              </div>

            ) : (
              <>
                {/* ── 1. AI Generated Summary ── */}
                <SectionBlock
                  icon={<Sparkles className="w-4 h-4" strokeWidth={2} />}
                  title="AI Generated Summary"
                  badge="AI-assisted"
                >
                  <p className="text-xs text-medical-text/50 leading-relaxed">
                    AI generates a structured clinical summary from the case's stored data and AI analysis results.
                    The doctor remains fully in control — refine the generated text below before finalizing.
                  </p>

                  {(editing || report) ? (
                    <>
                      {editing && report?.is_finalized && (
                        <div className="p-3 bg-medical-warning-bg border border-medical-warning/30 rounded-xl flex items-center gap-2 text-medical-warning text-xs">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <p className="font-medium">You're editing an already-finalized report. Saving will update the finalized record.</p>
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-medium text-medical-text/60 mb-1.5">Report Text</label>
                        <EditableTextarea
                          value={editing ? form.finalRecommendation : (report?.final_recommendation ?? '')}
                          onChange={v => setForm(f => ({ ...f, finalRecommendation: v }))}
                          readOnly={!editing}
                          rows={7}
                          placeholder="Click &quot;Generate AI Summary&quot; to draft this section, or write the report manually…"
                        />
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-medical-text/40 italic py-6 text-center border border-dashed border-medical-border rounded-xl">
                      No report yet — generate an AI summary or start writing manually.
                    </p>
                  )}
                </SectionBlock>

                <div className="border-t border-medical-border" />

                {/* ── 2. Findings ── */}
                <SectionBlock
                  icon={<List className="w-4 h-4" strokeWidth={2} />}
                  title="Findings"
                  badge="Physician-controlled"
                >
                  <p className="text-xs text-medical-text/50 leading-relaxed">
                    Structured radiologist observations. Independent from the AI summary.
                  </p>
                  {editing ? (
                    <EditableTextarea
                      value={form.findings}
                      onChange={v => setForm(f => ({ ...f, findings: v }))}
                      readOnly={false}
                      rows={4}
                      placeholder={`• Irregular mass identified in the right breast.\n• No suspicious calcifications.\n• Mild architectural distortion noted.`}
                    />
                  ) : (
                    <ReadValue value={report?.findings} />
                  )}
                </SectionBlock>

                <div className="border-t border-medical-border" />

                {/* ── 3. Breast Density ── */}
                <SectionBlock
                  icon={<Brain className="w-4 h-4" strokeWidth={2} />}
                  title="Breast Density"
                  badge="Physician-controlled"
                >
                  {editing ? (
                    <Select
                      value={form.breastDensity}
                      onChange={v => setForm(f => ({ ...f, breastDensity: v }))}
                      placeholder="Select density category…"
                      options={BREAST_DENSITY_OPTIONS}
                    />
                  ) : (
                    <ReadValue value={densityLabel(report?.breast_density)} />
                  )}
                </SectionBlock>

                <div className="border-t border-medical-border" />

                {/* ── 4. Impression ── */}
                <SectionBlock
                  icon={<MessageSquare className="w-4 h-4" strokeWidth={2} />}
                  title="Impression"
                  badge="Physician-controlled"
                >
                  <p className="text-xs text-medical-text/50 leading-relaxed">
                    Overall radiologist assessment of the case.
                  </p>
                  {editing ? (
                    <EditableTextarea
                      value={form.impression}
                      onChange={v => setForm(f => ({ ...f, impression: v }))}
                      readOnly={false}
                      rows={3}
                      placeholder="e.g. Suspicious right breast lesion requiring tissue diagnosis."
                    />
                  ) : (
                    <ReadValue value={report?.impression} />
                  )}
                </SectionBlock>

                <div className="border-t border-medical-border" />

                {/* ── 5. BI-RADS Category ── */}
                <SectionBlock
                  icon={<Stethoscope className="w-4 h-4" strokeWidth={2} />}
                  title="BI-RADS Category"
                  badge="Physician-controlled"
                >
                  <p className="text-xs text-medical-text/50 leading-relaxed">
                    Assigned by the radiologist. Not derived from AI classification.
                  </p>
                  {editing ? (
                    <Select
                      value={form.biRads}
                      onChange={v => setForm(f => ({ ...f, biRads: v }))}
                      placeholder="Select category…"
                      options={BIRADS_OPTIONS}
                    />
                  ) : (
                    <ReadValue value={report?.bi_rads ? `BI-RADS ${report.bi_rads}` : undefined} />
                  )}
                </SectionBlock>

                <div className="border-t border-medical-border" />

                {/* ── 6. Recommendation ── */}
                <SectionBlock
                  icon={<FileCheck2 className="w-4 h-4" strokeWidth={2} />}
                  title="Recommendation"
                  badge="Physician-controlled"
                >
                  {editing ? (
                    <EditableTextarea
                      value={form.recommendation}
                      onChange={v => setForm(f => ({ ...f, recommendation: v }))}
                      readOnly={false}
                      rows={3}
                      placeholder={`e.g.\n• Routine annual screening.\n• Short-term follow-up.\n• Tissue biopsy recommended.`}
                    />
                  ) : (
                    <ReadValue value={report?.recommendation} />
                  )}
                </SectionBlock>

                <div className="border-t border-medical-border" />

                {/* ── 7. Doctor Notes ── */}
                <SectionBlock
                  icon={<Pencil className="w-4 h-4" strokeWidth={2} />}
                  title="Doctor Notes"
                  badge="Internal only"
                >
                  {editing ? (
                    <input
                      type="text"
                      value={form.doctorNotes}
                      onChange={e => setForm(f => ({ ...f, doctorNotes: e.target.value }))}
                      placeholder="Internal notes (optional)…"
                      className="w-full px-3 py-2.5 rounded-lg border border-medical-border bg-medical-bg text-medical-text text-sm outline-none focus:ring-2 focus:ring-medical-accent/30"
                    />
                  ) : (
                    <ReadValue value={report?.doctor_notes} />
                  )}
                </SectionBlock>

                {saveError && <p className="text-xs text-medical-malignant">{saveError}</p>}

                {/* ── Action buttons ── */}
                {canWrite && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-medical-border">
                    <button
                      onClick={handleGenerateSummary}
                      disabled={saving}
                      className="mt-4 bg-medical-primary text-white text-sm font-bold px-4 py-2.5 rounded-lg hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Sparkles className="w-4 h-4" strokeWidth={2.5} /> Generate AI Summary
                    </button>

                    {!editing && (
                      <button
                        onClick={startEditExisting}
                        className="mt-4 text-sm font-semibold text-medical-text px-4 py-2.5 rounded-lg border border-medical-border hover:bg-medical-bg transition-colors flex items-center gap-2"
                      >
                        <Pencil className="w-4 h-4" strokeWidth={2} /> Edit Manually
                      </button>
                    )}

                    {editing && (
                      <button
                        onClick={() => { setEditing(false); setSaveError(''); }}
                        disabled={saving}
                        className="mt-4 text-sm font-semibold text-medical-text/60 px-4 py-2.5 rounded-lg hover:bg-medical-bg transition-colors"
                      >
                        Cancel
                      </button>
                    )}

                    <button
                      onClick={() => handleSave(true)}
                      disabled={!editing || !canSubmit}
                      className="mt-4 bg-medical-success text-white text-sm font-bold px-4 py-2.5 rounded-lg hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {saving ? <Spinner size="sm" /> : <FileCheck2 className="w-4 h-4" strokeWidth={2.5} />}
                      {report?.is_finalized ? 'Re-finalize Report' : 'Finalize Report'}
                    </button>

                    {editing && (
                      <button
                        onClick={() => handleSave(false)}
                        disabled={!canSubmit}
                        className="mt-4 text-xs font-medium text-medical-text/50 px-3 py-2.5 hover:text-medical-text/80 transition-colors"
                      >
                        {report?.is_finalized ? 'or revert to draft' : 'or save as draft'}
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Right summary panel ── */}
          <div className="space-y-4">

            {/* Status card */}
            <div className="bg-medical-surface border border-medical-border rounded-2xl shadow-sm p-5">
              <p className="text-xs font-medium text-medical-text/50 mb-2">Report Status</p>
              <span className={`inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-full ${STATUS_DISPLAY[status].classes}`}>
                {STATUS_DISPLAY[status].label}
              </span>
              <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-medical-text/45 bg-medical-bg border border-medical-border rounded-full px-2.5 py-1">
                <ShieldCheck className="w-3 h-3" strokeWidth={2} /> AI-assisted · Doctor-reviewed
              </div>
            </div>

            {/* Case details */}
            <div className="bg-medical-surface border border-medical-border rounded-2xl shadow-sm p-5 space-y-3">
              <p className="text-xs font-medium text-medical-text/50">Case Details</p>

              <div className="flex items-center justify-between text-sm">
                <span className="text-medical-text/50 inline-flex items-center gap-1.5"><Hash className="w-3.5 h-3.5" /> Case ID</span>
                <span className="font-mono font-semibold text-medical-text">{selectedCase.case_code}</span>
              </div>
              <div className="flex items-start justify-between text-sm gap-2">
                <span className="text-medical-text/50 inline-flex items-center gap-1.5 shrink-0"><ScanLine className="w-3.5 h-3.5" /> Views</span>
                <span className="text-medical-text font-medium text-right">{scanTypesLabel}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-medical-text/50">AI Prediction</span>
                <span className="font-semibold text-medical-text">
                  {aiResultLoading ? '…' : aiResult ? aiResult.prediction : 'Pending'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-medical-text/50 inline-flex items-center gap-1.5"><Gauge className="w-3.5 h-3.5" /> Confidence</span>
                <span className="font-semibold text-medical-text">
                  {aiResult ? `${(aiResult.confidence * 100).toFixed(0)}%` : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-medical-text/50">Risk Level</span>
                <span className={`font-semibold ${risk.tone}`}>{risk.label}</span>
              </div>
            </div>

            {/* AI Heatmap */}
            {aiResult?.heatmap_url && (
              <div className="bg-medical-surface border border-medical-border rounded-2xl shadow-sm p-5 space-y-2">
                <p className="text-xs font-medium text-medical-text/50">AI Lesion Heatmap</p>
                <img src={aiResult.heatmap_url} alt="AI-generated lesion heatmap" className="rounded-lg border border-medical-border w-full" />
                {aiResult.generated_report?.roi_source === 'center_crop_fallback' && (
                  <p className="text-[11px] text-medical-warning leading-relaxed">
                    Unvalidated — no lesion marking was used for this analysis.
                  </p>
                )}
              </div>
            )}

            {/* Report metadata */}
            {report && (
              <div className="bg-medical-surface border border-medical-border rounded-2xl shadow-sm p-5 space-y-1.5 text-xs text-medical-text/50">
                <p>Authored by <span className="text-medical-text/80 font-medium">{doctorName}</span></p>
                <p>Created {formatDate(report.created_at)}</p>
                {report.finalized_at && <p>Finalized {formatDate(report.finalized_at)}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
