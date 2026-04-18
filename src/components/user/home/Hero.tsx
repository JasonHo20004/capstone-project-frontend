import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Play, Star, Users, BookOpen, TrendingUp, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pingo, PingoBubble } from "@/components/pingo";

const STATS = [
  { value: "50K+", label: "Học viên" },
  { value: "200+", label: "Khoá học" },
  { value: "98%", label: "Thành công" },
];

const BULLETS = [
  "Lộ trình cá nhân hóa theo trình độ",
  "Phản hồi tức thì từ AI & giảng viên",
  "Chứng chỉ hoàn thành được công nhận",
];

const Hero = () => {
  const reduce = useReducedMotion();

  return (
    <section className="relative isolate overflow-hidden bg-hero-gradient text-white">
      {/* Dot-grid background */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: "radial-gradient(circle at 1.5px 1.5px, white 1.5px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Ambient blooms */}
      <div aria-hidden className="pointer-events-none absolute -right-24 top-10 h-[420px] w-[420px] rounded-full bg-secondary/25 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -left-32 bottom-0 h-[480px] w-[480px] rounded-full bg-primary-light/35 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute left-1/3 top-1/4 h-[500px] w-[500px] rounded-full bg-white/5 blur-[120px]" />

      <div className="relative z-10 mx-auto grid min-h-[88vh] max-w-7xl items-center gap-12 px-4 py-24 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        {/* Left — editorial copy */}
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-8"
        >
          {/* Trust badge with live pulse */}
          <div className="inline-flex items-center gap-2.5 rounded-full bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-glass ring-1 ring-white/15">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <Star className="h-3.5 w-3.5 fill-secondary text-secondary" />
            <span className="text-white/90">Được tin tưởng bởi 50.000+ học viên</span>
          </div>

          <h1 className="font-display text-[clamp(2.75rem,1.5rem+5vw,5.5rem)] font-extrabold leading-[1.02] tracking-tight">
            Thành thạo tiếng Anh
            <span className="mt-2 block bg-gradient-to-r from-white via-secondary-light to-secondary bg-clip-text text-transparent">
              theo tốc độ của bạn.
            </span>
          </h1>

          <p className="max-w-xl text-lg leading-relaxed text-white/80 md:text-xl">
            Tham gia cùng hàng nghìn người học trên toàn thế giới để nâng cao kỹ năng tiếng Anh với các khóa học do chuyên gia giảng dạy, bài học tương tác và lộ trình học cá nhân hóa.
          </p>

          {/* Social proof bullets */}
          <ul className="space-y-2">
            {BULLETS.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-white/75">
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
                {item}
              </li>
            ))}
          </ul>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4 pt-2">
            <Link to="/#courses">
              <Button variant="pingo" size="xl">
                <BookOpen className="mr-1 h-5 w-5" />
                Khám phá khóa học
              </Button>
            </Link>
            <Button variant="glass" size="xl" className="text-white hover:text-foreground">
              <Play className="mr-1 h-5 w-5 fill-current" />
              Xem demo
            </Button>
          </div>

          {/* Stats row — inline, divided */}
          <div className="flex items-center border-t border-white/10 pt-4">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.value}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center"
              >
                <div className={`space-y-0.5 ${i > 0 ? "px-6" : "pr-6"}`}>
                  <div className="font-display text-2xl font-bold text-white md:text-3xl">{stat.value}</div>
                  <div className="text-xs uppercase tracking-wider text-white/55">{stat.label}</div>
                </div>
                {i < STATS.length - 1 && <div className="h-8 w-px bg-white/15" />}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right — image + floating stat card + Pingo peek */}
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="relative lg:pl-6"
        >
          {/* Decorative frame ring */}
          <div aria-hidden className="absolute inset-[-24px] hidden rounded-[2rem] border border-white/5 lg:block" />

          <div className="relative overflow-hidden rounded-[2rem] shadow-[0_32px_80px_rgba(0,0,0,0.5)] ring-1 ring-white/10">
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop"
              alt="Học viên học cùng nhau"
              className="h-full w-full object-cover"
              loading="eager"
            />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-primary-dark/60 via-transparent to-transparent" />

            {/* Floating enroll card with growth chip */}
            <div className="glass absolute bottom-6 left-6 right-6 rounded-2xl p-5 shadow-md">
              <div className="flex items-center gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-accent">
                  <Users className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-xl font-bold text-foreground">2,500+</div>
                  <div className="text-xs text-muted-foreground">Học viên đăng ký trong tuần này</div>
                </div>
                <div className="flex shrink-0 items-center gap-1 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-emerald-600">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span className="text-xs font-bold">+12%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pingo peek — breaks bounding box (intentional asymmetry) */}
          <div className="pointer-events-none absolute -right-6 -top-10 hidden items-start gap-2 md:flex">
            <PingoBubble side="left" className="pointer-events-auto mt-6">
              Sẵn sàng chưa? Mình sẽ đồng hành cùng bạn!
            </PingoBubble>
            <Pingo pose="wave" size={140} float />
          </div>

          {/* Decorative glows */}
          <div aria-hidden className="pointer-events-none absolute -top-8 -right-8 h-36 w-36 rounded-full bg-secondary/30 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-8 -left-8 h-44 w-44 rounded-full bg-primary-light/25 blur-3xl" />
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
