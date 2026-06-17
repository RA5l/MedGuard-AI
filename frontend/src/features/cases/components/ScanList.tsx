import { useScans } from '../hooks/useScans';
import Spinner from '../../../components/Spinner';
import { FileImage, LayoutGrid, Eye, AlertCircle } from 'lucide-react';
import { formatDate } from '../../../utils/date';

interface ScanListProps {
  caseId: string;
}

export default function ScanList({ caseId }: ScanListProps) {
  const { scans, loading, error } = useScans(caseId);

  if (loading) {
    return (
      <div className="py-8 flex justify-center items-center gap-2">
        <Spinner size="sm" />
        <span className="text-xs text-medical-text/40">Loading scans...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-700 text-xs">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <p className="font-medium">Failed to load scans: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center border-b border-medical-border pb-2">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 text-medical-primary" />
          <h3 className="text-sm font-bold text-medical-text">Linked Scans</h3>
        </div>
        <span className="text-xs font-semibold bg-medical-bg border border-medical-border px-2 py-0.5 rounded-md text-medical-text/60">
          {scans.length} scan{scans.length !== 1 ? 's' : ''}
        </span>
      </div>

      {scans.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-medical-border rounded-xl bg-medical-bg/20">
          <p className="text-xs text-medical-text/40">No scans linked to this case yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {scans.map(scan => (
            <div
              key={scan.id}
              className="flex items-center justify-between p-3 bg-medical-surface border border-medical-border rounded-xl hover:border-medical-primary/40 transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-medical-bg border flex items-center justify-center text-medical-text/40 shrink-0 group-hover:bg-medical-primary/5 group-hover:text-medical-primary transition-colors">
                  <FileImage className="w-5 h-5" strokeWidth={1.8} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-medical-text truncate">
                    {scan.scan_view_type} · {scan.laterality === 'L' ? 'Left' : 'Right'}
                  </p>
                  <p className="text-[11px] text-medical-text/40 font-medium mt-0.5">
                    Captured {formatDate(scan.created_at)}
                  </p>
                </div>
              </div>

              {scan.original_scan_url && (
                <a
                  href={scan.original_scan_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-medical-text/40 hover:text-medical-primary hover:bg-medical-primary/5 rounded-lg transition-all shrink-0 flex items-center gap-1 text-xs font-semibold"
                  title="View scan"
                >
                  <Eye className="w-4 h-4" />
                  <span className="hidden sm:inline">View</span>
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
