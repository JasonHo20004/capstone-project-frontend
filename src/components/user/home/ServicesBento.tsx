import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { TiltCard } from '@/components/ui/tilt-card';
import {
  Mic,
  PenLine,
  Compass,
  Route,
  Network,
  Layers,
  Headphones,
  GraduationCap,
  Radio,
  LineChart,
  ArrowUpRight,
  type LucideIcon,
} from 'lucide-react';

interface ServiceTile {
  key: string;
  icon: LucideIcon;
  to: string;
  /** Tailwind gradient classes for the icon chip. */
  chip: string;
}

const reveal = (i: number, reduce: boolean | null) => ({
  initial: reduce ? { opacity: 0 } : { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.5, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] as const },
});

/** Animated band-score gauge used inside the flagship tile. */
function ScoreRing({ label }: { label: string }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const ratio = 7.5 / 9;
  return (
    <div className="relative flex h-24 w-24 items-center justify-center">
      <svg className="h-24 w-24 -rotate-90" viewBox="0 0 80 80" aria-hidden>
        <circle cx="40" cy="40" r={radius} className="fill-none stroke-white/15" strokeWidth="7" />
        <circle
          cx="40"
          cy="40"
          r={radius}
          className="fill-none stroke-[hsl(33_100%_55%)]"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
        />
      </svg>
      <div className="absolute flex flex-col items-center leading-none">
        <span className="font-display text-2xl font-extrabold text-white">7.5</span>
        <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-white/60">
          {label}
        </span>
      </div>
    </div>
  );
}

export default function ServicesBento() {
  const reduce = useReducedMotion();
  const { t } = useTranslation('landing');

  const tiles: ServiceTile[] = [
    { key: 'placement', icon: Compass, to: '/placement-test', chip: 'from-sky-500 to-blue-600' },
    { key: 'learningPath', icon: Route, to: '/learning-path', chip: 'from-violet-500 to-purple-600' },
    { key: 'skillTree', icon: Network, to: '/skill-tree', chip: 'from-emerald-500 to-teal-600' },
    { key: 'flashcards', icon: Layers, to: '/flashcards', chip: 'from-amber-500 to-orange-600' },
    { key: 'dictation', icon: Headphones, to: '/dictation', chip: 'from-rose-500 to-pink-600' },
    { key: 'mockExams', icon: GraduationCap, to: '/exam', chip: 'from-indigo-500 to-blue-600' },
    { key: 'live', icon: Radio, to: '/live', chip: 'from-fuchsia-500 to-rose-600' },
    { key: 'analytics', icon: LineChart, to: '/my-progress', chip: 'from-cyan-500 to-sky-600' },
  ];

  const criteria = [
    { key: 'fluency', w: 'w-[88%]' },
    { key: 'lexical', w: 'w-[76%]' },
    { key: 'grammar', w: 'w-[82%]' },
    { key: 'pronunciation', w: 'w-[70%]' },
  ];

  return (
    <section id="services" className="relative scroll-mt-24 overflow-hidden bg-surface py-24">
      {/* Atmosphere */}
      <div aria-hidden className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-40 bottom-10 h-96 w-96 rounded-full bg-secondary/10 blur-3xl" />

      <div className="container relative z-10 mx-auto px-4">
        {/* Header */}
        <motion.div {...reveal(0, reduce)} className="mx-auto mb-14 max-w-3xl text-center">
          <span className="inline-flex rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
            {t('services.eyebrow')}
          </span>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight md:text-5xl">
            {t('services.title')} <span className="text-secondary">{t('services.titleAccent')}</span>
          </h2>
          <p className="mt-3 text-lg leading-relaxed text-muted-foreground">{t('services.subtitle')}</p>
        </motion.div>

        {/* Bento grid */}
        <div className="grid auto-rows-[minmax(180px,auto)] grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Flagship — AI Speaking & Writing grading */}
          <motion.div {...reveal(1, reduce)} className="sm:col-span-2 lg:row-span-2">
            <Link
              to="/exam"
              className="group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br from-primary-dark via-primary to-primary-light p-8 text-white shadow-lg ring-1 ring-white/10 transition-all duration-300 ease-soft hover:shadow-card-hover"
            >
              <div aria-hidden className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, white 1.5px, transparent 0)', backgroundSize: '26px 26px' }} />
              <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-secondary/30 blur-3xl" />

              <div className="relative z-10">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur-glass ring-1 ring-white/20">
                    <Mic className="h-5 w-5" />
                  </span>
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur-glass ring-1 ring-white/20">
                    <PenLine className="h-5 w-5" />
                  </span>
                  <span className="ml-1 rounded-full bg-secondary px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-secondary-foreground">
                    {t('services.items.aiGrading.badge')}
                  </span>
                </div>
                <h3 className="mt-5 max-w-md font-display text-2xl font-extrabold leading-tight md:text-3xl">
                  {t('services.items.aiGrading.title')}
                </h3>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-white/75">
                  {t('services.items.aiGrading.description')}
                </p>
              </div>

              {/* Mock AI report */}
              <div className="relative z-10 mt-7 rounded-2xl bg-white/10 p-5 backdrop-blur-glass ring-1 ring-white/15">
                <div className="flex items-center gap-5">
                  <ScoreRing label={t('services.items.aiGrading.overall')} />
                  <div className="flex-1 space-y-2.5">
                    {criteria.map((c) => (
                      <div key={c.key}>
                        <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-white/70">
                          <span>{t(`services.items.aiGrading.criteria.${c.key}`)}</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
                          <div className={`h-full ${c.w} rounded-full bg-gradient-to-r from-secondary-light to-secondary`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Waveform */}
                <div className="mt-4 flex items-end gap-1" aria-hidden>
                  {[6, 11, 8, 16, 22, 14, 9, 19, 13, 24, 17, 10, 7, 15, 21, 12, 8, 18, 11, 6].map((h, i) => (
                    <span key={i} className="w-full rounded-full bg-white/40" style={{ height: `${h}px` }} />
                  ))}
                </div>
              </div>

              <span className="absolute right-6 top-6 z-10 text-white/50 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white">
                <ArrowUpRight className="h-5 w-5" />
              </span>
            </Link>
          </motion.div>

          {/* Remaining service tiles */}
          {tiles.map((tile, i) => (
            <motion.div key={tile.key} {...reveal(i + 2, reduce)} className="h-full">
              <Link to={tile.to} className="block h-full">
              <TiltCard className="group relative flex h-full flex-col overflow-hidden rounded-3xl bg-surface-lowest p-6 shadow-md ring-1 ring-border/10 transition-shadow duration-300 ease-soft hover:shadow-card-hover">
                <div className="flex items-start justify-between">
                  <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${tile.chip} text-white shadow-md transition-transform duration-300 group-hover:-rotate-6`}>
                    <tile.icon className="h-6 w-6" />
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground/50 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
                </div>
                <h3 className="mt-5 font-display text-lg font-bold text-foreground">
                  {t(`services.items.${tile.key}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t(`services.items.${tile.key}.description`)}
                </p>
                <div aria-hidden className={`absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r ${tile.chip} transition-all duration-500 group-hover:w-full`} />
              </TiltCard>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
