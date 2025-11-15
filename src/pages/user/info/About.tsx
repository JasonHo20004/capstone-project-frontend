import Navbar from '@/components/user/layout/Navbar';
import Footer from '@/components/user/layout/Footer';
import { Button } from '@/components/ui/button';
import { Target, Users, Award, Heart, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const About = () => {
  const stats = [
    { value: '50,000+', label: 'Học viên đang hoạt động' },
    { value: '200+', label: 'Khoá học chuyên sâu' },
    { value: '98%', label: 'Tỷ lệ thành công' },
    { value: '50+', label: 'Quốc gia' },
  ];

  const values = [
    {
      icon: Target,
      title: 'Sứ mệnh của chúng tôi',
      description: 'Mang giáo dục tiếng Anh chất lượng đến với mọi người, mọi nơi và trao quyền cho người học đạt được mục tiêu.',
    },
    {
      icon: Users,
      title: 'Đội ngũ chuyên gia',
      description: 'Giảng viên là các chuyên gia được chứng nhận, giàu kinh nghiệm và đam mê giảng dạy.',
    },
    {
      icon: Award,
      title: 'Chất lượng là trên hết',
      description: 'Duy trì tiêu chuẩn cao nhất trong nội dung khóa học, cách triển khai và hỗ trợ học viên.',
    },
    {
      icon: Heart,
      title: 'Thành công của học viên',
      description: 'Sự thành công của bạn là ưu tiên của chúng tôi. Luôn đồng hành và hỗ trợ trong suốt hành trình học tập.',
    },
  ];

  const team = [
    {
      name: 'Dr. Sarah Johnson',
      role: 'Giảng viên trưởng',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    },
    {
      name: 'Michael Chen',
      role: 'Chuyên gia tiếng Anh thương mại',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
    },
    {
      name: 'Emma Williams',
      role: 'Chuyên gia IELTS',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
    },
    {
      name: 'David Martinez',
      role: 'Huấn luyện viên Speaking',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
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
                Về SkillBoost
              </h1>
              <p className="text-xl text-primary-foreground/80">
                Trao quyền cho người học trên toàn thế giới để làm chủ tiếng Anh và đạt được ước mơ
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
                  <div className="text-muted-foreground">{stat.label}</div>
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
                <h2 className="text-4xl font-bold mb-6 font-['Be Vietnam Pro']">Câu chuyện của chúng tôi</h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    Được thành lập năm 2020, SkillBoost ra đời từ một tầm nhìn đơn giản nhưng mạnh mẽ: 
                    mang giáo dục tiếng Anh chất lượng cao đến với mọi người, bất kể địa điểm hay hoàn cảnh.
                  </p>
                  <p>
                    Bắt đầu từ một đội ngũ nhỏ đầy nhiệt huyết, chúng tôi đã phát triển thành nền tảng 
                    toàn cầu phục vụ hàng nghìn học viên tại hơn 50 quốc gia. Cam kết về chất lượng và 
                    thành công của học viên luôn được giữ vững.
                  </p>
                  <p>
                    Ngày nay, chúng tôi tiếp tục đổi mới và cải tiến khóa học để 
                    đảm bảo mỗi học viên nhận được trải nghiệm học tập tốt nhất. Hãy cùng chúng tôi 
                    trên hành trình chinh phục tiếng Anh.
                  </p>
                </div>
              </div>
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&h=600&fit=crop"
                  alt="Câu chuyện của chúng tôi"
                  className="rounded-2xl shadow-lg"
                />
                <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-secondary/20 rounded-full blur-3xl" />
                <div className="absolute -top-6 -right-6 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20 bg-muted">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 font-['Be Vietnam Pro']">
                Giá trị cốt lõi
              </h2>
              <p className="text-lg text-muted-foreground">
                Những nguyên tắc định hướng mọi hoạt động của chúng tôi
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <div
                  key={index}
                  className="bg-card rounded-2xl p-8 shadow-sm hover:shadow-accent transition-all border border-border"
                >
                  <div className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center mb-6 shadow-md">
                    <value.icon className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 font-['Be Vietnam Pro']">{value.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 font-['Be Vietnam Pro']">
                Đội ngũ giảng viên
              </h2>
              <p className="text-lg text-muted-foreground">
                Học với các chuyên gia giàu kinh nghiệm, tận tâm với thành công của bạn
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
                  <h3 className="text-xl font-semibold mb-1 font-['Be Vietnam Pro']">{member.name}</h3>
                  <p className="text-muted-foreground">{member.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-primary">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground font-['Be Vietnam Pro']">
                Tham gia cộng đồng đang phát triển của chúng tôi
              </h2>
              <p className="text-xl text-primary-foreground/80">
                Bắt đầu hành trình chinh phục tiếng Anh với sự đồng hành và hỗ trợ từ các chuyên gia
              </p>
              <Link to="/courses">
                <Button size="lg" variant="secondary" className="shadow-accent text-lg h-14 px-8">
                  Khám phá khóa học
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
