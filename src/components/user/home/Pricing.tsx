import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, Crown, Zap, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUserPlans, useMySubscription } from '@/hooks/api/use-user-subscription';
import { useUser } from '@/hooks/api/use-user';

const formatVND = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

export default function Pricing() {
  const reduce = useReducedMotion();
  const { t } = useTranslation('landing');
  const { user } = useUser();
  const { data: plans = [], isLoading } = useUserPlans();
  const { data: subscription } = useMySubscription();

  const featureLabel = (key: string): string => {
    const translated = t(`pricing.features.${key}`, { defaultValue: '' });
    return translated || key;
  };

  const freePlan = plans.find((p) => p.type === 'FREE');
  const proPlan = plans.find((p) => p.type === 'PRO');
  const currentPlanType = subscription?.plan?.type ?? null;
  const isLoggedIn = !!user;
  const proCtaTo = '/#pricing';

  const reveal = (i = 0) => ({
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-80px' },
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] as const },
  });

  return (
    <section id="pricing" className="scroll-mt-24 bg-surface-low py-24">
      <div className="container mx-auto px-4">
        <motion.div {...reveal()} className="mx-auto mb-14 max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 px-4 py-1.5">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-semibold text-amber-700">{t('pricing.eyebrow')}</span>
          </div>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight md:text-5xl">
            {t('pricing.title')} <span className="text-secondary">{t('pricing.titleAccent')}</span> {t('pricing.titleTail')}
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            {t('pricing.subtitle')}
          </p>
        </motion.div>

        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && (freePlan || proPlan) && (
          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
            {freePlan && (
              <motion.div
                {...reveal(0)}
                className={`relative rounded-3xl border-2 bg-surface-lowest p-8 shadow-md ring-1 ring-border/10 transition-all duration-300 ease-soft hover:-translate-y-1 hover:shadow-card-hover ${
                  currentPlanType === 'FREE' ? 'border-primary' : 'border-border'
                }`}
              >
                {currentPlanType === 'FREE' && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="border-0 bg-primary px-3 text-primary-foreground">{t('pricing.currentPlan')}</Badge>
                  </div>
                )}

                <div className="space-y-1">
                  <h3 className="flex items-center gap-2 font-display text-2xl font-bold">
                    <Zap className="h-5 w-5 text-blue-500" />
                    {freePlan.name}
                  </h3>
                  {freePlan.description && (
                    <p className="text-sm text-muted-foreground">{freePlan.description}</p>
                  )}
                </div>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="font-display text-5xl font-extrabold">{t('pricing.free')}</span>
                </div>

                <ul className="mt-6 space-y-3">
                  {freePlan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 flex-shrink-0 text-green-500" />
                      {featureLabel(f)}
                    </li>
                  ))}
                  {proPlan?.features
                    .filter((f) => !freePlan.features.includes(f))
                    .map((f) => (
                      <li
                        key={f}
                        className="flex items-center gap-2 text-sm text-muted-foreground/60 line-through"
                      >
                        {featureLabel(f)}
                      </li>
                    ))}
                </ul>

                <Link to={isLoggedIn ? '/dashboard' : '/login?register=1'} className="mt-8 block">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full rounded-xl"
                    disabled={currentPlanType === 'FREE'}
                  >
                    {currentPlanType === 'FREE'
                      ? t('pricing.inUse')
                      : isLoggedIn
                        ? t('pricing.goToDashboard')
                        : t('pricing.startFree')}
                  </Button>
                </Link>
              </motion.div>
            )}

            {proPlan && (
              <motion.div
                {...reveal(1)}
                className={`relative rounded-3xl border-2 p-8 shadow-md transition-all duration-300 ease-soft hover:-translate-y-1 hover:shadow-card-hover ${
                  currentPlanType === 'PRO'
                    ? 'border-amber-400 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50'
                    : 'border-amber-300 bg-gradient-to-br from-amber-50/60 via-yellow-50/40 to-orange-50/60'
                }`}
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="border-0 bg-gradient-to-r from-amber-500 to-orange-500 px-3 text-white">
                    {currentPlanType === 'PRO' ? t('pricing.currentPlan') : t('pricing.mostPopular')}
                  </Badge>
                </div>

                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-amber-300/30 blur-3xl"
                />

                <div className="relative space-y-1">
                  <h3 className="flex items-center gap-2 font-display text-2xl font-bold">
                    <Crown className="h-5 w-5 text-amber-500" />
                    {proPlan.name}
                  </h3>
                  {proPlan.description && (
                    <p className="text-sm text-muted-foreground">{proPlan.description}</p>
                  )}
                </div>

                <div className="relative mt-6 flex items-baseline gap-1">
                  <span className="font-display text-5xl font-extrabold">{formatVND(proPlan.price)}</span>
                  <span className="text-muted-foreground">{t('pricing.perMonth')}</span>
                </div>

                <ul className="relative mt-6 space-y-3">
                  {proPlan.features.map((f) => {
                    const isProOnly = !freePlan?.features.includes(f);
                    return (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 flex-shrink-0 text-amber-500" />
                        <span className={isProOnly ? 'font-medium' : ''}>
                          {featureLabel(f)}
                        </span>
                        {isProOnly && (
                          <Badge
                            variant="outline"
                            className="h-4 border-amber-300 px-1.5 py-0 text-[10px] text-amber-600"
                          >
                            PRO
                          </Badge>
                        )}
                      </li>
                    );
                  })}
                </ul>

                <Link to={proCtaTo} className="relative mt-8 block">
                  <Button
                    size="lg"
                    className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 font-semibold text-white shadow-lg shadow-amber-200/60 transition-all hover:from-amber-600 hover:to-orange-600 hover:shadow-xl hover:shadow-amber-300/60"
                    disabled={currentPlanType === 'PRO'}
                  >
                    {currentPlanType === 'PRO' ? (
                      <>
                        <Crown className="mr-2 h-4 w-4" />
                        {t('pricing.inUse')}
                      </>
                    ) : (
                      <>
                        {t('pricing.upgradeToPro')}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </Link>
              </motion.div>
            )}
          </div>
        )}

        <motion.p {...reveal(2)} className="mt-10 text-center text-sm text-muted-foreground">
          {t('pricing.footnote')}
        </motion.p>
      </div>
    </section>
  );
}
