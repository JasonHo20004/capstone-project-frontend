import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { LifeBuoy, type LucideIcon } from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { Seo } from "@/components/seo/Seo";
import { cn } from "@/lib/utils";

/**
 * Shared template for branded HTTP error pages (401 / 403 / 500).
 *
 * Presentational only — each route supplies its own copy, icon, accent, and
 * recovery actions. Built on semantic design tokens so light and dark mode both
 * work without a second colour set. The status colour (blue / amber / red) reads
 * as a semantic badge across the numeral, icon chip, status pill, and ambient
 * blooms; recovery CTAs use the brand's own button variants.
 */

type ErrorAccent = "blue" | "amber" | "red";

export interface ErrorAction {
  label: string;
  icon: LucideIcon;
  /** react-router target. Mutually exclusive with onClick. */
  to?: string;
  /** Imperative action (reload, history back). Mutually exclusive with to. */
  onClick?: () => void;
  variant?: ButtonProps["variant"];
}

export interface ErrorPageProps {
  /** HTTP status code rendered as the display numeral, e.g. "401". */
  code: string;
  accent: ErrorAccent;
  /** Status glyph shown in the overlapping chip. */
  icon: LucideIcon;
  /** Short status word for the pill, e.g. "Unauthorized". */
  status: string;
  /** Headline. Conveys the error in plain language. */
  title: string;
  /** Supporting line. Kept short (≤ ~20 words). */
  message: string;
  /** One primary + optional secondary recovery action. */
  actions: ErrorAction[];
  helpLabel?: string;
  helpHref?: string;
  /** Full document title for this route. */
  documentTitle: string;
}

interface AccentStyle {
  chip: string;
  pill: string;
  glow: string;
  bloomA: string;
  bloomB: string;
}

const ACCENT_STYLES: Record<ErrorAccent, AccentStyle> = {
  blue: {
    chip: "bg-primary text-primary-foreground shadow-accent",
    pill: "bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary-light",
    glow: "bg-primary/20",
    bloomA: "bg-primary/20",
    bloomB: "bg-primary-light/25",
  },
  // Brand orange (#fe9400). Uses explicit HSL because the `secondary` token is
  // remapped to slate in dark mode, which would lose the orange identity.
  amber: {
    chip: "bg-[hsl(33_100%_50%)] text-[hsl(30_100%_15%)] shadow-glow-orange",
    pill: "bg-[hsl(33_100%_50%/0.12)] text-[hsl(33_92%_30%)] dark:text-[hsl(33_100%_64%)]",
    glow: "bg-[hsl(33_100%_50%/0.22)]",
    bloomA: "bg-[hsl(33_100%_50%/0.22)]",
    bloomB: "bg-[hsl(33_100%_64%/0.20)]",
  },
  red: {
    chip: "bg-destructive text-destructive-foreground",
    pill: "bg-destructive/10 text-destructive dark:bg-destructive/15 dark:text-[hsl(0_84%_72%)]",
    glow: "bg-destructive/18",
    bloomA: "bg-destructive/18",
    bloomB: "bg-destructive/12",
  },
};

function ActionButton({ action }: { action: ErrorAction }) {
  const { label, icon: Icon, variant = "primary", to, onClick } = action;
  const content = (
    <>
      <Icon strokeWidth={2} />
      {label}
    </>
  );

  if (to) {
    return (
      <Button asChild variant={variant} size="lg" className="w-full sm:w-auto">
        <Link to={to}>{content}</Link>
      </Button>
    );
  }

  return (
    <Button variant={variant} size="lg" onClick={onClick} className="w-full sm:w-auto">
      {content}
    </Button>
  );
}

