import { useMemo, useState } from 'react';
import { Bell, CheckCheck, Filter } from 'lucide-react';
import { api } from '@/api/client';
import type { Notification, PaginatedResponse } from '@/api/types';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

const EMPTY_PAGE: PaginatedResponse<Notification> = {
  items: [],
  total: 0,
  page: 1,
  page_size: 20,
};

export function NotificationsPage() {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const resource = useAsyncResource<PaginatedResponse<Notification>>(
    () => api.notifications.list({ unread_only: unreadOnly, page: 1, page_size: 50 }),
    [unreadOnly],
  );
  const page = resource.data ?? EMPTY_PAGE;
  const unreadCount = useMemo(() => page.items.filter((item) => !item.is_read).length, [page.items]);

  const markRead = async (notification: Notification) => {
    await api.notifications.markRead(notification.id);
    resource.refresh();
  };

  const markAllRead = async () => {
    await api.notifications.markAllRead();
    resource.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Уведомления</h1>
          <p className="text-sm text-gray-500">Напоминания, просрочки и события аккаунта</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant={unreadOnly ? 'primary' : 'secondary'} onClick={() => setUnreadOnly((value) => !value)} leftIcon={<Filter className="h-4 w-4" />}>
            Только непрочитанные{unreadCount > 0 ? ` (${unreadCount})` : ''}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => void markAllRead()} leftIcon={<CheckCheck className="h-4 w-4" />}>
            Прочитать все
          </Button>
        </div>
      </div>
      <div className="card overflow-hidden">
        {resource.isLoading ? <div className="p-12 text-center text-sm text-gray-500">Загрузка уведомлений…</div> : null}
        {resource.error ? <div className="p-12 text-center text-sm text-red-600">{resource.error}</div> : null}
        {!resource.isLoading && !resource.error && page.items.length === 0 ? <div className="p-12 text-center text-sm text-gray-500">Новых уведомлений нет</div> : null}
        {!resource.isLoading && !resource.error ? page.items.map((item) => (
          <div key={item.id} className={['flex gap-4 border-b border-gray-100 px-5 py-4 last:border-0', item.is_read ? '' : 'bg-blue-50/40'].join(' ')}>
            <div className="mt-0.5 rounded-full border border-gray-200 bg-white p-2"><Bell className="h-4 w-4 text-blue-600" /></div>
            <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold text-gray-900">{item.title}</p>{!item.is_read ? <Badge variant="info">Новое</Badge> : null}</div><p className="mt-1 text-sm text-gray-600">{item.message}</p><p className="mt-2 text-xs text-gray-400">{new Date(item.created_at).toLocaleString('ru-RU')} · каналы: {item.channels.join(', ')}</p></div>
            {!item.is_read ? <Button size="sm" variant="ghost" onClick={() => void markRead(item)}>Прочитано</Button> : null}
          </div>
        )) : null}
      </div>
    </div>
  );
}
