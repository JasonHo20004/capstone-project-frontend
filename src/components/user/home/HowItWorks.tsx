import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ClipboardCheck, Sparkles, Dumbbell, Trophy, type LucideIcon } from 'lucide-react';

interface Step {
  key: string;
  icon: LucideIcon;
}

const STEPS: Step[] = [
  { key: 'assess', icon: ClipboardCheck },
  { key: 'plan', icon: Sparkles },
  { key: 'practice', icon: Dumbbell },
  { key: 'achieve', icon: Trophy },
];

export default function HowItWorks() {
  const reduce = useReducedMotion();
  const { t } = useTranslation('landing');

  return (
    <section className="bg-surface-low py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <span className="inline-flex rounded-full bg-secondary/15 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-secondary">
            {t('howItWorks.eyebrow')}
          </span>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight md:text-5xl">
            {t('howItWorks.title')}
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">{t('howItWorks.subtitle')}</p>
        </div>

        <div className="relative grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Connecting line (desktop) */}
          <div
            aria-hidden
            className="absolute left-0 right-0 top-9 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent lg:block"
          />

          {STEPS.map((step, i) => (
            <motion.div
              key={step.key}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="relative text-center"
            >
              {/* Numbered node */}
              <div className="relative z-10 mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-lowest shadow-md ring-1 ring-border/10">
                <step.icon className="h-7 w-7 text-primary" />
                <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary font-display text-sm font-bold text-primary-foreground shadow-accent">
                  {i + 1}
                </span>
              </div>
              <h3 className="font-display text-xl font-bold text-foreground">
                {t(`howItWorks.steps.${step.key}.title`)}
              </h3>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                {t(`howItWorks.steps.${step.key}.description`)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
