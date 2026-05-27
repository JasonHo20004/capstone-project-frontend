import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
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
        aria-label="Đổi giao diện"
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
        <span className="sr-only">Đổi giao diện</span>
      </Button>
    ) : (
      <Button variant="outline" size="sm" className={cn('gap-2', className)}>
        {mounted ? (
          isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />
        ) : (
          <Sun className="h-4 w-4" />
        )}
        Giao diện
      </Button>
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-44">
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
          Giao diện
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setTheme('light')} className="gap-2">
          <Sun className="h-4 w-4" />
          <span className="flex-1">Sáng</span>
          {active === 'light' && <Check className="h-4 w-4 text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')} className="gap-2">
          <Moon className="h-4 w-4" />
          <span className="flex-1">Tối</span>
          {active === 'dark' && <Check className="h-4 w-4 text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')} className="gap-2">
          <Monitor className="h-4 w-4" />
          <span className="flex-1">Theo hệ thống</span>
          {active === 'system' && <Check className="h-4 w-4 text-primary" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
