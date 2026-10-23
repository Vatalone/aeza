import {
  MOCK_TOKEN_PREFIX,
  mockCreateRecurringPayment,
  mockCreateUser,
  mockDeleteRecurringPayment,
  mockDeleteUser,
  mockGetOccurrences,
  mockGetRecurringPayments,
  mockGetSummary,
  mockGetUsers,
  mockLogin,
  mockResolveUser,
  mockUpdateOccurrence,
  mockUpdateUser,
} from './mock';
import type {
  BulkOccurrenceUpdatePayload,
  CreateRecurringPaymentPayload,
  CreateUserPayload,
  LoginPayload,
  LoginResponse,
  Notification,
  NotificationQuery,
  PaginatedResponse,
  PaymentOccurrence,
  RecurringPayment,
  Summary,
  UpdateOccurrencePayload,
  UpdateRecurringPaymentPayload,
  UpdateUserPayload,
  User,
} from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';
const FORCE_MOCK = String(import.meta.env.VITE_USE_MOCK).toLowerCase() === 'true';

/**
 * The mock backend is a development aid: in a production build the app talks
 * to the real API only, so a server outage surfaces as a normal error.
 */
const MOCK_ENABLED = FORCE_MOCK || import.meta.env.DEV;

/**
 * Header set by the Vite dev proxy when the upstream API cannot be reached.
 * See `vite.config.ts`.
 */
const BACKEND_UNREACHABLE_HEADER = 'X-Backend-Unreachable';

