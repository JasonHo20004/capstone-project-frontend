import { useTranslation } from 'react-i18next';
import Navbar from '@/components/user/layout/Navbar';
import Footer from '@/components/user/layout/Footer';
import { Calendar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const Blog = () => {
  const { t } = useTranslation('info');

  const posts = [
    {
      id: 1,
      key: 'tips10',
      author: 'Dr. Sarah Johnson',
      authorImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      date: 'Jan 15, 2025',
      categoryKey: 'studyTips',
      thumbnail: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&h=450&fit=crop',
      readMinutes: 5,
    },
    {
      id: 2,
      key: 'immersion',
      author: 'Michael Chen',
      authorImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
      date: 'Jan 12, 2025',
      categoryKey: 'methodology',
      thumbnail: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=450&fit=crop',
      readMinutes: 8,
    },
    {
      id: 3,
      key: 'businessEnglish',
      author: 'Emma Williams',
      authorImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
      date: 'Jan 10, 2025',
      categoryKey: 'business',
      thumbnail: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=450&fit=crop',
      readMinutes: 10,
    },
    {
      id: 4,
      key: 'grammarMistakes',
      author: 'David Martinez',
      authorImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
      date: 'Jan 8, 2025',
      categoryKey: 'grammar',
      thumbnail: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&h=450&fit=crop',
      readMinutes: 6,
    },
    {
      id: 5,
      key: 'ieltsSpeaking',
      author: 'Prof. Lisa Anderson',
      authorImage: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=100&h=100&fit=crop',
      date: 'Jan 5, 2025',
      categoryKey: 'testPrep',
      thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=450&fit=crop',
      readMinutes: 12,
    },
    {
      id: 6,
      key: 'vocabulary',
      author: 'Rachel Green',
      authorImage: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop',
      date: 'Jan 3, 2025',
      categoryKey: 'vocabulary',
      thumbnail: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=450&fit=crop',
      readMinutes: 7,
    },
  ];

  const featuredPost = posts[0];

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-800 text-white py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 font-display">
                {t('blog.hero.title')}
              </h1>
              <p className="text-xl text-white/70">
                {t('blog.hero.subtitle')}
              </p>
            </div>
          </div>
        </section>

        {/* Featured Post */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="bg-card rounded-2xl overflow-hidden shadow-lg border border-slate-200 hover:shadow-lg transition-all">
                <div className="grid md:grid-cols-2 gap-0">
                  <div className="relative aspect-video md:aspect-auto">
                    <img
                      src={featuredPost.thumbnail}
                      alt={t(`blog.posts.${featuredPost.key}.title`)}
                      className="w-full h-full object-cover"
                    />
                    <Badge className="absolute top-4 left-4 bg-secondary shadow-md">
                      {t('blog.featuredBadge')}
                    </Badge>
                  </div>
                  <div className="p-8 flex flex-col justify-center">
                    <Badge variant="outline" className="w-fit mb-4">
                      {t(`blog.categories.${featuredPost.categoryKey}`)}
                    </Badge>
                    <h2 className="text-3xl font-bold mb-4 font-display">
                      {t(`blog.posts.${featuredPost.key}.title`)}
                    </h2>
                    <p className="text-slate-500 mb-6 leading-relaxed">
                      {t(`blog.posts.${featuredPost.key}.excerpt`)}
                    </p>
                    <div className="flex items-center gap-4 mb-6">
                      <img
                        src={featuredPost.authorImage}
                        alt={featuredPost.author}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{featuredPost.author}</div>
                        <div className="text-sm text-slate-500 flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {featuredPost.date}
                          </span>
                          <span>•</span>
                          <span>{t('blog.readTime', { minutes: featuredPost.readMinutes })}</span>
                        </div>
                      </div>
                    </div>
                    <Button className="w-fit bg-primary shadow-lg shadow-primary/20">
                      {t('blog.readMore')}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Blog Posts Grid */}
        <section className="py-16 bg-slate-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-12 font-display">{t('blog.latestArticles')}</h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.slice(1).map((post) => (
                <article
                  key={post.id}
                  className="bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-slate-200 hover:border-primary/10 group"
                >
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={post.thumbnail}
                      alt={t(`blog.posts.${post.key}.title`)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <Badge variant="outline" className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm">
                      {t(`blog.categories.${post.categoryKey}`)}
                    </Badge>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-3 line-clamp-2 group-hover:text-primary transition-colors font-display">
                      {t(`blog.posts.${post.key}.title`)}
                    </h3>
                    <p className="text-slate-500 text-sm mb-4 line-clamp-3">
                      {t(`blog.posts.${post.key}.excerpt`)}
                    </p>
                    <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
                      <img
                        src={post.authorImage}
                        alt={post.author}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{post.author}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                          <span>{post.date}</span>
                          <span>•</span>
                          <span>{t('blog.readTime', { minutes: post.readMinutes })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="py-20 bg-primary">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-2xl mx-auto space-y-6">
              <h2 className="text-4xl font-bold text-white font-display">
                {t('blog.newsletter.title')}
              </h2>
              <p className="text-xl text-white/70">
                {t('blog.newsletter.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto pt-4">
                <input
                  type="email"
                  placeholder={t('blog.newsletter.placeholder')}
                  className="flex-1 h-12 px-4 rounded-lg border-0 focus:ring-2 focus:ring-secondary"
                />
                <Button size="lg" variant="secondary" className="shadow-lg shadow-primary/20">
                  {t('blog.newsletter.submit')}
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Blog;
