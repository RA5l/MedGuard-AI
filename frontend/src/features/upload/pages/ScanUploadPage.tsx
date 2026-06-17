import { useState } from 'react';
import { ScanLine } from 'lucide-react';
import { useCases } from '../../cases/hooks/useCases';
import Select from './../../../components/Select';
import ScanList from '../../cases/components/ScanList';

export default function ScanUploadPage() {
  const { cases, loading } = useCases();
  const [selectedCaseId, setSelectedCaseId] = useState('');

  const caseOptions = cases.map(c => ({
    value: c.id,
    label: c.patient_alias
      ? `${c.case_code} · ${c.patient_alias}`
      : c.case_code,
  }));

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

      {/* Linked scans for the selected case */}
      {selectedCaseId && (
        <div className="bg-medical-surface border border-medical-border rounded-xl p-5">
          <ScanList caseId={selectedCaseId} />
        </div>
      )}
    </div>
  );
}
