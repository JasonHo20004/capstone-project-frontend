import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, Star, Users, BookOpen, TrendingUp, CheckCircle } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 overflow-hidden">
      {/* Dot-grid background */}
      <div className="absolute inset-0 opacity-[0.04]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1.5px 1.5px, white 1.5px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* Ambient glow blobs */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8 text-primary-foreground">
            {/* Trust badge with animated pulse */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/8 backdrop-blur-md border border-white/15 shadow-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-sm font-medium text-white/90">
                Được tin tưởng bởi 50.000+ học viên
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tighter font-display">
              Thành thạo tiếng Anh
              <span className="block bg-gradient-to-r from-primary via-sky-400 to-indigo-400 bg-clip-text text-transparent">
                theo tốc độ của bạn
              </span>
            </h1>

            {/* Description */}
            <p className="text-lg text-white/70 leading-relaxed max-w-lg">
              Tham gia cùng hàng nghìn người học trên toàn thế giới để nâng cao
              kỹ năng tiếng Anh với các khóa học do chuyên gia giảng dạy, bài
              học tương tác và lộ trình học cá nhân hóa.
            </p>

            {/* Social proof bullets */}
            <ul className="space-y-2">
              {[
                "Lộ trình cá nhân hóa theo trình độ",
                "Phản hồi tức thì từ AI & giảng viên",
                "Chứng chỉ hoàn thành được công nhận",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-white/70">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 pt-2">
              <Link to="/#courses">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/30 text-white text-base h-12 px-7 rounded-xl transition-all duration-200 hover:scale-[1.02]"
                >
                  <BookOpen className="w-5 h-5 mr-2" />
                  Khám phá khóa học
                </Button>
              </Link>
              <Button
                size="lg"
                variant="ghost"
                className="bg-white/8 hover:bg-white/15 backdrop-blur-md text-white border border-white/15 rounded-xl text-base h-12 px-7 transition-all duration-200"
              >
                <Play className="w-4 h-4 mr-2 fill-current" />
                Xem demo
              </Button>
            </div>

            {/* Stats row */}
            <div className="flex items-center pt-4 border-t border-white/10">
              {[
                { value: "50K+", label: "Học viên" },
                { value: "200+", label: "Khoá học" },
                { value: "98%", label: "Thành công" },
              ].map((stat, i) => (
                <div key={stat.value} className="flex items-center">
                  <div className={`space-y-0.5 ${i > 0 ? "px-6" : "pr-6"}`}>
                    <div className="text-2xl md:text-3xl font-bold text-white">{stat.value}</div>
                    <div className="text-xs text-white/50 uppercase tracking-wider">{stat.label}</div>
                  </div>
                  {i < 2 && <div className="h-8 w-px bg-white/15" />}
                </div>
              ))}
            </div>
          </div>

          {/* Right Content - Hero Image */}
          <div className="relative lg:pl-6">
            {/* Decorative ring */}
            <div className="absolute inset-[-24px] rounded-[2rem] border border-white/5 hidden lg:block" />

            <div className="relative rounded-2xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.5)]">
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop"
                alt="Học viên học cùng nhau"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent" />
            </div>

            {/* Floating enroll card */}
            <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-sm rounded-2xl p-5 shadow-2xl border border-white/20">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xl font-bold text-slate-900">2,500+</div>
                  <div className="text-xs text-slate-500">Học viên đăng ký trong tuần này</div>
                </div>
                <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 rounded-lg px-3 py-1.5 shrink-0">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold">+12%</span>
                </div>
              </div>
            </div>

            {/* Decorative glows */}
            <div className="absolute -top-8 -right-8 w-36 h-36 bg-primary/25 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-44 h-44 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
