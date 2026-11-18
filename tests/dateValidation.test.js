import { describe, it, expect } from 'vitest';
import {
  getLocalDateString,
  getLocalTimeString,
  getNextFiveMinutes,
  isPastDate,
  isPastDateTime,
  validateReminderDateTime,
  getQuickReminderPresets,
} from '../src/utils/dateValidation';

describe('Date and Time Validation', () => {
  it('getLocalDateString returns YYYY-MM-DD using local timezone without UTC offset shift', () => {
    const fixedDate = new Date(2026, 10, 18, 23, 45); // Nov 18, 2026, 23:45 local
    expect(getLocalDateString(fixedDate)).toBe('2026-11-18');
  });

  it('getLocalTimeString returns HH:MM in 24h format', () => {
    const fixedDate = new Date(2026, 10, 18, 9, 5);
    expect(getLocalTimeString(fixedDate)).toBe('09:05');
  });

  it('getNextFiveMinutes rounds up to the next 5-minute interval', () => {
    const d1 = new Date(2026, 10, 18, 14, 2, 10);
    const rounded1 = getNextFiveMinutes(d1);
    expect(rounded1.getMinutes()).toBe(5);
    expect(rounded1.getSeconds()).toBe(0);

    const d2 = new Date(2026, 10, 18, 14, 5, 0);
    const rounded2 = getNextFiveMinutes(d2);
    expect(rounded2.getMinutes()).toBe(5);

    const d3 = new Date(2026, 10, 18, 14, 57, 30);
    const rounded3 = getNextFiveMinutes(d3);
    expect(rounded3.getHours()).toBe(15);
    expect(rounded3.getMinutes()).toBe(0);
  });

  it('isPastDate correctly detects past dates based on local calendar day', () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    expect(isPastDate(getLocalDateString(yesterday))).toBe(true);
    expect(isPastDate(getLocalDateString(today))).toBe(false);
    expect(isPastDate(getLocalDateString(tomorrow))).toBe(false);
  });

  it('isPastDateTime rejects past times today and past dates', () => {
    const todayStr = getLocalDateString();
    const pastTime = '00:01';
    // If today is tested with a time 10 hours ago:
    const now = new Date();
    const pastH = String(Math.max(0, now.getHours() - 2)).padStart(2, '0');
    if (now.getHours() >= 2) {
      expect(isPastDateTime(todayStr, `${pastH}:00`)).toBe(true);
    }

    // Future date should not be past regardless of time
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    expect(isPastDateTime(getLocalDateString(futureDate), '09:00')).toBe(false);
  });

  it('validateReminderDateTime returns error for past dates or times', () => {
    const resPastDate = validateReminderDateTime('2020-01-01', '09:00');
    expect(resPastDate.valid).toBe(false);
    expect(resPastDate.error).toMatch(/past/i);
  });

  it('validateReminderDateTime validates future dates successfully', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 2);
    const dateStr = getLocalDateString(futureDate);
    const res = validateReminderDateTime(dateStr, '10:00');
    expect(res.valid).toBe(true);
    expect(res.isoString).toBeDefined();
    expect(res.warning).toBeNull();
  });

  it('validateReminderDateTime emits a soft warning when reminder is after due date', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    const reminderDateStr = getLocalDateString(futureDate);

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 2);
    const dueDateStr = getLocalDateString(dueDate);

    const res = validateReminderDateTime(reminderDateStr, '10:00', dueDateStr);
    expect(res.valid).toBe(true);
    expect(res.warning).toBe('Reminder is after the due date');
  });

  it('getQuickReminderPresets returns structured presets with available flags', () => {
    const presets = getQuickReminderPresets();
    expect(presets.length).toBe(3);
    const tomorrowPreset = presets.find((p) => p.id === 'tomorrow-morning');
    expect(tomorrowPreset).toBeDefined();
    expect(tomorrowPreset.available).toBe(true);

    const mondayPreset = presets.find((p) => p.id === 'next-monday');
    expect(mondayPreset).toBeDefined();
    expect(mondayPreset.available).toBe(true);
  });
});
