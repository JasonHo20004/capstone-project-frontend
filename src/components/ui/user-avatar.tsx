import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  className?: string;
  fallbackClassName?: string;
}

/**
 * Unified avatar — indigo-gradient person-icon fallback used app-wide.
 * Replace bare <Avatar>+<AvatarFallback> with this component everywhere.
 */
export function UserAvatar({ src, name, className, fallbackClassName }: UserAvatarProps) {
  return (
    <Avatar className={className}>
      {src && <AvatarImage src={src} alt={name ?? 'avatar'} className="object-cover" />}
      <AvatarFallback className={cn('bg-gradient-to-br from-indigo-400 to-violet-500', fallbackClassName)}>
        <User className="w-[45%] h-[45%] text-white" strokeWidth={1.5} />
      </AvatarFallback>
    </Avatar>
  );
}
