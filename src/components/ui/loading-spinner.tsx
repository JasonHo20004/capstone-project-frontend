import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

/**
 * Loading Spinner Component
 * Sử dụng để hiển thị trạng thái loading
 */
export const LoadingSpinner = ({
  size = 'md',
  className,
  text,
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2',
        className
      )}
    >
      <Loader2
        className={cn('animate-spin text-primary', sizeClasses[size])}
      />
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
      )}
    </div>
  );
};

/**
 * Full Page Loading Spinner
 */
export const FullPageLoading = ({ text }: { text?: string }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
      <LoadingSpinner size="lg" text={text || 'Đang tải...'} />
    </div>
  );
};

/**
 * Inline Loading Spinner (cho buttons, etc.)
 */
export const InlineLoading = () => {
  return <LoadingSpinner size="sm" />;
};

