import { useRef, useState } from 'react';
import { X, Download, Printer, Award, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Certificate } from '@/lib/api/services/user';

interface Props {
  certificate: Certificate;
  onClose: () => void;
}

const LEVEL_LABEL: Record<string, string> = {
  A1: 'A1 – Beginner',
  A2: 'A2 – Elementary',
  B1: 'B1 – Intermediate',
  B2: 'B2 – Upper-Intermediate',
  C1: 'C1 – Advanced',
  C2: 'C2 – Proficiency',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function CertificateModal({ certificate, onClose }: Props) {
  const certRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    if (!certRef.current || downloading) return;
    setDownloading(true);
    try {
      // Dynamic import so the heavy libs are only loaded when needed
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      // Capture the certificate at 2× resolution for crisp output
      const canvas = await html2canvas(certRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const imgW = canvas.width;
      const imgH = canvas.height;

      // Fit the image to A4 landscape (297 × 210 mm) while preserving aspect ratio
      const pdfW = 297;
      const pdfH = 210;
      const ratio = Math.min(pdfW / imgW, pdfH / imgH);
      const w = imgW * ratio;
      const h = imgH * ratio;
      const x = (pdfW - w) / 2;
      const y = (pdfH - h) / 2;

      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      pdf.addImage(imgData, 'PNG', x, y, w, h);
      pdf.save(`certificate-${slugify(certificate.courseName)}.pdf`);
    } catch (err) {
      console.error('[Certificate] PDF generation failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    const content = certRef.current?.outerHTML ?? '';
    const win = window.open('', '_blank', 'width=960,height=700');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/>
      <title>Chứng chỉ – ${certificate.courseName}</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { background:#fff; display:flex; align-items:center; justify-content:center; min-height:100vh; padding:24px; }
        @media print { body { padding:0; } }
      </style></head>
      <body>${content}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[95vh] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <span className="font-semibold text-slate-800">Chứng chỉ hoàn thành</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handlePrint}
              className="gap-1.5"
            >
              <Printer className="w-4 h-4" />
              In
            </Button>
            <Button
              size="sm"
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-white border-0"
            >
              {downloading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Download className="w-4 h-4" />}
              {downloading ? 'Đang tạo PDF…' : 'Tải PDF'}
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Certificate */}
        <div className="overflow-y-auto flex-1 p-6">
          <div ref={certRef} style={{
            background: 'linear-gradient(135deg, #fefce8 0%, #fff7ed 50%, #fef9c3 100%)',
            border: '2px solid #d97706',
            borderRadius: '12px',
            padding: '48px 56px',
            position: 'relative',
            overflow: 'hidden',
            maxWidth: '800px',
            margin: '0 auto',
          }}>
            {/* Corner ornaments */}
            {([
              { top: 12, left: 12, borderTop: '3px solid #d97706', borderLeft: '3px solid #d97706', borderRadius: '6px 0 0 0' },
              { top: 12, right: 12, borderTop: '3px solid #d97706', borderRight: '3px solid #d97706', borderRadius: '0 6px 0 0' },
              { bottom: 12, left: 12, borderBottom: '3px solid #d97706', borderLeft: '3px solid #d97706', borderRadius: '0 0 0 6px' },
              { bottom: 12, right: 12, borderBottom: '3px solid #d97706', borderRight: '3px solid #d97706', borderRadius: '0 0 6px 0' },
            ] as React.CSSProperties[]).map((s, i) => (
              <div key={i} style={{ position: 'absolute', width: 48, height: 48, ...s }} />
            ))}

            {/* Platform name */}
            <p style={{ textAlign: 'center', fontFamily: 'system-ui,sans-serif', fontSize: '13px', fontWeight: 700, letterSpacing: '4px', textTransform: 'uppercase', color: '#92400e', marginBottom: '20px' }}>
              English Learning Platform
            </p>

            {/* Star badge */}
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <span style={{ display: 'inline-block', background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', borderRadius: '50%', padding: '14px', boxShadow: '0 4px 12px rgba(245,158,11,0.4)' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </span>
            </div>

            {/* Title */}
            <h1 style={{ textAlign: 'center', fontSize: '32px', fontWeight: 700, color: '#78350f', marginBottom: '6px', fontFamily: 'Georgia,serif', letterSpacing: '1px' }}>
              Certificate of Completion
            </h1>
            <p style={{ textAlign: 'center', fontFamily: 'system-ui,sans-serif', fontSize: '12px', color: '#a16207', marginBottom: '32px', letterSpacing: '2px', textTransform: 'uppercase' }}>
              Chứng nhận hoàn thành khóa học
            </p>

            {/* Divider */}
            <Divider />

            {/* Recipient */}
            <p style={{ textAlign: 'center', fontFamily: 'system-ui,sans-serif', fontSize: '14px', color: '#78350f', marginBottom: '8px' }}>
              Chứng nhận rằng
            </p>
            <h2 style={{ textAlign: 'center', fontSize: '36px', fontWeight: 700, color: '#1c1917', marginBottom: '8px', fontFamily: 'Georgia,serif', fontStyle: 'italic' }}>
              {certificate.userName}
            </h2>
            <p style={{ textAlign: 'center', fontFamily: 'system-ui,sans-serif', fontSize: '14px', color: '#78350f', marginBottom: '28px' }}>
              đã hoàn thành xuất sắc khóa học
            </p>

            {/* Course name */}
            <div style={{ textAlign: 'center', background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.25)', borderRadius: '8px', padding: '16px 24px', marginBottom: '28px' }}>
              <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#92400e', lineHeight: 1.3, fontFamily: 'Georgia,serif' }}>
                {certificate.courseName}
              </h3>
              {certificate.courseLevel && (
                <p style={{ fontFamily: 'system-ui,sans-serif', fontSize: '13px', color: '#b45309', marginTop: '6px', fontWeight: 500 }}>
                  {LEVEL_LABEL[certificate.courseLevel] ?? certificate.courseLevel}
                </p>
              )}
            </div>

            {/* Divider */}
            <Divider />

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontFamily: 'system-ui,sans-serif', marginTop: '4px' }}>
              <div>
                <p style={{ fontSize: '11px', color: '#a16207', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Ngày cấp</p>
                <p style={{ fontSize: '15px', fontWeight: 600, color: '#78350f' }}>{formatDate(certificate.issuedAt)}</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '140px', borderBottom: '2px solid #d97706', marginBottom: '4px', marginLeft: 'auto', marginRight: 'auto' }} />
                <p style={{ fontSize: '12px', color: '#a16207' }}>Ban Giám đốc</p>
                <p style={{ fontSize: '11px', color: '#b45309', fontWeight: 600 }}>English Learning Platform</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '11px', color: '#a16207', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Mã chứng chỉ</p>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#78350f', fontFamily: 'monospace' }}>{certificate.certificateNumber}</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
      <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, #d97706)' }} />
      <span style={{ color: '#d97706', fontSize: '18px' }}>✦</span>
      <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to left, transparent, #d97706)' }} />
    </div>
  );
}
