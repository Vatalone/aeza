# Invoice Keeper — Frontend

SPA для учёта регулярных платежей. Реализовано на React + TypeScript + Vite + Tailwind CSS.

## Запуск

```bash
cd frontend
npm install
npm run dev
```

Production-проверка:

```bash
npm run build
```

## Дополнительные возможности

Помимо базовых ролей, персональной изоляции ledger-записей, календаря и аналитики, добавлены:

- inbox уведомлений с пагинацией, фильтром непрочитанных, mark-read и mark-all-read;
- серверный контракт для bulk-операций над периодами;
- серверный контракт для редактирования регулярного платежа;
- категории, теги, заметки и ссылка на чек у регулярного платежа;
- архивирование регулярных платежей без потери истории;
- CSV-экспорт платежей и аналитики;
- месячный бюджет отдельно для RUB/USD/EUR;
- часовой пояс, дата напоминаний и настройки уведомлений;
- журнал действий пользователя;
- календарь сроков с детализацией дня;
- аналитика трендов и крупнейших расходов;
- поиск и фильтр «требуют внимания» на Dashboard.

## DB-ready API contract

Все новые функции спроектированы через типизированный [`src/api/types.ts`](src/api/types.ts) и API-клиент [`src/api/client.ts`](src/api/client.ts). Mock используется только как локальный fallback в dev-режиме; UI вызывает те же сервисные методы, что и production API.

Ожидаемые новые backend endpoints:

```text
PATCH  /api/v1/recurring-payments/{id}
GET    /api/v1/notifications?page=1&page_size=50&unread_only=true
PATCH  /api/v1/notifications/{id}
POST   /api/v1/notifications/read-all
PATCH  /api/v1/payment-occurrences/bulk
```

Рекомендуемая схема хранения:

- `recurring_payments`: id, owner/created_by, name, amount, currency, category, notes, receipt_url, tags JSON/таблица, archived, periodicity, next_payment_date;
- `payment_occurrences`: id, recurring_payment_id, user_id, due_date, status, actual_payment_date, unique(recurring_payment_id, user_id, due_date);
- `notifications`: id, user_id, occurrence_id nullable, type, title, message, channels JSON, is_read, created_at;
- `notification_preferences`: user_id, reminder_lead_days, timezone, telegram_enabled, email_enabled, weekly_digest_enabled;
- `budgets`: user_id, currency, period (`month`/`year`), limit_amount, starts_at;
- `activity_log`: id, actor_id, action, entity_type, entity_id, metadata JSON, created_at.

Backend должен возвращать те же DTO, что объявлены во frontend types. Для notification list используется:

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "page_size": 50
}
```

## Environment

Скопируйте `.env.example` в `.env`:

- `VITE_API_URL=/api/v1` — базовый URL API;
- `VITE_PROXY_TARGET=http://localhost:8000` — адрес backend в dev;
- `VITE_USE_MOCK=false` — принудительный mock-режим;
- `VITE_ADMIN_USERNAME` — admin username только для demo fallback.

Если backend недоступен в dev, клиент использует mock-адаптер, но production-код остаётся server-first: API-ответы и API-ошибки не подменяются mock-данными.

## Тестовые пользователи mock

- `admin` / `admin` — администратор;
- `ivan` / `ivan` — обычный пользователь;
- `anna` / `anna` — обычный пользователь.

Платежи персонально назначаются пользователям. Статус и фактическая дата периода сохраняются в отдельной записи ledger для каждого `user_id`.
