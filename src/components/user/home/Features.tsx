import { Award, Clock, Users, Globe, BookOpen, Trophy } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: BookOpen,
      title: 'Khóa học do chuyên gia giảng dạy',
      description: 'Học với giảng viên bản ngữ có nhiều năm kinh nghiệm giảng dạy',
    },
    {
      icon: Clock,
      title: 'Lịch học linh hoạt',
      description: 'Học theo tốc độ của bạn với quyền truy cập tài liệu 24/7',
    },
    {
      icon: Users,
      title: 'Học tập tương tác',
      description: 'Tương tác với bạn học và giảng viên qua các buổi học trực tuyến và diễn đàn',
    },
    {
      icon: Globe,
      title: 'Cộng đồng toàn cầu',
      description: 'Kết nối với người học khắp thế giới và cùng luyện tập',
    },
    {
      icon: Award,
      title: 'Chương trình được chứng nhận',
      description: 'Nhận chứng chỉ được công nhận khi hoàn thành khóa học',
    },
    {
      icon: Trophy,
      title: 'Hiệu quả đã được chứng minh',
      description: '98% học viên của chúng tôi ghi nhận sự tiến bộ rõ rệt',
    },
  ];

  return (
    <section className="py-20 bg-muted">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 font-['Be Vietnam Pro']">
            Vì sao chọn <span className="text-primary">SkillBoost</span>?
          </h2>
          <p className="text-lg text-muted-foreground">
            Chúng tôi cung cấp mọi thứ bạn cần để thành thạo tiếng Anh và đạt được mục tiêu học tập
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group bg-card rounded-2xl p-8 shadow-sm hover:shadow-accent transition-all duration-300 border border-border hover:border-primary/20"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-md">
                <feature.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3 font-['Be Vietnam Pro']">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
