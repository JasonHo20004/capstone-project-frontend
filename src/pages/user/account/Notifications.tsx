import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Bell, Eye, EyeOff, Filter, Search } from 'lucide-react';
import { mockNotifications } from '@/data/mock';
import { Notification } from '@/types/type';

const STORAGE_KEY_PREFIX = 'skillboost_user_notifications_seen_v1_';

const getCurrentUserId = (): string => {
  const id = localStorage.getItem('currentUserId');
  return id || '1';
};

const loadSeenMap = (userId: string): Record<string, boolean> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + userId);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveSeenMap = (userId: string, map: Record<string, boolean>) => {
  localStorage.setItem(STORAGE_KEY_PREFIX + userId, JSON.stringify(map));
};

const formatDate = (date: string) => {
  try {
    return new Date(date).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return date;
  }
};

const getTypeBadge = (typeName: string) => {
  const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    SYSTEM: { label: 'Hệ thống', variant: 'default' },
    USER: { label: 'Người dùng', variant: 'secondary' },
    ADMIN: { label: 'Quản trị', variant: 'destructive' },
  };
  const info = map[typeName] || { label: typeName, variant: 'outline' };
  return <Badge variant={info.variant}>{info.label}</Badge>;
};

export default function Notifications() {
  const [userId, setUserId] = useState<string>('1');
  const [seenMap, setSeenMap] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unseen' | 'seen'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    const id = getCurrentUserId();
    setUserId(id);
    setSeenMap(loadSeenMap(id));
  }, []);

  const notificationsForUser: Notification[] = useMemo(() => {
    return mockNotifications.filter(n => n.userIds?.includes(userId));
  }, [userId]);

  const typeOptions = useMemo(() => {
    const set = new Set<string>();
    notificationsForUser.forEach(n => set.add(n.notificationType?.name));
    return ['all', ...Array.from(set)];
  }, [notificationsForUser]);

  const computedNotifications = useMemo(() => {
    return notificationsForUser
      .filter(n => {
        const matchesSearch = (n.title + ' ' + n.content).toLowerCase().includes(search.toLowerCase());
        const matchesType = typeFilter === 'all' || n.notificationType?.name === typeFilter;
        const isSeen = seenMap[n.id] ?? n.seen ?? false;
        const matchesStatus =
          statusFilter === 'all' ||
          (statusFilter === 'seen' && isSeen) ||
          (statusFilter === 'unseen' && !isSeen);
        return matchesSearch && matchesType && matchesStatus;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [notificationsForUser, search, typeFilter, statusFilter, seenMap]);

  const unreadCount = useMemo(() => {
    return notificationsForUser.reduce((acc, n) => {
      const isSeen = seenMap[n.id] ?? n.seen ?? false;
      return acc + (isSeen ? 0 : 1);
    }, 0);
  }, [notificationsForUser, seenMap]);

  const markRead = (id: string) => {
    const next = { ...seenMap, [id]: true };
    setSeenMap(next);
    saveSeenMap(userId, next);
  };

  const markUnread = (id: string) => {
    const next = { ...seenMap };
    delete next[id];
    setSeenMap(next);
    saveSeenMap(userId, next);
  };

  const markAllRead = () => {
    const next: Record<string, boolean> = { ...seenMap };
    notificationsForUser.forEach(n => { next[n.id] = true; });
    setSeenMap(next);
    saveSeenMap(userId, next);
  };

  const clearAllSeen = () => {
    setSeenMap({});
    saveSeenMap(userId, {});
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-24">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center shadow-accent">
              <Bell className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-['Be Vietnam Pro']">Thông báo của bạn</h1>
              <p className="text-muted-foreground text-sm">Có {unreadCount} thông báo chưa xem</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={markAllRead}>
              <Eye className="w-4 h-4 mr-2" /> Đánh dấu tất cả đã đọc
            </Button>
            <Button variant="outline" onClick={clearAllSeen}>
              <EyeOff className="w-4 h-4 mr-2" /> Bỏ đánh dấu toàn bộ
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <Filter className="w-4 h-4" />
              <span className="text-sm text-muted-foreground">Bộ lọc</span>
            </div>
            <div className="space-y-3 p-4 border border-border rounded-xl">
              <div>
                <label className="text-sm font-medium">Trạng thái</label>
                <div className="flex gap-2 mt-2">
                  <Button variant={statusFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('all')}>Tất cả</Button>
                  <Button variant={statusFilter === 'unseen' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('unseen')}>Chưa xem</Button>
                  <Button variant={statusFilter === 'seen' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('seen')}>Đã xem</Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Loại</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {typeOptions.map((t) => (
                    <Button key={t} variant={typeFilter === t ? 'default' : 'outline'} size="sm" onClick={() => setTypeFilter(t)}>
                      {t === 'all' ? 'Tất cả' : t}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Tìm kiếm</label>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nhập từ khóa..." className="pl-9" />
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="space-y-3">
              {computedNotifications.length === 0 && (
                <div className="border border-dashed border-border rounded-xl p-8 text-center text-muted-foreground">
                  Không có thông báo phù hợp.
                </div>
              )}

              {computedNotifications.map((n) => {
                const isSeen = seenMap[n.id] ?? n.seen ?? false;
                return (
                  <div key={n.id} className={`border rounded-xl p-4 flex items-start justify-between transition ${isSeen ? 'bg-card' : 'bg-primary/5 border-primary/20'}`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{n.title}</h3>
                        {getTypeBadge(n.notificationType?.name)}
                        {!isSeen && <Badge variant="default">Mới</Badge>}
                      </div>
                      <p className="text-muted-foreground">{n.content}</p>
                      <div className="text-xs text-muted-foreground">{formatDate(n.createdAt)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isSeen ? (
                        <Button variant="outline" size="sm" onClick={() => markUnread(n.id)}>
                          <EyeOff className="w-4 h-4 mr-2" /> Bỏ đánh dấu
                        </Button>
                      ) : (
                        <Button variant="secondary" size="sm" onClick={() => markRead(n.id)}>
                          <Eye className="w-4 h-4 mr-2" /> Đánh dấu đã đọc
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}