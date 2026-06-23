import jsPDF from 'jspdf';

export interface ReportPdfData {
  caseCode: string;
  patientAlias?: string;
  biRads: string;
  finalRecommendation: string;
  findings?: string;
  impression?: string;
  recommendation?: string;
  breastDensity?: string;
  views?: string;
  doctorNotes?: string;
  isFinalized: boolean;
  doctorName: string;
  createdAt: string;
  finalizedAt?: string;
}

const MARGIN = 18;
const PAGE_WIDTH = 210;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const DENSITY_LABELS: Record<string, string> = {
  A: 'A – Almost entirely fatty',
  B: 'B – Scattered fibroglandular densities',
  C: 'C – Heterogeneously dense',
  D: 'D – Extremely dense',
};

export function exportReportToPdf(data: ReportPdfData): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = MARGIN;

  // ── Header band ──
  doc.setFillColor(10, 79, 138);
  doc.rect(0, 0, PAGE_WIDTH, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('MedGuard AI — Mammography Screening Report', MARGIN, 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Breast Cancer Screening Platform · Clinical Report', MARGIN, 21);

  y = 38;
  doc.setTextColor(15, 23, 42);

  // ── Patient / case header block ──
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 28, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`Case: ${data.caseCode}`, MARGIN + 5, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(`Patient: ${data.patientAlias ?? '—'}`, MARGIN + 5, y + 15);

  if (data.views) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Views: ${data.views}`, MARGIN + 5, y + 21);
    doc.setTextColor(15, 23, 42);
  }

  doc.setFont('helvetica', 'bold');
  const statusLabel = data.isFinalized ? 'FINALIZED' : 'DRAFT';
  if (data.isFinalized) doc.setTextColor(22, 163, 74);
  else doc.setTextColor(217, 119, 6);
  doc.text(statusLabel, PAGE_WIDTH - MARGIN - 5, y + 8, { align: 'right' });

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`BI-RADS ${data.biRads}`, PAGE_WIDTH - MARGIN - 5, y + 15, { align: 'right' });

  if (data.breastDensity) {
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(
      `Density: ${DENSITY_LABELS[data.breastDensity] ?? data.breastDensity}`,
      PAGE_WIDTH - MARGIN - 5, y + 21,
      { align: 'right' }
    );
    doc.setTextColor(15, 23, 42);
  }

  y += 38;

  // ── Helpers ──
  const sectionTitle = (title: string) => {
    ensureSpace(16);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(8, 61, 107);
    doc.text(title, MARGIN, y);
    doc.setDrawColor(8, 61, 107);
    doc.setLineWidth(0.4);
    doc.line(MARGIN, y + 1.5, MARGIN + 18, y + 1.5);
    y += 8;
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
  };

  const wrappedText = (text: string, lineHeight = 5) => {
    const lines = doc.splitTextToSize(text || '—', CONTENT_WIDTH);
    doc.text(lines, MARGIN, y);
    y += lines.length * lineHeight + 4;
  };

  const ensureSpace = (needed: number) => {
    if (y + needed > 280) { doc.addPage(); y = MARGIN; }
  };

  // ── 1. AI Generated Summary ──
  ensureSpace(40);
  sectionTitle('AI Generated Summary');
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('AI-assisted draft, reviewed and finalized by the attending physician.', MARGIN, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  ensureSpace(20);
  wrappedText(data.finalRecommendation);

  // ── 2. Findings ──
  if (data.findings) {
    ensureSpace(20);
    sectionTitle('Findings');
    wrappedText(data.findings);
  }

  // ── 3. Breast Density ──
  if (data.breastDensity) {
    ensureSpace(16);
    sectionTitle('Breast Density');
    wrappedText(DENSITY_LABELS[data.breastDensity] ?? data.breastDensity);
  }

  // ── 4. Impression ──
  if (data.impression) {
    ensureSpace(20);
    sectionTitle('Impression');
    wrappedText(data.impression);
  }

  // ── 5. BI-RADS ──
  ensureSpace(16);
  sectionTitle('BI-RADS Category');
  wrappedText(`BI-RADS ${data.biRads}`);

  // ── 6. Recommendation ──
  if (data.recommendation) {
    ensureSpace(20);
    sectionTitle('Recommendation');
    wrappedText(data.recommendation);
  }

  // ── 7. Doctor Notes ──
  if (data.doctorNotes) {
    ensureSpace(20);
    sectionTitle('Doctor Notes');
    wrappedText(data.doctorNotes);
  }

  // ── Footer ──
  ensureSpace(24);
  doc.setDrawColor(226, 232, 240);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  y += 6;
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Reporting Physician: ${data.doctorName}`, MARGIN, y);
  y += 5;
  doc.text(`Report Created: ${new Date(data.createdAt).toLocaleString()}`, MARGIN, y);
  if (data.finalizedAt) {
    y += 5;
    doc.text(`Finalized: ${new Date(data.finalizedAt).toLocaleString()}`, MARGIN, y);
  }
  y += 5;
  doc.text(`Exported: ${new Date().toLocaleString()}`, MARGIN, y);

  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'This document was generated by MedGuard AI. AI-assisted content is reviewed and approved by a licensed physician prior to finalization.',
    MARGIN, 290, { maxWidth: CONTENT_WIDTH }
  );

  doc.save(`MedGuard-Report-${data.caseCode}.pdf`);
}
