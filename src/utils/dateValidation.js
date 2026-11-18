/**
 * Date and time validation utilities with strict timezone-safe local handling.
 */

export function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getLocalTimeString(date = new Date()) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function getNextFiveMinutes(date = new Date()) {
  const d = new Date(date);
  const ms = 1000 * 60 * 5;
  return new Date(Math.ceil(d.getTime() / ms) * ms);
}

export function isPastDate(dateStr) {
  if (!dateStr) return false;
  const todayStr = getLocalDateString();
  return dateStr < todayStr;
}

export function isPastDateTime(dateStr, timeStr) {
  if (!dateStr) return false;
  const todayStr = getLocalDateString();
  if (dateStr < todayStr) return true;
  if (dateStr > todayStr) return false;

  if (!timeStr) return false;
  const now = new Date();
  const [hours, minutes] = timeStr.split(':').map(Number);
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);

  return target.getTime() <= now.getTime();
}

export function validateReminderDateTime(dateStr, timeStr, dueDateStr = '') {
  if (!dateStr || !timeStr) {
    return { valid: false, error: 'Please choose both a date and a time' };
  }

  const todayStr = getLocalDateString();
  if (dateStr < todayStr) {
    return { valid: false, error: 'Reminder date cannot be in the past' };
  }

  const now = new Date();
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return { valid: false, error: 'Invalid time format' };
  }

  const targetDate = new Date(`${dateStr}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);
  if (isNaN(targetDate.getTime())) {
    return { valid: false, error: 'Invalid date or time' };
  }

  if (targetDate.getTime() <= now.getTime()) {
    return { valid: false, error: 'Reminder time must be in the future' };
  }

  let warning = null;
  if (dueDateStr) {
    const dueEnd = new Date(`${dueDateStr}T23:59:59`);
    if (!isNaN(dueEnd.getTime()) && targetDate.getTime() > dueEnd.getTime()) {
      warning = 'Reminder is after the due date';
    }
  }

  return {
    valid: true,
    isoString: targetDate.toISOString(),
    warning,
  };
}

export function getQuickReminderPresets() {
  const now = new Date();
  const todayStr = getLocalDateString(now);
  const presets = [];

  // 1. Later today (+3 hours) - only if +3h is still today
  const laterToday = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  if (getLocalDateString(laterToday) === todayStr) {
    presets.push({
      id: 'later-today',
      label: 'Later today (+3 hrs)',
      isoString: laterToday.toISOString(),
      available: true,
    });
  } else {
    presets.push({
      id: 'later-today',
      label: 'Later today (+3 hrs)',
      isoString: null,
      available: false,
      reason: 'Past remaining hours today',
    });
  }

  // 2. Tomorrow 9:00 AM
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  presets.push({
    id: 'tomorrow-morning',
    label: 'Tomorrow 9:00 AM',
    isoString: tomorrow.toISOString(),
    available: tomorrow.getTime() > now.getTime(),
  });

  // 3. Next Monday 9:00 AM
  const day = now.getDay();
  const daysUntilMonday = ((1 + 7 - day) % 7) || 7;
  const nextMonday = new Date(now);
  nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
  nextMonday.setHours(9, 0, 0, 0);
  presets.push({
    id: 'next-monday',
    label: 'Next Monday 9:00 AM',
    isoString: nextMonday.toISOString(),
    available: nextMonday.getTime() > now.getTime(),
  });

  return presets;
}
