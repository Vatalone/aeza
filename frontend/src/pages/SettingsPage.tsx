import { useState } from 'react';
import { Bell, RotateCcw, Save, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useSettingsStore, TIMEZONE_OPTIONS } from '@/store/settings';
import { CURRENCIES, CURRENCY_SYMBOLS } from '@/api/types';
import { formatDate } from '@/lib/date';

export function SettingsPage() {
  const settings = useSettingsStore();
  const [saved, setSaved] = useState(false);
  const save = () => { settings.addActivity('Изменены настройки', 'Настройки интерфейса и уведомлений'); setSaved(true); setTimeout(()=>setSaved(false),1800); };
  return <div className="space-y-6"><div><h1 className="text-xl font-semibold text-gray-900">Настройки</h1><p className="text-sm text-gray-500">Часовой пояс, напоминания и персональные предпочтения</p></div>
    <div className="grid gap-6 lg:grid-cols-2"><section className="card p-5"><div className="mb-5 flex items-center gap-2"><Bell className="h-4 w-4 text-blue-600"/><h2 className="text-sm font-semibold text-gray-900">Уведомления</h2></div><div className="space-y-4"><Input label="Напоминать за (дней)" type="number" min="0" max="30" value={settings.reminderLeadDays} onChange={(e)=>settings.setSettings({reminderLeadDays:Number(e.target.value)})}/><label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={settings.notificationsEnabled} onChange={(e)=>settings.setSettings({notificationsEnabled:e.target.checked})} className="h-4 w-4 text-blue-600"/>Включить уведомления</label><label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={settings.weeklyDigestEnabled} onChange={(e)=>settings.setSettings({weeklyDigestEnabled:e.target.checked})} className="h-4 w-4 text-blue-600"/>Еженедельный дайджест</label></div></section><section className="card p-5"><div className="mb-5 flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-blue-600"/><h2 className="text-sm font-semibold text-gray-900">Региональные настройки</h2></div><div className="space-y-4"><Select label="Часовой пояс" options={[...TIMEZONE_OPTIONS]} value={settings.timeZone} onChange={(e)=>settings.setSettings({timeZone:e.target.value})}/><Select label="Основная валюта отображения" options={CURRENCIES.map((c)=>({value:c,label:`${CURRENCY_SYMBOLS[c]} ${c}`}))} value={settings.displayCurrency} onChange={(e)=>settings.setSettings({displayCurrency:e.target.value as typeof settings.displayCurrency})}/></div></section></div>
    <div className="flex gap-2"><Button onClick={save} leftIcon={<Save className="h-4 w-4"/>}>{saved?'Сохранено':'Сохранить настройки'}</Button><Button variant="secondary" onClick={settings.resetSettings} leftIcon={<RotateCcw className="h-4 w-4"/>}>Сбросить</Button></div>
    <section className="card overflow-hidden"><div className="border-b border-gray-200 px-5 py-4"><h2 className="text-sm font-semibold text-gray-900">Журнал действий</h2></div>{settings.activity.length===0?<p className="px-5 py-8 text-sm text-gray-500">Действий пока нет</p>:settings.activity.slice(0,10).map((item)=><div key={item.id} className="flex justify-between gap-4 border-b border-gray-100 px-5 py-3 text-sm last:border-0"><div><p className="font-medium text-gray-800">{item.action}</p><p className="text-xs text-gray-500">{item.details}</p></div><time className="whitespace-nowrap text-xs text-gray-400">{formatDate(item.timestamp)}</time></div>)}</section>
  </div>;
}
