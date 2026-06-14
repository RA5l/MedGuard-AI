import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScanLine, MousePointerClick, UploadCloud, ImageOff } from 'lucide-react';
import { useCases } from '../hooks/useCases';
import { useScans } from '../hooks/useScans';
import Spinner from '../components/Spinner';
import Select from '../components/Select';


const VIEW_TYPES = [
  { value: 'RCC',  label: 'RCC',  desc: 'Right Cranio-Caudal'      },
  { value: 'LCC',  label: 'LCC',  desc: 'Left Cranio-Caudal'       },
  { value: 'RMLO', label: 'RMLO', desc: 'Right Mediolateral Oblique' },
  { value: 'LMLO', label: 'LMLO', desc: 'Left Mediolateral Oblique'  },
];

function ScanList({ caseId }: { caseId: string }) {
  const { scans, loading, uploading, uploadScan } = useScans(caseId);
  const [selectedView, setSelectedView] = useState('RCC');
  const [dragOver, setDragOver]         = useState(false);
  const [uploadError, setUploadError]   = useState('');

  const handleFile = async (file: File) => {
    setUploadError('');
    try {
      await uploadScan(file, selectedView);
    } catch (err: unknown) {
  setUploadError(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-5">

      {/* View type selector */}
      <div>
        <p className="text-medical-text/60 text-sm font-medium mb-3">Select View Type</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {VIEW_TYPES.map(v => (
            <button
              key={v.value}
              onClick={() => setSelectedView(v.value)}
              className={`p-3 rounded-lg border text-left transition-all ${
                selectedView === v.value
                  ? 'border-medical-accent bg-medical-accent/10 text-medical-accent'
                  : 'border-medical-border text-medical-text/50 hover:border-medical-accent/40'
              }`}
            >
              <p className="font-bold text-sm">{v.label}</p>
              <p className="text-xs opacity-60 mt-0.5">{v.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-all ${
          dragOver
            ? 'border-medical-accent bg-medical-accent/5'
            : 'border-medical-border hover:border-medical-accent/40'
        }`}
      >
        {uploading ? (
  <div className="flex flex-col items-center gap-3">
    <Spinner size="lg" />
    <p className="text-medical-text/60 text-sm">Uploading scan...</p>
  </div>
) : (
  <>
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 transition-colors ${
      dragOver ? 'bg-medical-accent/15 text-medical-accent' : 'bg-medical-bg text-medical-text/30'
    }`}>
      <UploadCloud className="w-7 h-7" strokeWidth={1.75} />
    </div>
    <p className="text-medical-text font-semibold text-sm mb-1">
      Drop scan here or click to browse
    </p>
    <p className="text-medical-text/30 text-xs">PNG, JPEG, DICOM — max 20MB</p>
    <input
      type="file"
      accept=".png,.jpg,.jpeg,.dcm"
      onChange={handleInputChange}
      className="absolute inset-0 opacity-0 cursor-pointer"
    />
  </>
)}
      </div>

      {/* Upload error */}
      {uploadError && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {uploadError}
        </div>
      )}

      {/* Uploaded scans */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner size="sm" />
        </div>
      ) : scans.length > 0 ? (
        <div>
          <p className="text-medical-text/60 text-sm font-medium mb-3">
            Uploaded Scans ({scans.length})
          </p>
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
      onError={e => {
        (e.target as HTMLImageElement).style.display = 'none';
      }}
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
        </div>
      ) : null}
    </div>
  );
}

export default function ScanUpload() {
  const { cases, loading } = useCases();
  const [selectedCase, setSelectedCase] = useState<string>('');

  return (
    <div className="space-y-5 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3">
  <div className="w-10 h-10 rounded-xl bg-medical-accent/10 text-medical-accent flex items-center justify-center shrink-0">
    <ScanLine className="w-5 h-5" strokeWidth={2} />
  </div>
  <div>
    <h2 className="text-xl font-bold text-medical-text">Scan Upload</h2>
    <p className="text-medical-text/40 text-sm mt-0.5">
      Upload mammogram scans for AI analysis
    </p>
  </div>
</div>

      {/* Case selector */}
      <div className="bg-medical-surface border border-medical-border rounded-xl p-5">
        <label className="block text-medical-text/70 text-sm font-medium mb-2">
          Select Case
        </label>
        {loading ? (
          <div className="h-10 bg-medical-border/30 rounded-lg animate-pulse" />
        ) : (
          <Select
  value={selectedCase}
  onChange={setSelectedCase}
  placeholder="— Choose a case —"
  options={cases.map(c => ({
    value: c.case_id,
    label: `${c.case_code}${c.patient_alias ? ` · ${c.patient_alias}` : ''}`,
  }))}
/>
        )}
      </div>

      {/* Upload area */}
      <AnimatePresence mode="wait">
        {selectedCase ? (
          <motion.div
            key={selectedCase}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-medical-surface border border-medical-border rounded-xl p-5"
          >
            <ScanList caseId={selectedCase} />
          </motion.div>
        ) : (
          <motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  className="flex flex-col items-center justify-center py-16 text-center bg-medical-surface border border-medical-border rounded-xl"
>
  <div className="w-12 h-12 rounded-xl bg-medical-bg flex items-center justify-center mb-3">
    <MousePointerClick className="w-6 h-6 text-medical-text/25" strokeWidth={1.5} />
  </div>
  <p className="text-medical-text/40 text-sm">Select a case to upload scans</p>
</motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}