import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeft, ImageOff } from 'lucide-react';
import { caseService } from '../services/caseService';
import { useScans } from '../hooks/useScans';
import { STATUS_CONFIG, PRIORITY_CONFIG } from '../../../lib/badges';
import { MEDICAL_TOKENS } from '../../../lib/tokens';
import Spinner from '../../../components/Spinner';
import type { Case } from '../types/index';
import { formatDate } from '../../../utils/date';

export default function CaseDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const { scans, loading: scansLoading } = useScans(id ?? '');

  useEffect(() => {
    if (!id) return;
    caseService.getCaseById(id)
      .then(data => { setCaseData(data); })
      .catch(() => { setCaseData(null); })
      .finally(() => { setLoading(false); });
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="sm" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="text-center py-16 text-medical-text/40 text-sm">
        Case not found.
      </div>
    );
  }

  const { typography: { scales } } = MEDICAL_TOKENS;
  const statusCfg   = STATUS_CONFIG[caseData.status];
  const priorityCfg = PRIORITY_CONFIG[caseData.priority];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => navigate('/cases')}
        className="text-medical-text/40 hover:text-medical-text text-sm flex items-center gap-2 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={2} />
        Back to Cases
      </button>

      {/* Case header */}
      <div className="bg-medical-surface border border-medical-border rounded-xl p-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className={`${scales.heading} font-mono text-medical-primary`}>
              {caseData.case_code}
            </h2>
            {statusCfg && (
              <span className={`text-xs px-2 py-0.5 rounded-md font-medium inline-flex items-center gap-1 ${statusCfg.classes}`}>
                {statusCfg.label}
              </span>
            )}
          </div>
          <p className={`${scales.body} text-medical-text/60`}>
            Patient: <span className="text-medical-text font-semibold">{caseData.patient_alias ?? '—'}</span>
          </p>
        </div>
        {priorityCfg && (
          <div className="sm:text-right">
            <span className={`text-sm font-bold ${priorityCfg.color}`}>
              {priorityCfg.label} Priority
            </span>
          </div>
        )}
      </div>

      {/* Clinical notes */}
      {caseData.notes && (
        <div className="bg-medical-surface border border-medical-border rounded-xl p-6">
          <h3 className={scales.caption}>Clinical Notes</h3>
          <p className={`${scales.body} text-medical-text/80 mt-2 whitespace-pre-wrap leading-relaxed`}>
            {caseData.notes}
          </p>
        </div>
      )}

      {/* AI result summary */}
      {caseData.ai_prediction && (
        <div className="bg-medical-surface border border-medical-border rounded-xl p-6">
          <h3 className={scales.caption}>AI Analysis</h3>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-lg font-bold text-medical-text">{caseData.ai_prediction}</span>
            {caseData.ai_confidence !== undefined && (
              <span className="text-sm text-medical-text/50">
                {(caseData.ai_confidence * 100).toFixed(0)}% confidence
              </span>
            )}
          </div>
        </div>
      )}

      {/* Linked scans */}
      <div className="bg-medical-surface border border-medical-border rounded-xl p-6">
        <h3 className={`${scales.subheading} text-medical-text mb-4`}>
          Linked Scans
        </h3>
        {scansLoading ? (
          <div className="flex justify-center py-6"><Spinner size="sm" /></div>
        ) : scans.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center text-medical-text/40">
            <ImageOff className="w-8 h-8 mb-2 opacity-40" strokeWidth={1.5} />
            <p className={scales.body}>No scans linked to this case.</p>
            <p className="text-xs mt-1 text-medical-text/30">Upload scans from the Scan Upload page.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {scans.map(scan => (
              <div key={scan.id} className="border border-medical-border bg-medical-bg rounded-xl overflow-hidden">
                <div className="aspect-square bg-medical-surface flex items-center justify-center p-2">
                  <img
                    src={scan.original_scan_url}
                    alt={`${scan.scan_view_type} scan`}
                    className="object-contain max-h-full max-w-full rounded"
                  />
                </div>
                <div className="p-3 bg-medical-surface border-t border-medical-border">
                  <p className="text-xs font-bold text-medical-primary truncate">{scan.scan_view_type}</p>
                  <p className="text-[10px] text-medical-text/40 uppercase font-mono mt-0.5">
                    {scan.laterality === 'L' ? 'Left' : 'Right'} · {formatDate(scan.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
