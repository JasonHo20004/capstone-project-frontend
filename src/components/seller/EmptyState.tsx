import { Button } from '@/components/ui/button';

interface Props {
  icon: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-slate-700 text-base">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 mt-1 max-w-sm">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button className="mt-4 rounded-xl" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
