import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Navbar from '@/components/user/layout/Navbar';
import Footer from '@/components/user/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Contact = () => {
  const { toast } = useToast();
  const { t } = useTranslation('info');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: t('contact.toast.title'),
      description: t('contact.toast.description'),
    });
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const contactInfo = [
    {
      icon: Mail,
      title: t('contact.info.email'),
      content: 'support@alicia.com',
      link: 'mailto:support@alicia.com',
    },
    {
      icon: Phone,
      title: t('contact.info.phone'),
      content: '+1 (555) 123-4567',
      link: 'tel:+15551234567',
    },
    {
      icon: MapPin,
      title: t('contact.info.address'),
      content: t('contact.info.addressValue'),
      link: '#',
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
                {t('contact.hero.title')}
              </h1>
              <p className="text-xl text-white/70">
                {t('contact.hero.subtitle')}
              </p>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Contact Info Cards */}
              <div className="lg:col-span-1 space-y-6">
                {contactInfo.map((info, index) => (
                  <a
                    key={index}
                    href={info.link}
                    className="block bg-card rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all border border-slate-200 hover:border-primary/10 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md">
                      <info.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 font-display">{info.title}</h3>
                    <p className="text-slate-500">{info.content}</p>
                  </a>
                ))}
              </div>

              {/* Contact Form */}
              <div className="lg:col-span-2">
                <div className="bg-card rounded-2xl p-8 shadow-sm border border-slate-200">
                  <h2 className="text-3xl font-bold mb-6 font-display">{t('contact.form.title')}</h2>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium mb-2">
                          {t('contact.form.name')}
                        </label>
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          required
                          value={formData.name}
                          onChange={handleChange}
                          placeholder={t('contact.form.namePlaceholder')}
                          className="h-12"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium mb-2">
                          {t('contact.form.email')}
                        </label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          placeholder={t('contact.form.emailPlaceholder')}
                          className="h-12"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium mb-2">
                        {t('contact.form.subject')}
                      </label>
                      <Input
                        id="subject"
                        name="subject"
                        type="text"
                        required
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder={t('contact.form.subjectPlaceholder')}
                        className="h-12"
                      />
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium mb-2">
                        {t('contact.form.message')}
                      </label>
                      <Textarea
                        id="message"
                        name="message"
                        required
                        value={formData.message}
                        onChange={handleChange}
                        placeholder={t('contact.form.messagePlaceholder')}
                        rows={6}
                        className="resize-none"
                      />
                    </div>

                    <Button type="submit" size="lg" className="w-full bg-primary shadow-lg shadow-primary/20">
                      <Send className="w-5 h-5 mr-2" />
                      {t('contact.form.submit')}
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Map Section (Placeholder) */}
        <section className="py-20 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="bg-card rounded-2xl overflow-hidden shadow-lg border border-slate-200 h-[400px]">
                <div className="w-full h-full bg-slate-50 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-16 h-16 text-primary mx-auto mb-4" />
                    <p className="text-lg text-slate-500">{t('contact.map.label')}</p>
                    <p className="text-sm text-slate-500">{t('contact.map.addressShort')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
