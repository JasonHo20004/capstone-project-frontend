import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Star, Users, BookOpen, TrendingUp, CheckCircle, Mic, Flame } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

// Lazy so three.js stays out of the initial Hero/landing bundle.
const PenguinHero3D = lazy(() => import("@/components/user/home/PenguinHero3D"));

const Hero = () => {
  const reduce = useReducedMotion();
  const { t } = useTranslation(["landing", "layout"]);

  const stats = [
    { value: "50K+", label: t("hero.stats.learners") },
    { value: "200+", label: t("hero.stats.courses") },
    { value: "98%", label: t("hero.stats.success") },
  ];

  const bullets = [
    t("hero.bullets.personalizedPath"),
    t("hero.bullets.instantFeedback"),
    t("hero.bullets.certificate"),
  ];

  const skills = t("hero.skills", { returnObjects: true }) as unknown as string[];
  const skillTrack = Array.isArray(skills) ? [...skills, ...skills] : [];

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

      {/* Animated aurora blooms */}
      <div aria-hidden className="pointer-events-none absolute -right-24 top-10 h-[420px] w-[420px] animate-aurora rounded-full bg-secondary/25 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -left-32 bottom-0 h-[480px] w-[480px] animate-float-slow rounded-full bg-primary-light/35 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute left-1/3 top-1/4 h-[500px] w-[500px] animate-aurora rounded-full bg-white/5 blur-[120px]" />

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
            <span className="text-white/90">{t("hero.trustBadge")}</span>
          </div>

          <h1 className="font-display text-[clamp(2.75rem,1.5rem+5vw,5.5rem)] font-extrabold leading-[1.02] tracking-tight">
            {t("hero.titleLine1")}
            <span className="mt-2 block bg-gradient-to-r from-white via-secondary-light to-secondary bg-clip-text text-transparent">
              {t("hero.titleLine2")}
            </span>
          </h1>

          <p className="max-w-xl text-lg leading-relaxed text-white/80 md:text-xl">
            {t("hero.subtitle")}
          </p>

          {/* Social proof bullets */}
          <ul className="space-y-2">
            {bullets.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-white/75">
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
                {item}
              </li>
            ))}
          </ul>

          {/* CTAs */}
          <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:flex-wrap">
            <Link to="/login?register=1" className="w-full sm:w-auto">
              <Button variant="accent" size="xl" className="w-full sm:w-auto">
                {t("publicNav.getStarted", { ns: "layout" })}
                <ArrowRight className="ml-1 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/#courses" className="w-full sm:w-auto">
              <Button variant="onDark" size="xl" className="w-full sm:w-auto">
                <BookOpen className="mr-1 h-5 w-5" />
                {t("hero.exploreCourses")}
              </Button>
            </Link>
          </div>

          {/* Stats row — inline, divided */}
          <div className="flex items-center border-t border-white/10 pt-4">
            {stats.map((stat, i) => (
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
                {i < stats.length - 1 && <div className="h-8 w-px bg-white/15" />}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right — image + floating product cards */}
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="relative lg:pl-6"
        >
          {/* Decorative frame ring */}
          <div aria-hidden className="absolute inset-[-24px] hidden rounded-[2rem] border border-white/5 lg:block" />

          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-gradient-to-b from-[#0a1f44] via-primary/30 to-[#06122c] shadow-[0_32px_80px_rgba(0,0,0,0.5)] ring-1 ring-white/10">
            {/* Radial spotlight behind the mascot */}
            <div
              aria-hidden
              className="absolute inset-0"
              style={{ background: "radial-gradient(circle at 50% 40%, rgba(43,134,255,0.38), transparent 62%)" }}
            />
            {/* Dot grid for depth */}
            <div
              aria-hidden
              className="absolute inset-0 opacity-[0.07]"
              style={{ backgroundImage: "radial-gradient(circle at 1.5px 1.5px, white 1.5px, transparent 0)", backgroundSize: "26px 26px" }}
            />
            {/* Soft ground shadow under the penguin */}
            <div aria-hidden className="absolute left-1/2 top-[64%] h-32 w-56 -translate-x-1/2 rounded-[50%] bg-black/40 blur-2xl" />

            {/* 3D brand mascot — lazy-loaded */}
            <Suspense fallback={<div className="flex h-full w-full items-center justify-center text-[7rem]">🐧</div>}>
              <PenguinHero3D className="absolute inset-0 h-full w-full" />
            </Suspense>

            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#06122c]/70 via-transparent to-transparent" />

            {/* Floating enroll card with growth chip */}
            <div className="glass absolute bottom-6 left-6 right-6 rounded-2xl p-5 shadow-md">
              <div className="flex items-center gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-accent">
                  <Users className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-xl font-bold text-foreground">{t("hero.floatingCard.count")}</div>
                  <div className="text-xs text-muted-foreground">{t("hero.floatingCard.label")}</div>
                </div>
                <div className="flex shrink-0 items-center gap-1 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-emerald-600">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span className="text-xs font-bold">+12%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Floating AI score card — top left */}
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14, x: -10 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="glass absolute -left-4 top-10 hidden rounded-2xl p-4 shadow-lg sm:block lg:-left-10 motion-safe:animate-float"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-light text-white shadow-accent">
                <Mic className="h-5 w-5" />
              </span>
              <div>
                <div className="text-[11px] font-medium text-muted-foreground">{t("hero.aiCard.title")}</div>
                <div className="font-display text-lg font-extrabold text-foreground">{t("hero.aiCard.score")}</div>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
              <CheckCircle className="h-3 w-3" />
              {t("hero.aiCard.note")}
            </div>
          </motion.div>

          {/* Floating streak chip — bottom right, above image */}
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14, x: 10 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            transition={{ duration: 0.6, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="glass absolute -right-3 top-1/2 hidden items-center gap-2.5 rounded-2xl p-3.5 shadow-lg lg:-right-8 lg:flex motion-safe:animate-float-slow"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-glow-orange">
              <Flame className="h-5 w-5" />
            </span>
            <div>
              <div className="font-display text-lg font-extrabold leading-none text-foreground">{t("hero.streak.count")}</div>
              <div className="mt-0.5 text-[11px] font-medium text-muted-foreground">{t("hero.streak.label")}</div>
            </div>
          </motion.div>

          {/* Decorative glows */}
          <div aria-hidden className="pointer-events-none absolute -top-8 -right-8 h-36 w-36 rounded-full bg-secondary/30 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-8 -left-8 h-44 w-44 rounded-full bg-primary-light/25 blur-3xl" />
        </motion.div>
      </div>

      {/* Skill / exam marquee — instant signal of breadth */}
      {skillTrack.length > 0 && (
        <div className="relative z-10 border-t border-white/10 py-5">
          <div className="group flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
            <div className="flex shrink-0 items-center gap-3 pr-3 motion-safe:animate-marquee motion-reduce:animate-none group-hover:[animation-play-state:paused]">
              {skillTrack.map((skill, i) => (
                <span
                  key={`${skill}-${i}`}
                  className="flex items-center gap-2 whitespace-nowrap rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-white/85 ring-1 ring-white/10 backdrop-blur-glass"
                >
                  <Star className="h-3 w-3 fill-secondary text-secondary" />
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Hero;
