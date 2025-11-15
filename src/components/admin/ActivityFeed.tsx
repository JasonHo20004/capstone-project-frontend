import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface ActivityFeedProps {
  title?: string;
  description?: string;
  activities: ActivityItem[];
}

const getActivityColor = (type: ActivityItem['type']) => {
  switch (type) {
    case 'info':
      return 'bg-blue-600';
    case 'success':
      return 'bg-green-600';
    case 'warning':
      return 'bg-yellow-600';
    case 'error':
      return 'bg-red-600';
    default:
      return 'bg-gray-600';
  }
};

export default function ActivityFeed({ 
  title = "Hoạt động gần đây", 
  description = "Các sự kiện quan trọng trong hệ thống",
  activities 
}: ActivityFeedProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-center space-x-4">
            <div className={`flex h-2 w-2 rounded-full ${getActivityColor(activity.type)}`}></div>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium leading-none">
                {activity.title}
              </p>
              <p className="text-sm text-muted-foreground">
                {activity.description} - {activity.timestamp}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}