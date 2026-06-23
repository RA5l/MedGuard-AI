import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import {
  Activity, Clock, AlertCircle, Sparkles,
  AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Cpu,
} from 'lucide-react';
import { useCases } from '../../cases/hooks/useCases';
import { useScans } from '../../cases/hooks/useScans';
import { useAuth } from '../../auth/context/AuthContext';
import { aiService } from '../services/aiService';
import type { AIResult } from '../services/aiService';
import Select from '../../../components/Select';
import Spinner from '../../../components/Spinner';
import CircularGauge from '../../../components/CircularGauge';
import { formatDate } from '../../../utils/date';

const PREDICTION_CONFIG: Record<string, { label: string; banner: string; gauge: string; chip: string; icon: ReactNode }> = {
  Malignant: {
    label: 'Malignant',
    banner: 'bg-rose-950/60 border-rose-700/60 text-rose-300',
    gauge: 'stroke-medical-malignant',
    chip: 'bg-rose-900/60 text-rose-300 border-rose-700/50',
    icon: <AlertTriangle className="w-5 h-5" strokeWidth={2} />,
  },
  Benign: {
    label: 'Benign',
    banner: 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300',
    gauge: 'stroke-medical-success',
    chip: 'bg-emerald-900/60 text-emerald-300 border-emerald-700/50',
    icon: <CheckCircle2 className="w-5 h-5" strokeWidth={2} />,
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

export default function AIResultsPage() {
  const { cases, loading: casesLoading } = useCases();
  const { profile } = useAuth();
  const canAnalyze = profile?.role === 'admin' || profile?.role === 'doctor';

  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [selectedScanId, setSelectedScanId] = useState('');
  const { scans, loading: scansLoading } = useScans(selectedCaseId);

  const selectedScan = scans.find(s => s.id === selectedScanId);

  const [result, setResult] = useState<AIResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState('');
  const [showMeta, setShowMeta] = useState(false);

  const caseOptions = cases.map(c => ({
    value: c.id,
    label: c.patient_alias ? `${c.case_code} · ${c.patient_alias}` : c.case_code,
  }));

  const scanOptions = scans.map(s => ({
    value: s.id,
    label: `${s.scan_view_type} · ${s.laterality} · ${formatDate(s.created_at)}`,
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
    aiService.getResultByCaseId(selectedCaseId)
      .then(setResult)
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load AI result.'))
      .finally(() => setLoading(false));
  }, [selectedCaseId]);

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

  const predCfg = result ? PREDICTION_CONFIG[result.prediction] : null;
  const confidencePct = result ? Math.round(result.confidence * 100) : 0;
  const isFallback = result?.generated_report?.roi_source === 'center_crop_fallback';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Progress steps header */}
      <div className="flex items-center justify-between bg-medical-surface border border-medical-border rounded-xl px-6 py-3">
        <div className="flex items-center gap-8 text-xs font-medium">
          {[
            { n: 1, label: 'Select & Validate', done: !!selectedCaseId && !!selectedScanId },
            { n: 2, label: 'AI Analysis', done: !!result },
            { n: 3, label: 'Review & Report', done: !!(result && result.confidence > 0) },
          ].map((step, i, arr) => (
            <div key={step.n} className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold border-2 transition-colors ${
                step.done ? 'bg-medical-primary border-medical-primary text-white' : 'border-medical-border text-medical-text/50'
              }`}>{step.n}</span>
              <span className={step.done ? 'text-medical-primary' : 'text-medical-text/40'}>{step.label}</span>
              {i < arr.length - 1 && <span className="text-medical-text/20 ml-4">—</span>}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-medical-text/50">
          <Activity className="w-3.5 h-3.5" />
          AI Analysis Results
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[320px_1fr_300px]">

        {/* ── Left: Smart Input ── */}
        <div className="space-y-4">
          <div className="bg-medical-surface border border-medical-border rounded-2xl p-5">
            <p className="text-xs font-semibold text-medical-text/50 uppercase tracking-widest mb-3">Smart Input</p>

            {/* Case */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-medical-text/60 mb-1.5">Patient Case</label>
              {casesLoading ? (
                <div className="h-10 bg-medical-border/30 rounded-lg animate-pulse" />
              ) : (
                <Select value={selectedCaseId} onChange={setSelectedCaseId} placeholder="Select a case…" options={caseOptions} />
              )}
            </div>

            {/* Scan */}
            {selectedCaseId && (
              <div className="mb-4">
                <label className="block text-xs font-medium text-medical-text/60 mb-1.5">Mammography Scan</label>
                {scansLoading ? (
                  <div className="h-10 bg-medical-border/30 rounded-lg animate-pulse" />
                ) : scans.length === 0 ? (
                  <p className="text-xs text-medical-text/40 px-3 py-2 border border-dashed border-medical-border rounded-lg">No scans uploaded yet.</p>
                ) : (
                  <Select value={selectedScanId} onChange={setSelectedScanId} placeholder="Select a scan…" options={scanOptions} />
                )}
              </div>
            )}

            {/* Scan preview */}
            {selectedScan?.original_scan_url && (
              <div className="relative rounded-xl overflow-hidden border border-medical-border bg-black aspect-square">
                <img
                  src={selectedScan.original_scan_url}
                  alt="Selected mammography scan"
                  className="w-full h-full object-contain"
                />
                <span className="absolute bottom-2 left-2 text-[10px] bg-black/70 text-white px-2 py-0.5 rounded-full">
                  {selectedScan.scan_view_type} · {selectedScan.laterality}
                </span>
              </div>
            )}

            {/* Analyze button */}
            {canAnalyze && selectedCaseId && scans.length > 0 && (
              <>
                {analyzeError && (
                  <div className="mt-3 p-2.5 bg-rose-950/50 border border-rose-700/50 rounded-lg flex items-center gap-2 text-rose-300 text-xs">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /><p>{analyzeError}</p>
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

          {/* Segmentation method badge */}
          {result && (
            <div className={`rounded-xl border p-3 text-xs ${
              isFallback ? 'bg-medical-warning-bg border-medical-warning/30 text-medical-warning' : 'bg-medical-accent-light/20 border-medical-accent/20 text-medical-accent'
            }`}>
              <p className="font-semibold mb-0.5">
                {isFallback ? '⚠ Fallback: Center Crop' : '✓ Segmentation-First ROI'}
              </p>
              <p className="opacity-80">
                {isFallback
                  ? 'No lesion found automatically. Results should be treated as preliminary.'
                  : 'Lesion automatically located by the segmenter. Crop validated by the AI team\'s recommended flow.'}
              </p>
            </div>
          )}
        </div>

        {/* ── Center: Dual-View Analysis ── */}
        <div className="bg-medical-surface border border-medical-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-medical-border">
            <div>
              <p className="text-xs font-semibold text-medical-text uppercase tracking-wider">Dual-View Analysis</p>
              <p className="text-[10px] text-medical-text/40 mt-0.5">Left: Original Scan · Right: AI Heatmap (Grad-CAM++)</p>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64"><Spinner /></div>
          ) : error ? (
            <div className="p-6 flex items-center gap-2 text-rose-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" /><p>{error}</p>
            </div>
          ) : !result ? (
            <div className="flex flex-col items-center justify-center h-64 text-medical-text/30">
              <Clock className="w-10 h-10 mb-3" strokeWidth={1.5} />
              <p className="text-sm">{canAnalyze ? 'Select a scan and run analysis' : 'Ask a doctor to run an analysis'}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-0 h-80 sm:h-96">
                {/* Original scan */}
                <div className="relative bg-black border-r border-medical-border/50">
                  {selectedScan?.original_scan_url ? (
                    <img src={selectedScan.original_scan_url} alt="Original mammogram" className="w-full h-full object-contain" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-medical-text/20 text-xs">No scan preview</div>
                  )}
                  <span className="absolute top-2 left-2 text-[10px] bg-black/70 text-white px-2 py-0.5 rounded-full">Original Mammogram</span>
                  {selectedScan && (
                    <span className="absolute bottom-2 left-2 text-[10px] bg-black/70 text-white px-1.5 py-0.5 rounded-sm font-mono">
                      {selectedScan.laterality?.[0]?.toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Heatmap */}
                <div className="relative bg-black">
                  {result.heatmap_url ? (
                    <img src={result.heatmap_url} alt="AI Grad-CAM++ heatmap" className="w-full h-full object-contain" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-medical-text/20 text-xs">Heatmap not available</div>
                  )}
                  <span className="absolute top-2 left-2 text-[10px] bg-black/70 text-white px-2 py-0.5 rounded-full">AI Heatmap Overlay</span>
                  {/* Colorbar */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
                    <span className="text-[9px] text-white/70">High</span>
                    <div className="w-2 h-20 rounded-full" style={{ background: 'linear-gradient(to bottom, #ff0000, #ffff00, #00ffff, #0000ff)' }} />
                    <span className="text-[9px] text-white/70">Low</span>
                  </div>
                  {selectedScan && (
                    <span className="absolute bottom-2 left-2 text-[10px] bg-black/70 text-white px-1.5 py-0.5 rounded-sm font-mono">
                      {selectedScan.laterality?.[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>

              {/* Segmentation mask */}
              {result.generated_report?.segmentation_mask_url && (
                <div className="border-t border-medical-border/50 p-4">
                  <p className="text-[10px] font-semibold text-medical-text/40 uppercase tracking-wider mb-2">Segmentation Mask</p>
                  <img
                    src={result.generated_report.segmentation_mask_url}
                    alt="Lesion segmentation mask"
                    className="w-full max-h-32 object-contain rounded-lg border border-medical-border bg-black"
                  />
                </div>
              )}

              {/* Metadata toggle */}
              <div className="border-t border-medical-border/50 px-4 py-2">
                <button onClick={() => setShowMeta(s => !s)} className="text-[11px] font-medium text-medical-text/40 hover:text-medical-text/70 flex items-center gap-1 transition-colors">
                  {showMeta ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  <Cpu className="w-3 h-3 ml-0.5" /> Pipeline {result.pipeline_version} · {result.processing_ms}ms · {formatDate(result.created_at)}
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

        {/* ── Right: Risk Classification ── */}
        <div className="space-y-4">

          {result && predCfg ? (
            <>
              {/* Risk banner */}
              <div className={`rounded-2xl border p-5 ${predCfg.banner}`}>
                <div className="flex items-center gap-2 mb-1">
                  {predCfg.icon}
                  <p className="text-xs font-semibold uppercase tracking-wider opacity-70">Risk Classification</p>
                </div>
                <p className="text-2xl font-bold mb-1">{predCfg.label}</p>
                <p className="text-xs opacity-70">
                  {result.prediction === 'Malignant' ? 'High probability of malignancy. Strongly suspicious findings detected.' : 'Low probability of malignancy. No suspicious findings detected.'}
                </p>
              </div>

              {/* Confidence gauge */}
              <div className="bg-medical-surface border border-medical-border rounded-2xl p-5 flex flex-col items-center gap-2">
                <p className="text-xs font-semibold text-medical-text/50 uppercase tracking-wider self-start">Confidence Score</p>
                <CircularGauge
                  percent={confidencePct}
                  size={140}
                  strokeWidth={11}
                  colorClass={predCfg.gauge}
                  label="Probability"
                />
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${predCfg.chip}`}>
                  {confidencePct >= 80 ? 'High Confidence' : confidencePct >= 50 ? 'Moderate Confidence' : 'Low Confidence'}
                </span>
                {result.generated_report?.probabilities && (
                  <div className="w-full space-y-1.5 mt-1">
                    {Object.entries(result.generated_report.probabilities).map(([label, p]) => {
                      const pct = Math.round((p as number) * 100);
                      const isActive = label === result.prediction;
                      return (
                        <div key={label}>
                          <div className="flex justify-between text-[11px] mb-0.5">
                            <span className="text-medical-text/60">{label}</span>
                            <span className={isActive ? 'font-bold text-medical-text' : 'text-medical-text/60'}>{pct}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-medical-border overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${label === 'Malignant' ? 'bg-medical-malignant' : 'bg-medical-success'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Clinical Insights */}
              <div className="bg-medical-surface border border-medical-border rounded-2xl p-5">
                <p className="text-xs font-semibold text-medical-text/50 uppercase tracking-wider mb-3">Clinical Insights</p>
                <ul className="space-y-1.5">
                  {(CLINICAL_INSIGHTS[result.prediction] || []).map((insight, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-medical-text/70">
                      <span className="text-medical-accent shrink-0">✓</span> {insight}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <div className="bg-medical-surface border border-medical-border rounded-2xl p-6 text-center text-medical-text/30">
              {loading
                ? <Spinner />
                : <>
                    <Clock className="w-8 h-8 mx-auto mb-2" strokeWidth={1.5} />
                    <p className="text-sm">Results will appear here after analysis.</p>
                  </>
              }
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
