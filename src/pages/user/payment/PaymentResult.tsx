import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, ArrowLeft, Wallet } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatVND } from '@/lib/utils';

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation('account');

  const status = searchParams.get('status'); // 'success' | 'failed'
  const txnRef = searchParams.get('txnRef') ?? '';
  const amountParam = searchParams.get('amount');
  const amount = amountParam ? Number(amountParam) : null;

  const isSuccess = status === 'success';
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (isSuccess) {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['wallet', 'summary'] });
      queryClient.invalidateQueries({ queryKey: ['wallet', 'transactions'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
    }
  }, [isSuccess, queryClient]);

  // Auto-redirect back to wallet after countdown — works for both cancel and failure.
  useEffect(() => {
    if (countdown <= 0) {
      navigate('/wallet', { replace: true });
      return;
    }
    const timer = window.setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown, navigate]);

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,hsl(210_40%_98%)_0%,hsl(201_100%_97%)_100%)] flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Card
          className={`rounded-[32px] border p-8 shadow-[0_28px_80px_-36px_rgba(15,23,42,0.3)] ${
            isSuccess
              ? 'border-emerald-200 bg-[linear-gradient(145deg,rgba(240,253,244,0.98),rgba(255,255,255,0.98))]'
              : 'border-rose-200 bg-[linear-gradient(145deg,rgba(255,241,242,0.98),rgba(255,255,255,0.98))]'
          }`}
        >
          <div className="flex flex-col items-center text-center space-y-5">
            <div className={`rounded-full p-4 ${isSuccess ? 'bg-emerald-100' : 'bg-rose-100'}`}>
              {isSuccess ? (
                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
              ) : (
                <XCircle className="h-10 w-10 text-rose-600" />
              )}
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
                {isSuccess ? t('paymentResult.successTitle') : t('paymentResult.failedTitle')}
              </h1>
              <p className={`text-sm leading-6 ${isSuccess ? 'text-emerald-800' : 'text-rose-800'}`}>
                {isSuccess
                  ? t('paymentResult.successDesc')
                  : t('paymentResult.failedDesc')}
              </p>
              <p className="text-xs text-slate-500">
                {t('paymentResult.redirect', { count: countdown })}
              </p>
            </div>

            <div className="w-full rounded-[20px] border border-slate-200 bg-white/80 p-5 space-y-3 text-sm text-slate-600">
              {amount !== null && amount > 0 && (
                <div className="flex items-center justify-between">
                  <span>{t('paymentResult.amount')}</span>
                  <span className="font-semibold text-slate-950">{formatVND(amount)}</span>
                </div>
              )}
              {txnRef && (
                <div className="flex items-center justify-between">
                  <span>{t('paymentResult.reference')}</span>
                  <span className="font-medium text-slate-950 truncate max-w-[200px]">{txnRef}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span>{t('paymentResult.gateway')}</span>
                <span className="font-medium text-slate-950">Stripe</span>
              </div>
              <div className="flex items-center justify-between">
                <span>{t('paymentResult.status')}</span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                    isSuccess ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {isSuccess ? t('paymentResult.statusSuccess') : t('paymentResult.statusFailed')}
                </span>
              </div>
            </div>
          </div>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            onClick={() => navigate('/wallet')}
            className="flex-1 h-12 rounded-full bg-slate-950 px-6 text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-800"
          >
            <Wallet className="mr-2 h-4 w-4" />
            {t('paymentResult.goToWallet')}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/dashboard')}
            className="flex-1 h-12 rounded-full border-slate-200 px-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('paymentResult.dashboard')}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function PaymentResultLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );
}
