import { getLocalDateString, getQuickReminderPresets } from './dateValidation';

export function getLaterToday() {
  const presets = getQuickReminderPresets();
  const later = presets.find((p) => p.id === 'later-today');
  return later?.available ? later.isoString : null;
}

export function getTomorrowMorning() {
  const presets = getQuickReminderPresets();
  const tomorrow = presets.find((p) => p.id === 'tomorrow-morning');
  return tomorrow?.isoString || null;
}

export function getNextMondayMorning() {
  const presets = getQuickReminderPresets();
  const monday = presets.find((p) => p.id === 'next-monday');
  return monday?.isoString || null;
}

export function isReminderDue(remindAt) {
  if (!remindAt) return false;
  const t = new Date(remindAt).getTime();
  return !isNaN(t) && t <= Date.now();
}

export function formatReminderDisplay(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';

  const now = new Date();
  const todayStr = getLocalDateString(now);

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const tomorrowStr = getLocalDateString(tomorrow);

  const dDateStr = getLocalDateString(d);
  const timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  if (dDateStr === todayStr) return `Today ${timeStr}`;
  if (dDateStr === tomorrowStr) return `Tomorrow ${timeStr}`;
  return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${timeStr}`;
}
