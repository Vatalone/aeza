import { useMemo, useState } from 'react';
import { Download, TrendingUp } from 'lucide-react';
import { api } from '@/api/client';
import type { Currency, PaymentOccurrence } from '@/api/types';
import { CURRENCIES, CURRENCY_SYMBOLS } from '@/api/types';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { useSettingsStore } from '@/store/settings';
import { buildMonthTrend, currencyTotal, formatAmount } from '@/lib/finance';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function AnalyticsPage() {
  const occurrences = useAsyncResource<PaymentOccurrence[]>(() => api.occurrences.list(), []);
  const budget = useSettingsStore((state) => state.budget);
  const setBudget = useSettingsStore((state) => state.setBudget);
  const [currency, setCurrency] = useState<Currency>('RUB');
  const rows = occurrences.data ?? [];
  const trends = useMemo(() => buildMonthTrend(rows, currency), [rows, currency]);
  const maxTrend = Math.max(...trends.map((item) => item.amount), 1);
  const planned = currencyTotal(rows, currency);
  const paid = currencyTotal(rows, currency, true);

  return <div className="space-y-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-xl font-semibold text-gray-900">Бюджет и аналитика</h1><p className="text-sm text-gray-500">Плановые расходы, динамика и контроль бюджета</p></div><Button variant="secondary" leftIcon={<Download className="h-4 w-4"/>} onClick={() => { const content = rows.map((r) => `${r.name},${r.amount},${r.currency}`).join('\n'); const blob = new Blob([content], {type:'text/csv'}); const url=URL.createObjectURL(blob); const a=document.createElement('a');a.href=url;a.download='analytics.csv';a.click();URL.revokeObjectURL(url); }}>Экспорт</Button></div>
  <div className="flex gap-2">{CURRENCIES.map((item)=><button type="button" key={item} onClick={()=>setCurrency(item)} className={['rounded-md border px-3 py-1.5 text-sm', currency===item?'border-blue-600 bg-blue-50 text-blue-700':'border-gray-200 text-gray-600'].join(' ')}>{CURRENCY_SYMBOLS[item]} {item}</button>)}</div>
  <div className="grid gap-4 sm:grid-cols-3"><div className="card p-5"><p className="text-xs uppercase tracking-wide text-gray-500">План за периоды</p><p className="mt-2 text-2xl font-semibold text-gray-900">{formatAmount(planned,currency)}</p></div><div className="card p-5"><p className="text-xs uppercase tracking-wide text-gray-500">Оплачено</p><p className="mt-2 text-2xl font-semibold text-green-700">{formatAmount(paid,currency)}</p></div><div className="card p-5"><p className="text-xs uppercase tracking-wide text-gray-500">Бюджет / месяц</p><Input className="mt-2" type="number" min="0" value={budget[currency]} onChange={(e)=>setBudget(currency,Number(e.target.value))}/></div></div>
  <div className="card p-5"><div className="mb-5 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-blue-600"/><h2 className="text-sm font-semibold text-gray-900">Динамика плановых расходов</h2></div><div className="flex h-48 items-end gap-3">{trends.map((item)=><div key={item.label} className="flex flex-1 flex-col items-center gap-2"><span className="text-[11px] text-gray-500">{Math.round(item.amount).toLocaleString('ru-RU')}</span><div className="w-full rounded-t bg-blue-600" style={{height:`${Math.max(8,item.amount/maxTrend*130)}px`}}/><span className="text-xs text-gray-500">{item.label}</span></div>)}</div></div>
  <div className="card overflow-hidden"><div className="border-b border-gray-200 px-5 py-4"><h2 className="text-sm font-semibold text-gray-900">Крупнейшие расходы</h2></div>{rows.filter((r)=>r.currency===currency).sort((a,b)=>b.amount-a.amount).slice(0,5).map((r)=><div key={r.id} className="flex items-center justify-between border-b border-gray-100 px-5 py-3 text-sm last:border-0"><span className="text-gray-700">{r.name}</span><span className="font-medium text-gray-900">{formatAmount(r.amount,r.currency)}</span></div>)}</div>
  </div>;
}
