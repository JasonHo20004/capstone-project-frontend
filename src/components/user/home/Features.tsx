import { Award, Clock, Users, Globe, BookOpen, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Features = () => {
  const { t } = useTranslation('landing');

  const features = [
    {
      icon: BookOpen,
      title: t('features.items.expert.title'),
      description: t('features.items.expert.description'),
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Clock,
      title: t('features.items.flexible.title'),
      description: t('features.items.flexible.description'),
      gradient: 'from-violet-500 to-purple-500',
    },
    {
      icon: Users,
      title: t('features.items.interactive.title'),
      description: t('features.items.interactive.description'),
      gradient: 'from-rose-500 to-pink-500',
    },
    {
      icon: Globe,
      title: t('features.items.global.title'),
      description: t('features.items.global.description'),
      gradient: 'from-emerald-500 to-teal-500',
    },
    {
      icon: Award,
      title: t('features.items.certified.title'),
      description: t('features.items.certified.description'),
      gradient: 'from-amber-500 to-orange-500',
    },
    {
      icon: Trophy,
      title: t('features.items.proven.title'),
      description: t('features.items.proven.description'),
      gradient: 'from-indigo-500 to-blue-600',
    },
  ];

  return (
    <section className="bg-surface py-24">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2 className="mb-4 font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            {t('features.title')} <span className="text-primary">{t('features.titleAccent')}</span>?
          </h2>
          <p className="text-lg leading-relaxed text-muted-foreground">
            {t('features.subtitle')}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-2xl bg-surface-lowest p-8 shadow-sm ring-1 ring-border/10 transition-all duration-300 ease-soft hover:-translate-y-1 hover:shadow-card-hover"
            >
              {/* Index number watermark */}
              <span className="pointer-events-none absolute right-5 top-4 select-none text-6xl font-black leading-none text-foreground/5 transition-colors group-hover:text-primary/10">
                {String(index + 1).padStart(2, '0')}
              </span>

              {/* Icon */}
              <div
                className={`relative mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} text-white shadow-md transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110`}
              >
                <feature.icon className="h-6 w-6" />
              </div>

              <h3 className="mb-2.5 font-display text-lg font-bold text-foreground">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>

              {/* Bottom accent line on hover */}
              <div className={`absolute bottom-0 left-0 h-0.5 w-0 rounded-b-2xl bg-gradient-to-r ${feature.gradient} transition-all duration-500 group-hover:w-full`} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
