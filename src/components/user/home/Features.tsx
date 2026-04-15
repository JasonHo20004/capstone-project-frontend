import { Award, Clock, Users, Globe, BookOpen, Trophy } from 'lucide-react';

const FEATURES = [
  {
    icon: BookOpen,
    title: 'Khóa học do chuyên gia giảng dạy',
    description: 'Học với giảng viên bản ngữ có nhiều năm kinh nghiệm giảng dạy',
    gradient: 'from-blue-500 to-cyan-500',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    icon: Clock,
    title: 'Lịch học linh hoạt',
    description: 'Học theo tốc độ của bạn với quyền truy cập tài liệu 24/7',
    gradient: 'from-violet-500 to-purple-500',
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
  },
  {
    icon: Users,
    title: 'Học tập tương tác',
    description: 'Tương tác với bạn học và giảng viên qua các buổi học trực tuyến và diễn đàn',
    gradient: 'from-rose-500 to-pink-500',
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-600',
  },
  {
    icon: Globe,
    title: 'Cộng đồng toàn cầu',
    description: 'Kết nối với người học khắp thế giới và cùng luyện tập',
    gradient: 'from-emerald-500 to-teal-500',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
  {
    icon: Award,
    title: 'Chương trình được chứng nhận',
    description: 'Nhận chứng chỉ được công nhận khi hoàn thành khóa học',
    gradient: 'from-amber-500 to-orange-500',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
  },
  {
    icon: Trophy,
    title: 'Hiệu quả đã được chứng minh',
    description: '98% học viên của chúng tôi ghi nhận sự tiến bộ rõ rệt',
    gradient: 'from-indigo-500 to-blue-600',
    iconBg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
  },
];

const Features = () => {
  return (
    <section className="py-24 bg-slate-50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-4">
            Tại sao chọn chúng tôi
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900 font-display">
            Vì sao chọn <span className="text-primary">SkillBoost</span>?
          </h2>
          <p className="text-lg text-slate-500 leading-relaxed">
            Chúng tôi cung cấp mọi thứ bạn cần để thành thạo tiếng Anh và đạt được mục tiêu học tập
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-slate-200 overflow-hidden"
            >
              {/* Index number watermark */}
              <span className="absolute top-4 right-5 text-6xl font-black text-slate-100 select-none leading-none group-hover:text-slate-200 transition-colors">
                {String(index + 1).padStart(2, '0')}
              </span>

              {/* Icon */}
              <div className={`relative w-13 h-13 w-12 h-12 rounded-xl ${feature.iconBg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
              </div>

              <h3 className="text-lg font-bold mb-2.5 text-slate-900 font-display">{feature.title}</h3>
              <p className="text-slate-500 leading-relaxed text-sm">{feature.description}</p>

              {/* Bottom accent line on hover */}
              <div className={`absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r ${feature.gradient} group-hover:w-full transition-all duration-500 rounded-b-2xl`} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
