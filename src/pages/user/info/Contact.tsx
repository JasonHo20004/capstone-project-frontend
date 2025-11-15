import { useState } from 'react';
import Navbar from '@/components/user/layout/Navbar';
import Footer from '@/components/user/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Contact = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Đã gửi tin nhắn!",
      description: "Chúng tôi sẽ phản hồi bạn sớm nhất có thể.",
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
      title: 'Email',
      content: 'support@skillboost.com',
      link: 'mailto:support@skillboost.com',
    },
    {
      icon: Phone,
      title: 'Gọi cho chúng tôi',
      content: '+1 (555) 123-4567',
      link: 'tel:+15551234567',
    },
    {
      icon: MapPin,
      title: 'Địa chỉ',
      content: '123 Learning Street, Education City, EC 12345',
      link: '#',
    },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-hero text-primary-foreground py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 font-['Be Vietnam Pro']">
                Liên hệ với chúng tôi
              </h1>
              <p className="text-xl text-primary-foreground/80">
                Bạn có câu hỏi? Hãy gửi tin nhắn cho chúng tôi và chúng tôi sẽ phản hồi trong thời gian sớm nhất.
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
                    className="block bg-card rounded-2xl p-6 shadow-sm hover:shadow-accent transition-all border border-border hover:border-primary/20 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md">
                      <info.icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 font-['Be Vietnam Pro']">{info.title}</h3>
                    <p className="text-muted-foreground">{info.content}</p>
                  </a>
                ))}
              </div>

              {/* Contact Form */}
              <div className="lg:col-span-2">
                <div className="bg-card rounded-2xl p-8 shadow-sm border border-border">
                  <h2 className="text-3xl font-bold mb-6 font-['Be Vietnam Pro']">Gửi tin nhắn cho chúng tôi</h2>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium mb-2">
                          Họ và tên
                        </label>
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          required
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Nguyễn Văn A"
                          className="h-12"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium mb-2">
                          Địa chỉ email
                        </label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="ten@example.com"
                          className="h-12"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium mb-2">
                        Chủ đề
                      </label>
                      <Input
                        id="subject"
                        name="subject"
                        type="text"
                        required
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="Chúng tôi có thể giúp gì cho bạn?"
                        className="h-12"
                      />
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium mb-2">
                        Nội dung
                      </label>
                      <Textarea
                        id="message"
                        name="message"
                        required
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Hãy mô tả chi tiết về yêu cầu của bạn..."
                        rows={6}
                        className="resize-none"
                      />
                    </div>

                    <Button type="submit" size="lg" className="w-full bg-gradient-primary shadow-accent">
                      <Send className="w-5 h-5 mr-2" />
                      Gửi tin nhắn
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Map Section (Placeholder) */}
        <section className="py-20 bg-muted">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="bg-card rounded-2xl overflow-hidden shadow-lg border border-border h-[400px]">
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-16 h-16 text-primary mx-auto mb-4" />
                    <p className="text-lg text-muted-foreground">Vị trí bản đồ</p>
                    <p className="text-sm text-muted-foreground">123 Learning Street, Education City</p>
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
