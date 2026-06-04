import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  /** Optional content rendered on the right side of the header (e.g. filters). */
  headerExtra?: ReactNode;
}

export default function ChartCard({
  title,
  description,
  children,
  className = "",
  headerExtra,
}: ChartCardProps) {
  return (
    <Card className={className}>
      <CardHeader
        className={
          headerExtra
            ? 'flex flex-row items-start justify-between gap-3 space-y-0'
            : undefined
        }
      >
        <div className="space-y-1.5">
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {headerExtra && <div className="shrink-0">{headerExtra}</div>}
      </CardHeader>
      <CardContent className="pl-2">{children}</CardContent>
    </Card>
  );
}