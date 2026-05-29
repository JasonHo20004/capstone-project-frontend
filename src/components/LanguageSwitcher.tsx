import { useTranslation } from "react-i18next";
import { Check, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/i18n";

interface LanguageSwitcherProps {
  variant?: "icon" | "default";
  className?: string;
  align?: "start" | "center" | "end";
}

const LANG_BADGE: Record<SupportedLanguage, string> = {
  en: "EN",
  vi: "VI",
};

export default function LanguageSwitcher({
  variant = "icon",
  className,
  align = "end",
}: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation("common");

  const current = (i18n.resolvedLanguage ?? i18n.language ?? "en").slice(0, 2) as SupportedLanguage;
  const activeBadge = LANG_BADGE[current] ?? LANG_BADGE.en;

  const changeLanguage = (lang: SupportedLanguage) => {
    if (lang === current) return;
    void i18n.changeLanguage(lang);
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
    }
  };

  const trigger =
    variant === "icon" ? (
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-9 w-9 relative", className)}
        aria-label={t("language.switchTo")}
      >
        <Languages className="h-[18px] w-[18px]" />
        <span className="absolute -bottom-0.5 right-0.5 rounded bg-primary/10 px-1 text-[9px] font-bold leading-none text-primary">
          {activeBadge}
        </span>
        <span className="sr-only">{t("language.switchTo")}</span>
      </Button>
    ) : (
      <Button variant="outline" size="sm" className={cn("gap-2", className)}>
        <Languages className="h-4 w-4" />
        {t(`language.${current}`)}
      </Button>
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-44">
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
          {t("language.label")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {SUPPORTED_LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => changeLanguage(lang)}
            className="gap-2"
          >
            <span className="inline-flex h-5 w-7 items-center justify-center rounded bg-muted text-[10px] font-bold tracking-wide">
              {LANG_BADGE[lang]}
            </span>
            <span className="flex-1">{t(`language.${lang}`)}</span>
            {current === lang && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
