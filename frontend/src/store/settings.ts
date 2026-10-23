import type { Currency } from '@/api/types';
import { DEFAULT_TIMEZONE } from '@/lib/date';
import { create } from 'zustand';

export type Theme = 'light' | 'system';
export type BudgetPeriod = 'month' | 'year';

export interface BudgetSettings {
  RUB: number;
  USD: number;
  EUR: number;
}

export interface ActivityEntry {
  id: string;
  action: string;
  details: string;
  timestamp: string;
}

interface SettingsState {
  reminderLeadDays: number;
  timeZone: string;
  displayCurrency: Currency;
  notificationsEnabled: boolean;
  weeklyDigestEnabled: boolean;
  theme: Theme;
  budget: BudgetSettings;
  yearlyBudget: BudgetSettings;
  budgetPeriod: BudgetPeriod;
  cashBalance: BudgetSettings;
  activity: ActivityEntry[];
  setSettings: (patch: Partial<Omit<SettingsState, 'activity' | 'setSettings' | 'addActivity' | 'resetSettings' | 'setBudget' | 'setCashBalance'>>) => void;
  setBudget: (currency: Currency, value: number) => void;
  setYearlyBudget: (currency: Currency, value: number) => void;
  setCashBalance: (currency: Currency, value: number) => void;
  addActivity: (action: string, details: string) => void;
  resetSettings: () => void;
}

const STORAGE_KEY = 'invoice_keeper_settings';
const DEFAULT_SETTINGS = {
  reminderLeadDays: 3,
  timeZone: DEFAULT_TIMEZONE,
  displayCurrency: 'RUB' as Currency,
  notificationsEnabled: true,
  weeklyDigestEnabled: false,
  theme: 'light' as Theme,
  budgetPeriod: 'month' as BudgetPeriod,
  budget: { RUB: 100000, USD: 500, EUR: 500 },
  yearlyBudget: { RUB: 1_200_000, USD: 6_000, EUR: 6_000 },
  cashBalance: { RUB: 150000, USD: 1000, EUR: 1000 },
  activity: [] as ActivityEntry[],
};

type PersistedSettings = Partial<typeof DEFAULT_SETTINGS>;

function readSettings(): typeof DEFAULT_SETTINGS {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_SETTINGS;
  try {
    const parsed = JSON.parse(raw) as PersistedSettings;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      budget: { ...DEFAULT_SETTINGS.budget, ...parsed.budget },
      yearlyBudget: { ...DEFAULT_SETTINGS.yearlyBudget, ...parsed.yearlyBudget },
      cashBalance: { ...DEFAULT_SETTINGS.cashBalance, ...parsed.cashBalance },
      activity: Array.isArray(parsed.activity) ? parsed.activity.slice(0, 100) : [],
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function persist(state: Pick<SettingsState, 'reminderLeadDays' | 'timeZone' | 'displayCurrency' | 'notificationsEnabled' | 'weeklyDigestEnabled' | 'theme' | 'budgetPeriod' | 'budget' | 'yearlyBudget' | 'cashBalance' | 'activity'>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export const useSettingsStore = create<SettingsState>((set) => ({
  ...readSettings(),
  setSettings: (patch) => {
    set((state) => {
      const next = { ...state, ...patch };
      persist(next);
      return next;
    });
  },
  setBudget: (currency, value) => {
    set((state) => {
      const next = { ...state, budget: { ...state.budget, [currency]: Math.max(0, value) } };
      persist(next);
      return next;
    });
  },
  setYearlyBudget: (currency, value) => {
    set((state) => {
      const next = { ...state, yearlyBudget: { ...state.yearlyBudget, [currency]: Math.max(0, value) } };
      persist(next);
      return next;
    });
  },
  setCashBalance: (currency, value) => {
    set((state) => {
      const next = { ...state, cashBalance: { ...state.cashBalance, [currency]: Math.max(0, value) } };
      persist(next);
      return next;
    });
  },
  addActivity: (action, details) => {
    set((state) => {
      const entry: ActivityEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        action,
        details,
        timestamp: new Date().toISOString(),
      };
      const next = { ...state, activity: [entry, ...state.activity].slice(0, 100) };
      persist(next);
      return next;
    });
  },
  resetSettings: () => {
    localStorage.removeItem(STORAGE_KEY);
    set(DEFAULT_SETTINGS);
  },
}));

export const TIMEZONE_OPTIONS = [
  { value: 'Europe/Moscow', label: 'Москва (UTC+3)' },
  { value: 'Asia/Yekaterinburg', label: 'Екатеринбург (UTC+5)' },
  { value: 'Asia/Novosibirsk', label: 'Новосибирск (UTC+7)' },
  { value: 'Asia/Vladivostok', label: 'Владивосток (UTC+10)' },
  { value: 'Europe/London', label: 'Лондон' },
  { value: 'Europe/Berlin', label: 'Берлин' },
  { value: 'America/New_York', label: 'Нью-Йорк' },
  { value: 'UTC', label: 'UTC' },
] as const;
