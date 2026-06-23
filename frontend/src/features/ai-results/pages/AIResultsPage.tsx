import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, Clock, AlertCircle, Sparkles,
  AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Cpu,
  UploadCloud, ScanLine, Save, CheckCheck,
} from 'lucide-react';
import { useCases }  from '../../cases/hooks/useCases';
import { useScans }  from '../../cases/hooks/useScans';
import { useAuth }   from '../../auth/context/AuthContext';
import { aiService } from '../services/aiService';
import type { AIResult, AnnotationData } from '../services/aiService';
import Select         from '../../../components/Select';
import Spinner        from '../../../components/Spinner';
import CircularGauge  from '../../../components/CircularGauge';
import { formatDate } from '../../../utils/date';
import CanvasWorkstation from '../components/CanvasWorkstation';

// ---------------------------------------------------------------------------
// Static config
// ---------------------------------------------------------------------------

const sanitizeUnicodeString = (text: string | undefined): string => {
  if (!text) return '';
  return text
    .replace(/\\u00b7/g, '·')
    .replace(/\\u2713/g, '✓')
    .replace(/\\u2026/g, '…')
    .replace(/u00b7/g, '·') 
    .replace(/u2713/g, '✓');
};

const MODEL_NAME = 'MedGuard_multitask_bundle_v1';

const PREDICTION_CONFIG: Record<
  string,
  { label: string; banner: string; gauge: string; chip: string; icon: ReactNode }
> = {
  Malignant: {
    label:  'Malignant',
    banner: 'bg-rose-950/60 border-rose-700/60 text-rose-300',
    gauge:  'stroke-medical-malignant',
    chip:   'bg-rose-900/60 text-rose-300 border-rose-700/50',
    icon:   <AlertTriangle className="w-5 h-5" strokeWidth={2} />,
  },
  Benign: {
    label:  'Benign',
    banner: 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300',
    gauge:  'stroke-medical-success',
    chip:   'bg-emerald-900/60 text-emerald-300 border-emerald-700/50',
    icon:   <CheckCircle2 className="w-5 h-5" strokeWidth={2} />,
  },
};

