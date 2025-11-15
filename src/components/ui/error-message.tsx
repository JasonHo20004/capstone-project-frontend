import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * Error Message Component
 * Hiển thị thông báo lỗi với khả năng retry
 */
export const ErrorMessage = ({
  title = 'Đã xảy ra lỗi',
  message,
  onRetry,
  className,
}: ErrorMessageProps) => {
  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{message}</span>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="ml-4"
          >
            Thử lại
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};

