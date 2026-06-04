import { useTranslation } from 'react-i18next';
import Navbar from '@/components/user/layout/Navbar';
import Footer from '@/components/user/layout/Footer';
import { Button } from '@/components/ui/button';
import { Target, Users, Award, Heart, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const About = () => {
  const { t } = useTranslation('info');

  const stats = [
    { value: '50,000+', label: t('about.stats.activeStudents') },
    { value: '200+', label: t('about.stats.courses') },
    { value: '98%', label: t('about.stats.successRate') },
    { value: '50+', label: t('about.stats.countries') },
  ];

  const values = [
    {
      icon: Target,
      title: t('about.values.items.mission.title'),
      description: t('about.values.items.mission.description'),
    },
    {
      icon: Users,
      title: t('about.values.items.experts.title'),
      description: t('about.values.items.experts.description'),
    },
    {
      icon: Award,
      title: t('about.values.items.quality.title'),
      description: t('about.values.items.quality.description'),
    },
    {
      icon: Heart,
      title: t('about.values.items.studentSuccess.title'),
      description: t('about.values.items.studentSuccess.description'),
    },
  ];

  const team = [
    {
      name: 'Dr. Sarah Johnson',
      role: t('about.team.members.sarah'),
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    },
    {
      name: 'Michael Chen',
      role: t('about.team.members.michael'),
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
    },
    {
      name: 'Emma Williams',
      role: t('about.team.members.emma'),
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
    },
    {
      name: 'David Martinez',
      role: t('about.team.members.david'),
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
    },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-800 text-white py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 font-display">
                {t('about.hero.title')}
              </h1>
              <p className="text-xl text-white/70">
                {t('about.hero.subtitle')}
              </p>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                    {stat.value}
                  </div>
                  <div className="text-slate-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-bold mb-6 font-display">{t('about.story.title')}</h2>
                <div className="space-y-4 text-slate-500 leading-relaxed">
                  <p>{t('about.story.p1')}</p>
                  <p>{t('about.story.p2')}</p>
                  <p>{t('about.story.p3')}</p>
                </div>
              </div>
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&h=600&fit=crop"
                  alt={t('about.story.imgAlt')}
                  className="rounded-2xl shadow-lg"
                />
                <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute -top-6 -right-6 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 font-display">
                {t('about.values.title')}
              </h2>
              <p className="text-lg text-slate-500">
                {t('about.values.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <div
                  key={index}
                  className="bg-card rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all border border-slate-200"
                >
                  <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center mb-6 shadow-md">
                    <value.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 font-display">{value.title}</h3>
                  <p className="text-slate-500 leading-relaxed">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 font-display">
                {t('about.team.title')}
              </h2>
              <p className="text-lg text-slate-500">
                {t('about.team.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {team.map((member, index) => (
                <div
                  key={index}
                  className="group text-center"
                >
                  <div className="relative mb-6 overflow-hidden rounded-2xl">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h3 className="text-xl font-semibold mb-1 font-display">{member.name}</h3>
                  <p className="text-slate-500">{member.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold text-white font-display">
                {t('about.cta.title')}
              </h2>
              <p className="text-xl text-white/70">
                {t('about.cta.subtitle')}
              </p>
              <Link to="/courses">
                <Button size="lg" variant="secondary" className="shadow-lg shadow-primary/20 text-lg h-14 px-8">
                  {t('about.cta.exploreCourses')}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