const CLINICAL_INSIGHTS: Record<string, string[]> = {
  Malignant: [
    'Suspicious mass features detected',
    'Irregular margin characteristics noted',
    'Recommend radiologist confirmation',
    'Consider biopsy if clinically indicated',
  ],
  Benign: [
    'No suspicious mass features detected',
    'Regular margin characteristics noted',
    'Routine follow-up recommended',
    'Continue standard screening protocol',
  ],
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function AnalysisProgressBar({
  analyzing,
  hasResult,
}: {
  analyzing: boolean;
  hasResult: boolean;
}) {
  return (
    <div className="flex items-center justify-between bg-medical-surface border border-medical-border rounded-xl px-6 py-3 gap-6">
      <div className="flex-1 space-y-1.5">
        <div className="flex items-center justify-between mb-1">
          <span
            className={`text-xs font-semibold transition-colors ${
              analyzing
                ? 'text-medical-primary'
                : hasResult
                ? 'text-medical-success'
                : 'text-medical-text/40'
            }`}
          >
            {analyzing ? 'Analyzing scan…' : hasResult ? 'Analysis Complete' : 'Ready for Analysis'}
          </span>
          {hasResult && !analyzing && <CheckCheck className="w-3.5 h-3.5 text-medical-success" />}
          {analyzing && <Spinner size="sm" />}
        </div>
        <div className="h-1.5 w-full rounded-full bg-medical-border overflow-hidden relative">
          {analyzing ? (
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-transparent via-medical-primary to-transparent animate-pulse"
              style={{ width: '60%' }}
            />
          ) : hasResult ? (
            <div className="h-full w-full rounded-full bg-medical-success transition-all duration-700" />
          ) : (
            <div className="h-full w-1/6 rounded-full bg-medical-border/60" />
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-medical-text/40 shrink-0">
        <Activity className="w-3.5 h-3.5" />
        AI Analysis Results
      </div>
    </div>
  );
}

function EmptyScansCard({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="col-span-2 flex flex-col items-center justify-center py-20 bg-medical-surface border border-dashed border-medical-border rounded-2xl">
      <ScanLine className="w-14 h-14 text-medical-text/15 mb-5" strokeWidth={1} />
      <p className="text-base font-semibold text-medical-text/50 mb-1.5">
        No mammography scans found for this patient.
      </p>
      <p className="text-xs text-medical-text/30 mb-7">
        Upload a scan to enable AI analysis.
      </p>
      <button
        onClick={onUpload}
        className="flex items-center gap-2 bg-medical-primary text-white text-sm font-bold px-6 py-2.5 rounded-xl hover:opacity-90 active:scale-95 transition-all"
      >
        <UploadCloud className="w-4 h-4" />
        Upload New Scan
      </button>
    </div>
  );
}

function ColorLegend() {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 py-5 px-1 h-full">
      <span
        className="text-[9px] font-semibold text-white/50 tracking-widest"
        style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}
      >
        HIGH
      </span>
      <div
        className="flex-1 w-3 rounded-full"
        style={{
          background:
            'linear-gradient(to bottom, #ff0000, #ff7700, #ffff00, #00ffff, #0000ff)',
          minHeight: '60px',
          maxHeight: '200px',
        }}
      />
      <span
        className="text-[9px] font-semibold text-white/50 tracking-widest"
        style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}
      >
        LOW
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function AIResultsPage() {
  const navigate = useNavigate();
  const { cases, loading: casesLoading } = useCases();
  const { profile } = useAuth();
  const canAnalyze = profile?.role === 'admin' || profile?.role === 'doctor';

  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [selectedScanId, setSelectedScanId] = useState('');
  const { scans, loading: scansLoading } = useScans(selectedCaseId);

  const selectedScan = scans.find((s) => s.id === selectedScanId);

  const [result,       setResult]       = useState<AIResult | null>(null);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [analyzing,    setAnalyzing]    = useState(false);
  const [analyzeError, setAnalyzeError] = useState('');
  const [showMeta,     setShowMeta]     = useState(false);

  const [originalAnnotations, setOriginalAnnotations] = useState<object[]>([]);
  const [heatmapAnnotations,  setHeatmapAnnotations]  = useState<object[]>([]);
  const [isSaving,             setIsSaving]             = useState(false);
  const [savedOk,              setSavedOk]              = useState(false);
  const [saveError,            setSaveError]            = useState('');

  const caseOptions = cases.map((c) => ({
    value: c.id,
    label: c.patient_alias ? `${c.case_code} · ${c.patient_alias}` : c.case_code,
  }));
  
  const scanOptions = scans.map((s) => ({
    value: s.id,
    label: sanitizeUnicodeString(`${s.scan_view_type} · ${s.laterality} · ${formatDate(s.created_at)}`),
  }));

  useEffect(() => {
    if (scans.length === 1) setSelectedScanId(scans[0].id);
    else setSelectedScanId('');
  }, [scans]);

  useEffect(() => {
    if (!selectedCaseId) { setResult(null); return; }
    setLoading(true);
    setError('');
    setResult(null);
    aiService
      .getResultByCaseId(selectedCaseId)
      .then(setResult)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load AI result.'))
      .finally(() => setLoading(false));
  }, [selectedCaseId]);

  useEffect(() => {
    if (!result) return;
    const ann = result.annotations as AnnotationData | undefined;
    setOriginalAnnotations(ann?.original ?? []);
    setHeatmapAnnotations(ann?.heatmap  ?? []);
  }, [result?.id]);

  const handleAnalyze = async () => {
    if (!selectedScanId) return;
    setAnalyzing(true);
    setAnalyzeError('');
    try {
      const fresh = await aiService.analyzeCase(selectedScanId);
      setResult(fresh);
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : 'Analysis failed.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveAnnotations = async () => {
    if (!result) return;
    setIsSaving(true);
    setSaveError('');
    setSavedOk(false);
    try {
      await aiService.saveAnnotations(result.id, {
        original: originalAnnotations,
        heatmap:  heatmapAnnotations,
      });
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 3500);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save annotations.');
    } finally {
      setIsSaving(false);
    }
  };

  const goToUpload = () => navigate(`/scans?case=${selectedCaseId}`);

  const predCfg       = result ? PREDICTION_CONFIG[result.prediction] : null;
  const confidencePct = result ? Math.round(result.confidence * 100)  : 0;
  const hasScans      = scans.length > 0;
  const showEmpty     = !!selectedCaseId && !scansLoading && !hasScans;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      <AnalysisProgressBar analyzing={analyzing} hasResult={!!result} />

      <div className="grid gap-5 lg:grid-cols-[320px_1fr_300px]">

        {/* Left: Smart Input */}
        <div className="space-y-4">
          <div className="bg-medical-surface border border-medical-border rounded-2xl p-5">
            <p className="text-xs font-semibold text-medical-text/50 uppercase tracking-widest mb-3">
              Smart Input
            </p>

            <div className="mb-3">
              <label className="block text-xs font-medium text-medical-text/60 mb-1.5">Patient Case</label>
              {casesLoading ? (
                <div className="h-10 bg-medical-border/30 rounded-lg animate-pulse" />
              ) : (
                <Select value={selectedCaseId} onChange={setSelectedCaseId} placeholder="Select a case…" options={caseOptions} />
              )}
            </div>

            {selectedCaseId && (
              <div className="mb-4">
                <label className="block text-xs font-medium text-medical-text/60 mb-1.5">Mammography Scan</label>
                {scansLoading ? (
                  <div className="h-10 bg-medical-border/30 rounded-lg animate-pulse" />
                ) : scans.length === 0 ? (
                  <p className="text-xs text-medical-text/40 px-3 py-2 border border-dashed border-medical-border rounded-lg">
                    No scans available for this patient.
                  </p>
                ) : (
                  <Select value={selectedScanId} onChange={setSelectedScanId} placeholder="Select a scan…" options={scanOptions} />
                )}
              </div>
            )}

            {selectedScan?.original_scan_url && (
              <div className="relative rounded-xl overflow-hidden border border-medical-border bg-black aspect-square">
                <img
                  src={selectedScan.original_scan_url}
                  alt="Selected mammography scan"
                  className="w-full h-full object-contain"
                />
                <span className="absolute bottom-2 left-2 text-[10px] bg-black/70 text-white px-2 py-0.5 rounded-full">
                  {sanitizeUnicodeString(`${selectedScan.scan_view_type} · ${selectedScan.laterality}`)}
                </span>
              </div>
            )}

            {canAnalyze && selectedCaseId && hasScans && (
              <>
                {analyzeError && (
                  <div className="mt-3 p-2.5 bg-rose-950/50 border border-rose-700/50 rounded-lg flex items-center gap-2 text-rose-300 text-xs">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <p>{analyzeError}</p>
                  </div>
                )}
                <button
                  onClick={handleAnalyze}
                  disabled={!selectedScanId || analyzing}
                  className="mt-3 w-full bg-medical-primary text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {analyzing ? <Spinner size="sm" /> : <Sparkles className="w-4 h-4" strokeWidth={2.5} />}
                  {analyzing ? 'Analyzing…' : 'Run AI Analysis'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Center: Dual-View Canvas Workstation */}
        {showEmpty ? (
          <EmptyScansCard onUpload={goToUpload} />
        ) : (
          <div className="bg-medical-surface border border-medical-border rounded-2xl overflow-hidden flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-medical-border shrink-0">
              <div>
                <p className="text-xs font-semibold text-medical-text uppercase tracking-wider">
                  Dual-View Analysis
                </p>
                <p className="text-[10px] text-medical-text/40 mt-0.5">
                  {sanitizeUnicodeString(`Left: Original Scan · Right: AI Heatmap (Grad-CAM++) · `)}
                  <span className="font-mono text-medical-accent/70">{MODEL_NAME}</span>
                </p>
              </div>

              {result && (
                <div className="flex items-center gap-2">
                  {savedOk && (
                    <span className="text-[11px] text-medical-success flex items-center gap-1">
                      <CheckCheck className="w-3.5 h-3.5" /> Saved
                    </span>
                  )}
                  {saveError && <span className="text-[11px] text-rose-400">{saveError}</span>}
                  <button
                    onClick={handleSaveAnnotations}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-medical-accent/10 text-medical-accent border border-medical-accent/20 hover:bg-medical-accent/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isSaving ? <Spinner size="sm" /> : <Save className="w-3.5 h-3.5" />}
                    Save Annotations
                  </button>
                </div>
              )}
            </div>

            {/* Body */}
            {loading ? (
              <div className="flex justify-center items-center h-64"><Spinner /></div>
            ) : error ? (
              <div className="p-6 flex items-center gap-2 text-rose-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" /><p>{error}</p>
              </div>
            ) : !result ? (
              <div className="flex flex-col items-center justify-center h-64 text-medical-text/30">
                <Clock className="w-10 h-10 mb-3" strokeWidth={1.5} />
                <p className="text-sm">
                  {canAnalyze ? 'Select a scan and run analysis' : 'Ask a doctor to run an analysis'}
                </p>
              </div>
            ) : (
              <>
                <div className="flex gap-6 h-80 sm:h-96 p-4">
                  <div className="flex-1 rounded-xl overflow-hidden border border-medical-border/40 bg-black min-w-0">
                    <CanvasWorkstation
                      key={`orig-${result.id}`}
                      imageUrl={selectedScan?.original_scan_url}
                      label="Original Mammogram"
                      initialAnnotations={originalAnnotations}
                      onAnnotationsChange={setOriginalAnnotations}
                    />
                  </div>

                  <div className="flex-1 rounded-xl overflow-hidden border border-medical-border/40 bg-black min-w-0">
                    <CanvasWorkstation
                      key={`heat-${result.id}`}
                      imageUrl={result.heatmap_url}
                      label="AI Heatmap (Grad-CAM++)"
                      initialAnnotations={heatmapAnnotations}
                      onAnnotationsChange={setHeatmapAnnotations}
                    />
                  </div>

                  <div className="w-9 shrink-0 rounded-xl border border-medical-border/30 bg-black/40 flex flex-col items-center">
                    <ColorLegend />
                  </div>
                </div>

                {result.generated_report?.segmentation_mask_url && (
                  <div className="border-t border-medical-border/50 px-4 pb-4 pt-3">
                    <p className="text-t px-4 pb-4 pt-3 font-semibold text-medical-text/40 uppercase tracking-wider mb-2">
                      Segmentation Mask
                    </p>
                    <img
                      src={result.generated_report.segmentation_mask_url}
                      alt="Lesion segmentation mask"
                      className="w-full max-h-36 object-contain rounded-lg border border-medical-border bg-black"
                    />
                  </div>
                )}

                <div className="border-t border-medical-border/50 px-4 py-2">
                  <button
                    onClick={() => setShowMeta((s) => !s)}
                    className="text-[11px] font-medium text-medical-text/40 hover:text-medical-text/70 flex items-center gap-1 transition-colors"
                  >
                    {showMeta ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    <Cpu className="w-3 h-3 ml-0.5" />
                    {sanitizeUnicodeString(`${MODEL_NAME} · v${result.pipeline_version} · ${result.processing_ms}ms · ${formatDate(result.created_at)}`)}
                  </button>
                  {showMeta && (
                    <pre className="mt-2 p-2 rounded-lg bg-medical-bg text-[10px] text-medical-text/60 overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(result.generated_report, null, 2)}
                    </pre>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Right: Risk Classification */}
        <div className="space-y-4">
          {result && predCfg ? (
            <>
              <div className={`rounded-2xl border p-5 ${predCfg.banner}`}>
                <div className="flex items-center gap-2 mb-1">
                  {predCfg.icon}
                  <p className="text-xs font-semibold uppercase tracking-wider opacity-70">Risk Classification</p>
                </div>
                <p className="text-2xl font-bold mb-1">{predCfg.label}</p>
                <p className="text-xs opacity-70">
                  {result.prediction === 'Malignant'
                    ? 'High probability of malignancy. Strongly suspicious findings detected.'
                    : 'Low probability of malignancy. No suspicious findings detected.'}
                </p>
              </div>

              <div className="bg-medical-surface border border-medical-border rounded-2xl p-5 flex flex-col items-center gap-2">
                <p className="text-xs font-semibold text-medical-text/50 uppercase tracking-wider self-start">
                  Confidence Score
                </p>
                <CircularGauge
                  percent={confidencePct}
                  size={140}
                  strokeWidth={11}
                  colorClass={predCfg.gauge}
                  label="Probability"
                />
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${predCfg.chip}`}>
                  {confidencePct >= 80
                    ? 'High Confidence'
                    : confidencePct >= 50
                    ? 'Moderate Confidence'
                    : 'Low Confidence'}
                </span>
                {result.generated_report?.probabilities && (
                  <div className="w-full space-y-1.5 mt-1">
                    {Object.entries(result.generated_report.probabilities).map(([lbl, p]) => {
                      const pct      = Math.round((p as number) * 100);
                      const isActive = lbl === result.prediction;
                      return (
                        <div key={lbl}>
                          <div className="flex justify-between text-[11px] mb-0.5">
                            <span className="text-medical-text/60">{lbl}</span>
                            <span className={isActive ? 'font-bold text-medical-text' : 'text-medical-text/60'}>{pct}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-medical-border overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${lbl === 'Malignant' ? 'bg-medical-malignant' : 'bg-medical-success'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="bg-medical-surface border border-medical-border rounded-2xl p-5">
                <p className="text-xs font-semibold text-medical-text/50 uppercase tracking-wider mb-3">
                  Clinical Insights
                </p>
                <ul className="space-y-1.5">
                  {(CLINICAL_INSIGHTS[result.prediction] ?? []).map((insight, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-medical-text/70">
                      <CheckCircle2 className="w-3.5 h-3.5 text-medical-success shrink-0" />
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <div className="bg-medical-surface border border-medical-border rounded-2xl p-6 text-center text-medical-text/30">
              {loading ? <Spinner /> : (
                <>
                  <Clock className="w-8 h-8 mx-auto mb-2" strokeWidth={1.5} />
                  <p className="text-sm">Results will appear here after analysis.</p>
                </>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}