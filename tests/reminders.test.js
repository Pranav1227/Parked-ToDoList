import { describe, it, expect } from 'vitest';
import {
  getLaterToday,
  getTomorrowMorning,
  getNextMondayMorning,
  isReminderDue,
  formatReminderDisplay,
} from '../src/utils/reminders';
import { getLocalDateString } from '../src/utils/dateValidation';

describe('Reminders Utilities', () => {
  it('getLaterToday returns an ISO string approximately 3 hours in the future (or null late at night)', () => {
    const iso = getLaterToday();
    if (iso !== null) {
      const diffHours = (new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60);
      expect(diffHours).toBeGreaterThan(2.9);
      expect(diffHours).toBeLessThan(3.1);
    } else {
      expect(iso).toBeNull();
    }
  });

  it('getTomorrowMorning returns tomorrow at 9:00 AM local time', () => {
    const iso = getTomorrowMorning();
    const target = new Date(iso);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    expect(getLocalDateString(target)).toBe(getLocalDateString(tomorrow));
    expect(target.getHours()).toBe(9);
    expect(target.getMinutes()).toBe(0);
  });

  it('getNextMondayMorning returns a future Monday at 9:00 AM local time', () => {
    const iso = getNextMondayMorning();
    const target = new Date(iso);
    expect(target.getDay()).toBe(1); // Monday is 1
    expect(target.getHours()).toBe(9);
    expect(target.getMinutes()).toBe(0);
    expect(target.getTime()).toBeGreaterThan(Date.now());
  });

  it('isReminderDue correctly determines if an ISO timestamp is reached or overdue', () => {
    const past = new Date(Date.now() - 60000).toISOString();
    const future = new Date(Date.now() + 600000).toISOString();

    expect(isReminderDue(past)).toBe(true);
    expect(isReminderDue(future)).toBe(false);
    expect(isReminderDue(null)).toBe(false);
    expect(isReminderDue('')).toBe(false);
  });

  it('formatReminderDisplay produces human-readable labels', () => {
    const now = new Date();
    const todayTarget = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 30);
    expect(formatReminderDisplay(todayTarget.toISOString())).toContain('Today');

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    expect(formatReminderDisplay(tomorrow.toISOString())).toContain('Tomorrow');

    expect(formatReminderDisplay(null)).toBe('');
  });
});
