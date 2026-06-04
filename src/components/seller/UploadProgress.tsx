import { useTranslation } from 'react-i18next';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, RotateCcw, Film, Check } from 'lucide-react';

interface Props {
  percent: number;
  fileName: string;
  fileSizeMB: number;
  status: 'uploading' | 'done' | 'error';
  onRetry?: () => void;
}

export function UploadProgress({ percent, fileName, fileSizeMB, status, onRetry }: Props) {
  const { t } = useTranslation('seller');
  const iconBg =
    status === 'done' ? 'bg-emerald-100' : status === 'error' ? 'bg-red-100' : 'bg-blue-100';
  const iconColor =
    status === 'done' ? 'text-emerald-600' : status === 'error' ? 'text-red-600' : 'text-blue-600';

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          <Film className={`w-4 h-4 ${iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">{fileName}</p>
          <p className="text-xs text-slate-500">{fileSizeMB.toFixed(2)} MB</p>
        </div>
        {status === 'done' && <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />}
        {status === 'error' && <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
      </div>

      {status === 'done' ? (
        <p className="text-xs text-emerald-600 font-medium inline-flex items-center gap-1"><Check size={14} /> {t('upload.success')}</p>
      ) : (
        <div className="space-y-1.5">
          <Progress value={percent} className="h-2" />
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              {status === 'error' ? t('upload.failed') : t('upload.uploading', { percent })}
            </span>
            {status === 'error' && onRetry && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-xs text-blue-600 hover:bg-blue-50 px-2"
                onClick={onRetry}
              >
                <RotateCcw className="w-3 h-3 mr-1" /> {t('upload.retry')}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