/** Error thrown by the API client, carrying an HTTP-ish status code. */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type QueryValue = string | number | boolean | undefined | null;

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = `${API_BASE_URL}${path}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    params.append(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

function getAuthToken(): string | null {
  return localStorage.getItem('invoice_keeper_token');
}

/**
 * When the backend is unreachable the client transparently falls back to the
 * built-in mock backend, so the SPA remains usable during local development.
 */
let usingMockBackend = FORCE_MOCK;

export function isUsingMockBackend(): boolean {
  return usingMockBackend;
}

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (typeof payload === 'string' && payload.trim()) return payload;
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    for (const key of ['detail', 'message', 'error', 'non_field_errors']) {
      const value = record[key];
      if (typeof value === 'string' && value.trim()) return value;
      if (Array.isArray(value) && value.length > 0) {
        const first = value[0];
        if (typeof first === 'string') return first;
      }
    }
  }
  return fallback;
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  query?: Record<string, QueryValue>,
): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), { ...init, headers });
  } catch (error) {
    // Network-level failure (backend down / DNS / CORS).
    throw new ApiError(
      `Не удалось связаться с сервером: ${error instanceof Error ? error.message : 'unknown error'}`,
      0,
    );
  }

  const payload = await parseBody(response);

  if (!response.ok) {
    // The dev-server proxy marks an unreachable upstream with this header.
    // Such a response means "backend is down", not "the API returned an error",
    // so it is reported with status 0 and handled by the mock fallback.
    if (response.headers.get(BACKEND_UNREACHABLE_HEADER) === '1') {
      throw new ApiError('Бэкенд недоступен', 0);
    }
    throw new ApiError(
      extractErrorMessage(payload, `Ошибка запроса (${response.status})`),
      response.status,
    );
  }

  return payload as T;
}

async function withMock<T>(realCall: () => Promise<T>, mockCall: () => T): Promise<T> {
  if (FORCE_MOCK) return mockCall();
  try {
    const result = await realCall();
    usingMockBackend = false;
    return result;
  } catch (error) {
    if (MOCK_ENABLED && error instanceof ApiError && error.status === 0) {
      usingMockBackend = true;
      return mockCall();
    }
    throw error;
  }
}

export const api = {
  auth: {
    login: async (payload: LoginPayload): Promise<LoginResponse> =>
      withMock(
        async () => {
          const response = await request<LoginResponse>('/auth/login', {
            method: 'POST',
            body: JSON.stringify(payload),
          });
          if (!response || typeof response.token !== 'string') {
            throw new ApiError('Некорректный ответ сервера при авторизации', 500);
          }
          return response;
        },
        () => mockLogin(payload.username, payload.password),
      ),

    me: async (): Promise<User> =>
      withMock(
        async () => {
          const response = await request<User>('/auth/me', { method: 'GET' });
          if (!response || typeof response.username !== 'string') {
            throw new ApiError('Некорректный ответ сервера', 500);
          }
          return response;
        },
        () => {
          const token = getAuthToken();
          const userId = token?.startsWith(MOCK_TOKEN_PREFIX)
            ? token.slice(MOCK_TOKEN_PREFIX.length).split('|')[0]
            : undefined;
          const found = mockGetUsers().find((u) => u.id === userId) ?? mockGetUsers()[0];
          if (!found) throw new ApiError('Пользователь не найден', 404);
          return found;
        },
      ),

    logout: async (): Promise<void> => {
      try {
        await request<unknown>('/auth/logout', { method: 'POST' });
      } catch {
        // Logging out locally must always succeed, even if the backend is down.
      }
    },
  },

  recurringPayments: {
    list: async (): Promise<RecurringPayment[]> =>
      withMock(
        async () => {
          const response = await request<RecurringPayment[]>('/recurring-payments', {
            method: 'GET',
          });
          return Array.isArray(response) ? response : [];
        },
        () => mockGetRecurringPayments(mockResolveUser(getAuthToken())),
      ),

    update: async (id: string, payload: UpdateRecurringPaymentPayload): Promise<RecurringPayment> =>
      withMock(
        async () => request<RecurringPayment>(`/recurring-payments/${encodeURIComponent(id)}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        }),
        () => {
          throw new ApiError('Обновление регулярных платежей доступно после подключения API', 501);
        },
      ),

    create: async (payload: CreateRecurringPaymentPayload): Promise<RecurringPayment> =>
      withMock(
        async () => {
          const response = await request<RecurringPayment>('/recurring-payments', {
            method: 'POST',
            body: JSON.stringify(payload),
          });
          return response;
        },
        () => mockCreateRecurringPayment(payload),
      ),

    remove: async (id: string): Promise<void> =>
      withMock(
        async () => {
          await request<unknown>(`/recurring-payments/${encodeURIComponent(id)}`, {
            method: 'DELETE',
          });
        },
        () => mockDeleteRecurringPayment(id),
      ),
  },

  occurrences: {
    list: async (): Promise<PaymentOccurrence[]> =>
      withMock(
        async () => {
          const response = await request<PaymentOccurrence[]>('/payment-occurrences', {
            method: 'GET',
          });
          return Array.isArray(response) ? response : [];
        },
        () => mockGetOccurrences(mockResolveUser(getAuthToken())),
      ),

    update: async (id: string, payload: UpdateOccurrencePayload): Promise<PaymentOccurrence> =>
      withMock(
        async () => {
          const response = await request<PaymentOccurrence>(
            `/payment-occurrences/${encodeURIComponent(id)}`,
            { method: 'PATCH', body: JSON.stringify(payload) },
          );
          return response;
        },
        () => mockUpdateOccurrence(id, payload, mockResolveUser(getAuthToken())),
      ),
  },

  notifications: {
    list: async (query?: NotificationQuery): Promise<PaginatedResponse<Notification>> =>
      request<PaginatedResponse<Notification>>('/notifications', { method: 'GET' }, query ? {
        page: query.page,
        page_size: query.page_size,
        unread_only: query.unread_only,
      } : undefined),
    markRead: async (id: string): Promise<Notification> =>
      request<Notification>(`/notifications/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_read: true }),
      }),
    markAllRead: async (): Promise<void> => {
      await request<unknown>('/notifications/read-all', { method: 'POST' });
    },
  },

  bulk: {
    updateOccurrences: async (payload: BulkOccurrenceUpdatePayload): Promise<PaymentOccurrence[]> =>
      request<PaymentOccurrence[]>('/payment-occurrences/bulk', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
  },

  summary: {
    get: async (): Promise<Summary> =>
      withMock(
        async () => {
          const response = await request<Summary>('/payments/summary', { method: 'GET' });
          return {
            RUB: Number(response?.RUB ?? 0),
            USD: Number(response?.USD ?? 0),
            EUR: Number(response?.EUR ?? 0),
          };
        },
        () => mockGetSummary(mockResolveUser(getAuthToken())),
      ),
  },

  users: {
    list: async (): Promise<User[]> =>
      withMock(
        async () => {
          const response = await request<User[]>('/users', { method: 'GET' });
          return Array.isArray(response) ? response : [];
        },
        () => mockGetUsers(),
      ),

    create: async (payload: CreateUserPayload): Promise<User> =>
      withMock(
        async () => {
          const response = await request<User>('/users', {
            method: 'POST',
            body: JSON.stringify(payload),
          });
          return response;
        },
        () => mockCreateUser(payload),
      ),

    update: async (id: string, payload: UpdateUserPayload): Promise<User> =>
      withMock(
        async () => {
          const response = await request<User>(`/users/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
          });
          return response;
        },
        () => mockUpdateUser(id, payload),
      ),

    remove: async (id: string): Promise<void> =>
      withMock(
        async () => {
          await request<unknown>(`/users/${encodeURIComponent(id)}`, { method: 'DELETE' });
        },
        () => mockDeleteUser(id),
      ),
  },
};

export async function bulkUpdateOccurrences(payload: BulkOccurrenceUpdatePayload): Promise<PaymentOccurrence[]> {
  return request<PaymentOccurrence[]>('/payment-occurrences/bulk', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export type Api = typeof api;
