import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ScanLine, UploadCloud, AlertCircle, CheckCircle2, FileImage } from 'lucide-react';
import { useCases } from '../../cases/hooks/useCases';
import { useAuth } from '../../auth/context/AuthContext';
import { scanService } from '../../cases/services/scanService';
import type { ScanViewType } from '../../cases/services/scanService';
import Select from './../../../components/Select';
import ScanList from '../../cases/components/ScanList';
import Spinner from '../../../components/Spinner';

const VIEW_TYPE_OPTIONS = [
  { value: 'RCC',  label: 'RCC — Right Craniocaudal'      },
  { value: 'LCC',  label: 'LCC — Left Craniocaudal'       },
  { value: 'RMLO', label: 'RMLO — Right Mediolateral Oblique' },
  { value: 'LMLO', label: 'LMLO — Left Mediolateral Oblique'  },
];

export default function ScanUploadPage() {
  const { cases, loading } = useCases();
  const { profile } = useAuth();
  const canUpload = profile?.role === 'admin' || profile?.role === 'doctor';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchParams] = useSearchParams();
  const [selectedCaseId, setSelectedCaseId] = useState(searchParams.get('case') ?? '');

  const [file, setFile] = useState<File | null>(null);
  const [viewType, setViewType] = useState<ScanViewType | ''>('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);


  useEffect(() => {
    const fromQuery = searchParams.get('case');
    if (fromQuery) setSelectedCaseId(fromQuery);
  }, [searchParams]);

  const caseOptions = cases.map(c => ({
    value: c.id,
    label: c.patient_alias
      ? `${c.case_code} · ${c.patient_alias}`
      : c.case_code,
  }));

  const canSubmit = selectedCaseId && file && viewType && !uploading;

  const handleUpload = async () => {
    if (!file || !viewType || !selectedCaseId) return;
    setUploading(true);
    setUploadError('');
    setUploadSuccess(false);
    try {
      await scanService.uploadScan({ caseId: selectedCaseId, file, scanViewType: viewType });
      setUploadSuccess(true);
      setFile(null);
      setViewType('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setRefreshKey(k => k + 1);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to upload scan.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-medical-primary/10 text-medical-primary flex items-center justify-center shrink-0">
          <ScanLine className="w-5 h-5" strokeWidth={2} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-medical-text tracking-tight">Scan Upload</h2>
          <p className="text-medical-text/40 text-sm">Select a case to view and manage its linked scans.</p>
        </div>
      </div>

      {/* Case selector */}
      <div className="bg-medical-surface border border-medical-border rounded-xl p-5">
        <label className="block text-medical-text/70 text-sm font-medium mb-2">
          Link to Case
        </label>
        {loading ? (
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

      {/* Upload form — doctor/admin only */}
      {selectedCaseId && canUpload && (
        <div className="bg-medical-surface border border-medical-border rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-medical-text">Upload New Mammography Image</h3>

          <div>
            <label className="block text-xs font-medium text-medical-text/60 mb-1.5">Image File</label>
            {/*
              Native <input type="file"> renders its button/placeholder text
              ("Choose File" / "No file chosen") using the BROWSER's own UI
              language (OS/browser locale), which CSS/JS cannot override —
              that's what showed Arabic text despite no Arabic in this file.
              Fix: hide the native input completely and drive it from a
              fully custom-styled trigger + filename display, both with
              text we control directly.
            */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.dcm"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-medical-border bg-medical-bg hover:border-medical-primary/40 transition-colors text-left"
            >
              <span className="shrink-0 px-3 py-1.5 rounded-md bg-medical-primary/10 text-medical-primary text-xs font-semibold">
                Choose File
              </span>
              <span className="text-sm text-medical-text/70 truncate flex items-center gap-1.5">
                {file ? (<><FileImage className="w-4 h-4 shrink-0" /> {file.name}</>) : 'No file selected'}
              </span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-medical-text/60 mb-1.5">Scan View</label>
            <Select
              value={viewType}
              onChange={v => setViewType(v as ScanViewType)}
              placeholder="Select view…"
              options={VIEW_TYPE_OPTIONS}
            />
          </div>

          {uploadError && (
            <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p className="font-medium">{uploadError}</p>
            </div>
          )}
          {uploadSuccess && (
            <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center gap-2 text-emerald-700 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <p className="font-medium">Scan uploaded and linked successfully.</p>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!canSubmit}
            className="bg-medical-primary text-white text-sm font-bold px-4 py-2.5 rounded-lg hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? <Spinner size="sm" /> : <UploadCloud className="w-4 h-4" strokeWidth={2.5} />}
            Upload Scan
          </button>
        </div>
      )}

      {/* Linked scans for the selected case */}
      {selectedCaseId && (
        <div className="bg-medical-surface border border-medical-border rounded-xl p-5">
          <ScanList key={refreshKey} caseId={selectedCaseId} />
        </div>
      )}
    </div>
  );
}
