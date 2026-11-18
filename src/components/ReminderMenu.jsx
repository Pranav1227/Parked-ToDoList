import React, { useState, useRef, useEffect } from 'react';
import { Bell, Clock, Calendar, Check, X, AlertCircle } from 'lucide-react';
import { formatReminderDisplay } from '../utils/reminders';
import {
  getLocalDateString,
  getLocalTimeString,
  getNextFiveMinutes,
  getQuickReminderPresets,
  validateReminderDateTime
} from '../utils/dateValidation';

export function ReminderMenu({ note, onSetReminder, onClearReminder, onRequestPermission, align = 'right' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('09:00');
  const [customError, setCustomError] = useState('');
  const [customWarning, setCustomWarning] = useState('');
  const menuRef = useRef(null);

  const presets = getQuickReminderPresets();
  const todayStr = getLocalDateString();
  const minTimeForToday = customDate === todayStr ? getLocalTimeString(getNextFiveMinutes()) : '00:00';

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
        setIsCustomMode(false);
        setCustomError('');
        setCustomWarning('');
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleApplyPreset = async (isoString) => {
    if (!isoString) return;
    if (onRequestPermission) {
      await onRequestPermission();
    }
    onSetReminder(note.id, isoString);
    setIsOpen(false);
    setIsCustomMode(false);
  };

  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    const result = validateReminderDateTime(customDate, customTime, note.dueDate);
    if (!result.valid) {
      setCustomError(result.error);
      return;
    }

    if (onRequestPermission) {
      await onRequestPermission();
    }

    onSetReminder(note.id, result.isoString);
    setIsOpen(false);
    setIsCustomMode(false);
    setCustomError('');
    setCustomWarning('');
  };

  const openCustomMode = () => {
    const nextFive = getNextFiveMinutes();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setCustomDate(getLocalDateString(tomorrow));
    setCustomTime('09:00');
    setCustomError('');
    setCustomWarning('');
    setIsCustomMode(true);
  };

  const handleDateChange = (newDate) => {
    setCustomDate(newDate);
    setCustomError('');
    if (newDate === todayStr) {
      const minT = getLocalTimeString(getNextFiveMinutes());
      if (customTime < minT) {
        setCustomTime(minT);
      }
    }
    if (newDate && customTime) {
      const res = validateReminderDateTime(newDate, customTime, note.dueDate);
      setCustomWarning(res.warning || '');
    }
  };

  const handleTimeChange = (newTime) => {
    setCustomTime(newTime);
    setCustomError('');
    if (customDate && newTime) {
      const res = validateReminderDateTime(customDate, newTime, note.dueDate);
      setCustomWarning(res.warning || '');
    }
  };

  const hasReminder = Boolean(note.remindAt);

  return (
    <div className="reminder-menu-container" ref={menuRef} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className={`note-action-icon-btn reminder-trigger ${hasReminder ? 'has-reminder' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        title={hasReminder ? `Reminder set for ${formatReminderDisplay(note.remindAt)}` : 'Set a reminder'}
        aria-label="Set reminder"
      >
        <Bell size={13} className={hasReminder ? 'bell-active' : ''} />
      </button>

      {isOpen && (
        <div className={`reminder-dropdown-panel align-${align}`} role="dialog" aria-label="Reminder options">
          <div className="reminder-dropdown-header">
            <span className="reminder-dropdown-title">Remind me</span>
            <button
              type="button"
              className="reminder-close-btn"
              onClick={() => {
                setIsOpen(false);
                setIsCustomMode(false);
                setCustomError('');
                setCustomWarning('');
              }}
              aria-label="Close"
            >
              <X size={12} />
            </button>
          </div>

          {!isCustomMode ? (
            <div className="reminder-options-list">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={`reminder-option-btn ${!preset.available ? 'disabled' : ''}`}
                  onClick={() => preset.available && handleApplyPreset(preset.isoString)}
                  disabled={!preset.available}
                  title={preset.reason || ''}
                >
                  {preset.id === 'later-today' ? <Clock size={13} /> : <Calendar size={13} />}
                  <span>{preset.label}</span>
                </button>
              ))}

              <button
                type="button"
                className="reminder-option-btn"
                onClick={openCustomMode}
              >
                <Clock size={13} />
                <span>Pick date and time...</span>
              </button>

              {hasReminder && (
                <>
                  <div className="reminder-divider" />
                  <button
                    type="button"
                    className="reminder-option-btn clear"
                    onClick={() => {
                      onClearReminder(note.id);
                      setIsOpen(false);
                    }}
                  >
                    <X size={13} />
                    <span>Remove reminder</span>
                  </button>
                </>
              )}
            </div>
          ) : (
            <form onSubmit={handleCustomSubmit} className="reminder-custom-form">
              <div className="custom-input-group">
                <label className="custom-input-label">Date</label>
                <input
                  type="date"
                  className="modal-input custom-date-field"
                  value={customDate}
                  min={todayStr}
                  onChange={(e) => handleDateChange(e.target.value)}
                  required
                />
              </div>

              <div className="custom-input-group">
                <label className="custom-input-label">Time</label>
                <input
                  type="time"
                  className="modal-input custom-time-field"
                  value={customTime}
                  min={minTimeForToday}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  required
                />
              </div>

              {customError && (
                <div className="reminder-error-text">
                  <AlertCircle size={12} />
                  <span>{customError}</span>
                </div>
              )}

              {customWarning && (
                <div className="reminder-warning-text" style={{ fontSize: '11px', color: 'var(--amber, #d97706)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                  <AlertCircle size={12} />
                  <span>{customWarning}</span>
                </div>
              )}

              <div className="reminder-custom-actions">
                <button
                  type="button"
                  className="btn-secondary reminder-back-btn"
                  onClick={() => {
                    setIsCustomMode(false);
                    setCustomError('');
                    setCustomWarning('');
                  }}
                >
                  Back
                </button>
                <button type="submit" className="btn-primary reminder-set-btn">
                  Set
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
