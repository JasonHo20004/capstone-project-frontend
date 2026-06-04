import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '@/context/SubscriptionContext';
import { Button } from '@/components/ui/button';
import { Crown, Sparkles, ArrowRight } from 'lucide-react';
import type { PremiumFeature } from '@/domain';

interface PremiumGateProps {
  feature: PremiumFeature;
  children: React.ReactNode;
  /** Optional custom message */
  message?: string;
}

const featureLabels: Record<PremiumFeature, string> = {
  ai_speaking: 'AI Speaking Assessment',
  ai_writing: 'AI Writing Assessment',
  dictation: 'Dictation Practice',
  learning_path: 'Learning Path',
  skill_tree: 'Skill Tree',
};

export function PremiumGate({ feature, children, message }: PremiumGateProps) {
  const { t } = useTranslation('common');
  const { hasFeature, isLoading } = useSubscription();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">{t('premium.loading')}</p>
        </div>
      </div>
    );
  }

  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Crown icon with gradient background */}
        <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200/50">
          <Crown className="w-10 h-10 text-white" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">
            {t('premium.title')}
          </h2>
          <p className="text-muted-foreground">
            {message || t('premium.defaultMessage', { feature: featureLabels[feature] })}
          </p>
        </div>

        {/* Benefits preview */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-xl p-4 space-y-3 text-left border border-amber-200/50 dark:border-amber-800/30">
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span>{t('premium.benefits.speaking')}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span>{t('premium.benefits.dictation')}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span>{t('premium.benefits.learningPath')}</span>
          </div>
        </div>

        {/* CTA Button */}
        <Button
          size="lg"
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg shadow-amber-200/50 transition-all hover:shadow-xl hover:shadow-amber-300/50"
          onClick={() => navigate('/#pricing')}
        >
          {t('premium.upgrade')}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