export function ErrorPage({
  code,
  accent,
  icon: StatusIcon,
  status,
  title,
  message,
  actions,
  helpLabel,
  helpHref,
  documentTitle,
}: ErrorPageProps) {
  const reduce = useReducedMotion();
  const a = ACCENT_STYLES[accent];

  // Error routes should never be indexed. Add a noindex tag for this page only
  // and remove it on unmount so other routes are unaffected.
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, follow";
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
  };
  const item: Variants = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <>
      <Seo title={documentTitle} />
      <main className="relative isolate flex min-h-[100dvh] flex-col overflow-hidden bg-background">
        {/* Dot-grid texture, faded toward the edges */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04] dark:opacity-[0.07] [mask-image:radial-gradient(ellipse_62%_60%_at_50%_38%,black,transparent)]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1.5px 1.5px, hsl(var(--foreground)) 1.5px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        {/* Ambient accent blooms */}
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute -right-28 -top-20 h-[460px] w-[460px] rounded-full blur-3xl motion-safe:animate-aurora",
            a.bloomA,
          )}
        />
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute -bottom-28 -left-24 h-[520px] w-[520px] rounded-full blur-3xl motion-safe:animate-float-slow",
            a.bloomB,
          )}
        />

        {/* Brand bar */}
        <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6">
          <Link
            to="/"
            aria-label={`${"Alicia"} home`}
            className="inline-flex items-center gap-2.5 transition-opacity hover:opacity-80"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary font-display text-lg font-extrabold text-primary-foreground shadow-accent">
              A
            </span>
            <span className="font-display text-lg font-extrabold tracking-tight text-foreground">
              Alicia
            </span>
          </Link>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider",
              a.pill,
            )}
          >
            {status}
          </span>
        </header>

        {/* Centre composition: copy + oversized status numeral */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-6 pb-16 lg:grid-cols-[1fr_0.85fr] lg:gap-16"
        >
          {/* Copy */}
          <div className="order-2 text-center lg:order-1 lg:text-left">
            <motion.h1
              variants={item}
              className="font-display text-3xl font-extrabold leading-[1.08] tracking-tight text-foreground md:text-4xl lg:text-5xl"
            >
              {title}
            </motion.h1>
            <motion.p
              variants={item}
              className="mx-auto mt-5 max-w-md text-base leading-relaxed text-muted-foreground md:text-lg lg:mx-0"
            >
              {message}
            </motion.p>
            <motion.div
              variants={item}
              className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap lg:justify-start"
            >
              {actions.map((action) => (
                <ActionButton key={action.label} action={action} />
              ))}
            </motion.div>
            {helpLabel && helpHref && (
              <motion.p variants={item} className="mt-7 text-sm text-muted-foreground">
                <Link
                  to={helpHref}
                  className="inline-flex items-center gap-1.5 font-medium text-foreground underline-offset-4 hover:underline"
                >
                  <LifeBuoy className="h-4 w-4" strokeWidth={2} />
                  {helpLabel}
                </Link>
              </motion.p>
            )}
          </div>

          {/* Status numeral with overlapping glyph chip */}
          <motion.div
            variants={item}
            className="order-1 flex items-center justify-center lg:order-2"
          >
            <div className="relative inline-flex items-center justify-center">
              <div
                aria-hidden
                className={cn(
                  "pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[90px]",
                  a.glow,
                )}
              />
              <motion.span
                aria-hidden
                animate={reduce ? undefined : { y: [0, -10, 0] }}
                transition={
                  reduce ? undefined : { duration: 6, repeat: Infinity, ease: "easeInOut" }
                }
                className={cn(
                  "absolute -left-3 -top-3 z-10 flex h-16 w-16 items-center justify-center rounded-2xl sm:-left-5 sm:-top-4",
                  a.chip,
                )}
              >
                <StatusIcon className="h-8 w-8" strokeWidth={1.75} />
              </motion.span>
              <span className="font-display text-[clamp(7rem,20vw,14rem)] font-extrabold leading-none tracking-tighter text-foreground">
                {code}
              </span>
            </div>
          </motion.div>
        </motion.div>
      </main>
    </>
  );
}

export default ErrorPage;
