import React from 'react';
import { Bell, Clock, Check, X } from 'lucide-react';
import { getLaterToday, getTomorrowMorning } from '../utils/reminders';

export function ReminderBanner({
  dueReminders,
  onSnooze,
  onDismiss,
  onMarkDone,
  permission = 'default',
  onRequestPermission,
}) {
  if (!dueReminders || dueReminders.length === 0) return null;

  return (
    <div className="reminder-banner-wrapper" role="region" aria-label="Due reminders banner">
      <div className="reminder-banner-content">
        <div className="reminder-banner-left">
          <div className="reminder-banner-bell-badge">
            <Bell size={16} strokeWidth={2.5} />
          </div>
          <div className="reminder-banner-info">
            <span className="reminder-banner-title">
              {dueReminders.length === 1 ? 'Reminder due' : `${dueReminders.length} reminders due`}
            </span>
            <span className="reminder-banner-subtitle">
              {dueReminders.map((n) => n.title).slice(0, 2).join(' · ')}
              {dueReminders.length > 2 ? ` (+${dueReminders.length - 2} more)` : ''}
            </span>
          </div>
        </div>

        <div className="reminder-banner-actions">
          {permission !== 'granted' && onRequestPermission && (
            <button
              type="button"
              className="reminder-banner-btn"
              onClick={onRequestPermission}
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-text)',
                fontWeight: 600,
                border: 'none',
              }}
              title="Allow browser notifications to get Windows desktop alerts even when away"
            >
              <Bell size={13} />
              <span>Enable Desktop Alerts</span>
            </button>
          )}

          {dueReminders.length === 1 && (
            <button
              type="button"
              className="reminder-banner-btn done"
              onClick={() => onMarkDone(dueReminders[0].id)}
              title="Mark as done"
            >
              <Check size={13} />
              <span>Done</span>
            </button>
          )}

          <button
            type="button"
            className="reminder-banner-btn snooze"
            onClick={() => {
              const later = getLaterToday();
              dueReminders.forEach((n) => onSnooze(n.id, later));
            }}
            title="Snooze 3 hours"
          >
            <Clock size={13} />
            <span>+3 hrs</span>
          </button>

          <button
            type="button"
            className="reminder-banner-btn snooze"
            onClick={() => {
              const tomorrow = getTomorrowMorning();
              dueReminders.forEach((n) => onSnooze(n.id, tomorrow));
            }}
            title="Snooze until tomorrow morning"
          >
            <Clock size={13} />
            <span>Tomorrow</span>
          </button>

          <button
            type="button"
            className="reminder-banner-dismiss"
            onClick={() => {
              dueReminders.forEach((n) => onDismiss(n.id));
            }}
            title="Dismiss notice"
            aria-label="Dismiss reminders banner"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
