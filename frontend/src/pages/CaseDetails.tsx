import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Stethoscope,
  ScanLine,
  ClipboardList,
  CheckCircle2,
  Sparkles,
  Plus,
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { STATUS_CONFIG, PRIORITY_CONFIG, PREDICTION_COLORS } from '../lib/badges';
import { useScans } from '../hooks/useScans';
import { ImageOff } from 'lucide-react';
import Spinner from '../components/Spinner';

export default function CaseDetails() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  // `v_case_dashboard` is a wide reporting view with many optional columns —
  // typed as `unknown` here and narrowed where used.
  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const { scans, loading: scansLoading } = useScans(id ?? '');

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .schema('dev')
        .from('v_case_dashboard')
        .select('*')
        .eq('case_id', id)
        .single();
      setCaseData(data);
      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) return (
  <div className="flex items-center justify-center h-64">
    <Spinner />
  </div>
);

  if (!caseData) return (
    <div className="text-center py-16 text-medical-text/40">Case not found</div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-5"
    >
      {/* Back */}
      <button
  onClick={() => navigate('/cases')}
  className="text-medical-text/40 hover:text-medical-text text-sm flex items-center gap-1.5 transition-colors"
>
  <ArrowLeft className="w-4 h-4" strokeWidth={2} /> Back to Cases
</button>

      {/* Header Card */}
      <div className="bg-medical-surface border border-medical-border rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-medical-text font-mono">
                {caseData.case_code}
              </h2>
              <span className={`text-xs px-2 py-1 rounded-md border font-medium inline-flex items-center gap-1 ${STATUS_CONFIG[caseData.status]?.classes ?? ''}`}>
  {(() => { const Icon = STATUS_CONFIG[caseData.status]?.icon; return Icon ? <Icon className="w-3 h-3" strokeWidth={2.5} /> : null; })()}
  {STATUS_CONFIG[caseData.status]?.label ?? caseData.status}
</span>
            </div>
            <p className="text-medical-text/50 text-sm">
              Patient: <span className="text-medical-text">{caseData.patient_alias ?? '—'}</span>
            </p>
          </div>
          <div className="text-right">
            <p className={`text-sm font-bold inline-flex items-center gap-1.5 justify-end ${PRIORITY_CONFIG[caseData.priority]?.color}`}>
  {(() => { const Icon = PRIORITY_CONFIG[caseData.priority]?.icon; return Icon ? <Icon className="w-3.5 h-3.5" strokeWidth={2.5} /> : null; })()}
  {PRIORITY_CONFIG[caseData.priority]?.label} Priority
</p>
            <p className="text-medical-text/30 text-xs mt-1">
              {new Date(caseData.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Info Grid */}
<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
  {[
    { label: 'Assigned Doctor', value: caseData.assigned_doctor_name ?? '—', icon: Stethoscope, chip: 'bg-medical-primary' },
    { label: 'Total Scans',     value: caseData.total_scans ?? 0,            icon: ScanLine,    chip: 'bg-medical-accent' },
    {
      label: 'Report',
      value: caseData.report_finalized ? 'Finalized' : 'Pending',
      icon: caseData.report_finalized ? CheckCircle2 : ClipboardList,
      chip: caseData.report_finalized ? 'bg-(--color-medical-reported)' : 'bg-(--color-medical-pending)',
    },
  ].map(infoItem => (
    <div key={infoItem.label} className="bg-medical-surface border border-medical-border rounded-xl p-4 flex items-center gap-3">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm ${infoItem.chip}`}>
        <infoItem.icon className="w-5 h-5" strokeWidth={2} />
      </div>
      <div>
        <p className="text-medical-text/40 text-xs mb-0.5">{infoItem.label}</p>
        <p className="font-semibold text-sm text-medical-text">{infoItem.value}</p>
      </div>
    </div>
  ))}
</div>

      {/* AI Result */}
      <div className="bg-medical-surface border border-medical-border rounded-xl p-6">
        <h3 className="text-medical-text font-bold text-sm mb-4">AI Analysis</h3>
        {caseData.ai_prediction ? (
    <div className="flex flex-wrap items-center gap-6 sm:gap-8">
    <div className="text-center">
      <p className={`text-3xl font-extrabold ${PREDICTION_COLORS[caseData.ai_prediction] ?? 'text-medical-text'}`}>
        {caseData.ai_prediction}
      </p>
      <p className="text-medical-text/40 text-xs mt-1">Prediction</p>
    </div>
    <div className="text-center">
      <p className="text-3xl font-extrabold text-medical-accent">
        {caseData.ai_confidence
          ? `${(caseData.ai_confidence * 100).toFixed(1)}%`
          : '—'}
      </p>
      <p className="text-medical-text/40 text-xs mt-1">Confidence</p>
    </div>
  </div>
) : (
  <div className="flex flex-col items-center py-8 text-center">
    <div className="w-12 h-12 rounded-xl bg-medical-bg flex items-center justify-center mb-2">
      <Sparkles className="w-6 h-6 text-medical-text/25" strokeWidth={1.5} />
    </div>
    <p className="text-medical-text/40 text-sm">No AI results yet</p>
    <p className="text-medical-text/25 text-xs mt-1">Upload a scan to run analysis</p>
  </div>
)}
      </div>

      {/* Notes */}
      {caseData.notes && (
        <div className="bg-medical-surface border border-medical-border rounded-xl p-5">
          <h3 className="text-medical-text/40 text-xs font-medium mb-2 uppercase tracking-wider">
            Clinical Notes
          </h3>
          <p className="text-medical-text/80 text-sm leading-relaxed">{caseData.notes}</p>
        </div>
      )}

      {/* Scans placeholder */}
{/* Scans */}
<div className="bg-medical-surface border border-medical-border rounded-xl p-6">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-medical-text font-bold text-sm">
      Scans {scans.length > 0 && <span className="text-medical-text/40 font-normal">({scans.length})</span>}
    </h3>
    <Link
      to="/scans"
      className="text-xs text-medical-primary font-semibold hover:opacity-80 transition-opacity flex items-center gap-1"
    >
      <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> Upload Scan
    </Link>
  </div>

  {scansLoading ? (
    <div className="flex justify-center py-8">
      <Spinner size="sm" />
    </div>
  ) : scans.length === 0 ? (
    <div className="flex flex-col items-center py-8 text-center">
      <div className="w-12 h-12 rounded-xl bg-medical-bg flex items-center justify-center mb-2">
        <ScanLine className="w-6 h-6 text-medical-text/25" strokeWidth={1.5} />
      </div>
      <p className="text-medical-text/40 text-sm">No scans uploaded yet</p>
    </div>
  ) : (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {scans.map((scan, i) => (
        <motion.div
          key={scan.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          className="bg-medical-bg border border-medical-border rounded-lg overflow-hidden group"
        >
          <div className="aspect-square relative overflow-hidden bg-black flex items-center justify-center">
            {scan.original_scan_url ? (
              <img
                src={scan.original_scan_url}
                alt={`Scan ${scan.scan_view_type}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <ImageOff className="w-6 h-6 text-medical-text/20" strokeWidth={1.5} />
            )}
          </div>
          <div className="p-2">
            <p className="text-medical-accent text-xs font-bold">{scan.scan_view_type}</p>
            <p className="text-medical-text/30 text-xs">
              {scan.laterality ?? '—'} ·{' '}
              {scan.file_size_bytes
                ? `${(scan.file_size_bytes / 1024).toFixed(0)} KB`
                : '—'}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  )}
</div>
    </motion.div>
  );
}