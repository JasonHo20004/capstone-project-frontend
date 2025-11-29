import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, Star, Users, BookOpen } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center bg-gradient-hero overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8 text-primary-foreground">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/20 backdrop-blur-sm border border-secondary/30">
              <Star className="w-4 h-4 text-secondary fill-secondary" />
              <span className="text-sm font-medium">
                Được tin tưởng bởi 50.000+ học viên
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight font-['Be Vietnam Pro']">
              Thành thạo tiếng Anh
              <span className="block text-secondary">theo tốc độ của bạn</span>
            </h1>

            {/* Description */}
            <p className="text-xl text-primary-foreground/80 leading-relaxed max-w-xl">
              Tham gia cùng hàng nghìn người học trên toàn thế giới để nâng cao
              kỹ năng tiếng Anh với các khóa học do chuyên gia giảng dạy, bài
              học tương tác và lộ trình học cá nhân hóa.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <Link to="/courses">
                <Button
                  size="lg"
                  className="bg-secondary hover:bg-secondary-light shadow-accent text-lg h-14 px-8"
                >
                  <BookOpen className="w-5 h-5 mr-2" />
                  Khám phá khóa học
                </Button>
              </Link>
              <Button
                size="lg"
                variant="secondary" // Hoặc dùng className bg-white nếu variant k
                // hông có sẵn
                className="bg-white text-primary hover:bg-gray-100 border-2 border-white shadow-lg text-lg h-14 px-8"
              >
                <Play className="w-5 h-5 mr-2 fill-current" />{" "}
                {/* fill-current để icon đặc ruột */}
                Xem demo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8">
              <div className="space-y-1">
                <div className="text-3xl md:text-4xl font-bold text-secondary">
                  50K+
                </div>
                <div className="text-sm text-primary-foreground/70">
                  Học viên đang hoạt động
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl md:text-4xl font-bold text-secondary">
                  200+
                </div>
                <div className="text-sm text-primary-foreground/70">
                  Khoá học chuyên sâu
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl md:text-4xl font-bold text-secondary">
                  98%
                </div>
                <div className="text-sm text-primary-foreground/70">
                  Tỷ lệ thành công
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Hero Image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop"
                alt="Học viên học cùng nhau"
                className="w-full h-auto object-cover"
              />
              {/* Floating Card */}
              <div className="absolute bottom-8 left-8 right-8 bg-card/95 backdrop-blur-sm rounded-xl p-6 shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">
                      2,500+
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Học viên đăng ký trong tuần này
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-secondary/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-secondary/20 rounded-full blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
