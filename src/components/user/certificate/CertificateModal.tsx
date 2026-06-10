import { useRef, useState } from 'react';
import { X, Download, Printer, Award, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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

function formatDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale, {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function CertificateModal({ certificate, onClose }: Props) {
  const { t, i18n } = useTranslation('courses');
  const dateLocale = i18n.language?.startsWith('en') ? 'en-US' : 'vi-VN';
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
      <title>${t('studentLearning.certificate.printTitle')} – ${certificate.courseName}</title>
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
            <span className="font-semibold text-slate-800">{t('studentLearning.certificate.modalTitle')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handlePrint}
              className="gap-1.5"
            >
              <Printer className="w-4 h-4" />
              {t('studentLearning.certificate.print')}
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
              {downloading
                ? t('studentLearning.certificate.generatingPdf')
                : t('studentLearning.certificate.downloadPdf')}
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
            {/* Inner border frame */}
            <div style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              right: '8px',
              bottom: '8px',
              border: '1px solid rgba(217, 119, 6, 0.35)',
              borderRadius: '8px',
              pointerEvents: 'none',
            }} />

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
            <p style={{ textAlign: 'center', fontFamily: 'system-ui,sans-serif', fontSize: '13px', fontWeight: 700, letterSpacing: '4px', textTransform: 'uppercase', color: '#92400e', marginBottom: '16px' }}>
              {t('studentLearning.certificate.platform')}
            </p>

            {/* Premium Golden Seal with Ribbon */}
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <div style={{ position: 'relative', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="80" height="80" viewBox="0 0 100 100" style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible' }}>
                  {/* Left ribbon tail */}
                  <path d="M35,60 L25,95 L45,85 Z" fill="#b45309" />
                  <path d="M35,60 L25,95 L45,85 Z" fill="url(#ribbonGrad)" />
                  {/* Right ribbon tail */}
                  <path d="M65,60 L75,95 L55,85 Z" fill="#b45309" />
                  <path d="M65,60 L75,95 L55,85 Z" fill="url(#ribbonGrad)" />
                  
                  <defs>
                    <linearGradient id="ribbonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#d97706" />
                      <stop offset="50%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#92400e" />
                    </linearGradient>
                  </defs>
                </svg>
                {/* Circular Golden Stamp */}
                <div style={{
                  position: 'absolute',
                  top: '5px',
                  left: '5px',
                  width: '70px',
                  height: '70px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #fef08a 0%, #f59e0b 50%, #b45309 100%)',
                  boxShadow: '0 6px 16px rgba(217,119,6,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px double #fef08a',
                  zIndex: 2,
                }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="#78350f">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Title */}
            <h1 style={{ textAlign: 'center', fontSize: '32px', fontWeight: 700, color: '#78350f', marginBottom: '6px', fontFamily: 'Georgia,serif', letterSpacing: '1px' }}>
              {t('studentLearning.certificate.title')}
            </h1>
            <p style={{ textAlign: 'center', fontFamily: 'system-ui,sans-serif', fontSize: '12px', color: '#a16207', marginBottom: '32px', letterSpacing: '2px', textTransform: 'uppercase' }}>
              {t('studentLearning.certificate.subtitle')}
            </p>

            {/* Divider */}
            <Divider />

            {/* Recipient */}
            <p style={{ textAlign: 'center', fontFamily: 'system-ui,sans-serif', fontSize: '14px', color: '#78350f', marginBottom: '8px' }}>
              {t('studentLearning.certificate.certifyThat')}
            </p>
            <h2 style={{ textAlign: 'center', fontSize: '36px', fontWeight: 700, color: '#1c1917', marginBottom: '8px', fontFamily: 'Georgia,serif', fontStyle: 'italic' }}>
              {certificate.userName}
            </h2>
            <p style={{ textAlign: 'center', fontFamily: 'system-ui,sans-serif', fontSize: '14px', color: '#78350f', marginBottom: '28px' }}>
              {t('studentLearning.certificate.completedExcellently')}
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
                <p style={{ fontSize: '11px', color: '#a16207', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>{t('studentLearning.certificate.issuedDate')}</p>
                <p style={{ fontSize: '15px', fontWeight: 600, color: '#78350f' }}>{formatDate(certificate.issuedAt, dateLocale)}</p>
              </div>
              <div style={{ textAlign: 'center', minWidth: '160px' }}>
                {/* Ink Signature */}
                <div style={{ height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '-10px' }}>
                  <svg width="110" height="48" viewBox="0 0 100 45" style={{ opacity: 0.9 }}>
                    <path
                      d="M 10 32 Q 25 3 40 28 T 60 12 T 80 32 T 95 18 M 20 22 L 85 24"
                      fill="none"
                      stroke="#1e3a8a"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div style={{ width: '140px', borderBottom: '2px solid #d97706', marginBottom: '4px', marginLeft: 'auto', marginRight: 'auto' }} />
                <p style={{ fontSize: '12px', color: '#a16207' }}>{t('studentLearning.certificate.signatory')}</p>
                <p style={{ fontSize: '11px', color: '#b45309', fontWeight: 600 }}>{t('studentLearning.certificate.platform')}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '11px', color: '#a16207', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>{t('studentLearning.certificate.certificateNumber')}</p>
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
