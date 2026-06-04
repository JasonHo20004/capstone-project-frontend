import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Moon, Sun, Monitor, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  /** "icon" = compact icon-only button; "default" = labelled button. */
  variant?: 'icon' | 'default';
  className?: string;
  align?: 'start' | 'center' | 'end';
}

/**
 * Light / Dark / System theme switcher. Persists choice to localStorage via
 * next-themes (key "vibecoding-theme") and toggles the `class="dark"`
 * attribute on <html> so Tailwind `dark:` utilities apply.
 */
export default function ThemeToggle({
  variant = 'icon',
  className,
  align = 'end',
}: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { t } = useTranslation('common');
  // Avoid hydration mismatch — only render the live icon after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const active = (theme ?? 'system') as 'light' | 'dark' | 'system';
  const isDark = resolvedTheme === 'dark';

  const trigger =
    variant === 'icon' ? (
      <Button
        variant="ghost"
        size="icon"
        className={cn('h-9 w-9', className)}
        aria-label={t('theme.switchTo')}
      >
        {mounted ? (
          isDark ? (
            <Moon className="h-[18px] w-[18px]" />
          ) : (
            <Sun className="h-[18px] w-[18px]" />
          )
        ) : (
          <Sun className="h-[18px] w-[18px] opacity-0" />
        )}
        <span className="sr-only">{t('theme.switchTo')}</span>
      </Button>
    ) : (
      <Button variant="outline" size="sm" className={cn('gap-2', className)}>
        {mounted ? (
          isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />
        ) : (
          <Sun className="h-4 w-4" />
        )}
        {t('theme.label')}
      </Button>
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-44">
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
          {t('theme.label')}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setTheme('light')} className="gap-2">
          <Sun className="h-4 w-4" />
          <span className="flex-1">{t('theme.light')}</span>
          {active === 'light' && <Check className="h-4 w-4 text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')} className="gap-2">
          <Moon className="h-4 w-4" />
          <span className="flex-1">{t('theme.dark')}</span>
          {active === 'dark' && <Check className="h-4 w-4 text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')} className="gap-2">
          <Monitor className="h-4 w-4" />
          <span className="flex-1">{t('theme.system')}</span>
          {active === 'system' && <Check className="h-4 w-4 text-primary" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
