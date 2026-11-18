import React, { useState, useRef } from 'react';
import { Bell, Clock, Calendar, X, AlertCircle, AlertTriangle, Check } from 'lucide-react';
import { PropertyButton } from './PropertyButton';
import { Popover } from './Popover';
import { formatReminderDisplay } from '../../utils/reminders';
import {
  getLocalDateString,
  getLocalTimeString,
  getNextFiveMinutes,
  getQuickReminderPresets,
  validateReminderDateTime,
} from '../../utils/dateValidation';

export function ReminderPopover({
  value,
  onChange,
  dueDate = '',
  onRequestPermission,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('09:00');
  const [customError, setCustomError] = useState('');
  const [customWarning, setCustomWarning] = useState('');
  const triggerRef = useRef(null);

  const presets = getQuickReminderPresets();
  const todayStr = getLocalDateString();
  const minTimeForToday = customDate === todayStr ? getLocalTimeString(getNextFiveMinutes()) : '00:00';

  const handleApplyPreset = async (isoString) => {
    if (!isoString) return;
    if (onRequestPermission) {
      await onRequestPermission();
    }
    onChange(isoString);
    setIsOpen(false);
    setIsCustomMode(false);
    triggerRef.current?.focus();
  };

  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    const result = validateReminderDateTime(customDate, customTime, dueDate);
    if (!result.valid) {
      setCustomError(result.error);
      return;
    }

    if (onRequestPermission) {
      await onRequestPermission();
    }

    onChange(result.isoString);
    setIsOpen(false);
    setIsCustomMode(false);
    setCustomError('');
    setCustomWarning('');
    triggerRef.current?.focus();
  };

  const handleClear = () => {
    onChange(null);
    setIsOpen(false);
    setIsCustomMode(false);
    setCustomError('');
    setCustomWarning('');
    triggerRef.current?.focus();
  };

  const openCustomMode = () => {
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
      const res = validateReminderDateTime(newDate, customTime, dueDate);
      setCustomWarning(res.warning || '');
    }
  };

  const handleTimeChange = (newTime) => {
    setCustomTime(newTime);
    setCustomError('');
    if (customDate && newTime) {
      const res = validateReminderDateTime(customDate, newTime, dueDate);
      setCustomWarning(res.warning || '');
    }
  };

  const isSet = Boolean(value);
  const displayLabel = isSet ? formatReminderDisplay(value) : 'No reminder';

  return (
    <div className="property-popover-anchor">
      <PropertyButton
        ref={triggerRef}
        icon={Bell}
        label="Reminder"
        value={displayLabel}
        isActive={isSet}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      />

      <Popover
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setIsCustomMode(false);
          setCustomError('');
          setCustomWarning('');
        }}
        triggerRef={triggerRef}
        className="menu-popover reminder-popover"
        align="left"
      >
        <div className="popover-header-title">Reminder</div>

        {!isCustomMode ? (
          <div className="popover-options-list">
            {presets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={`popover-option-item ${!preset.available ? 'disabled' : ''}`}
                onClick={() => preset.available && handleApplyPreset(preset.isoString)}
                disabled={!preset.available}
                title={preset.reason || ''}
              >
                {preset.id === 'later-today' ? (
                  <Clock size={14} className="option-icon" />
                ) : (
                  <Calendar size={14} className="option-icon" />
                )}
                <span>{preset.label}</span>
              </button>
            ))}

            <div className="popover-divider" />

            <button
              type="button"
              className="popover-option-item"
              onClick={openCustomMode}
            >
              <Clock size={14} className="option-icon" />
              <span>Pick date and time...</span>
            </button>

            {isSet && (
              <>
                <div className="popover-divider" />
                <button
                  type="button"
                  className="popover-option-item clear-option"
                  onClick={handleClear}
                >
                  <X size={14} className="option-icon" />
                  <span>Remove reminder</span>
                </button>
              </>
            )}
          </div>
        ) : (
          <form onSubmit={handleCustomSubmit} className="popover-custom-form" style={{ padding: '4px' }}>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Date
              </label>
              <input
                type="date"
                className="custom-popover-date-field"
                value={customDate}
                min={todayStr}
                onChange={(e) => handleDateChange(e.target.value)}
                required
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Time
              </label>
              <input
                type="time"
                className="custom-popover-date-field"
                value={customTime}
                min={minTimeForToday}
                onChange={(e) => handleTimeChange(e.target.value)}
                required
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            {customError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '11px', marginBottom: '8px' }}>
                <AlertCircle size={12} />
                <span>{customError}</span>
              </div>
            )}

            {customWarning && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--amber, #d97706)', fontSize: '11px', marginBottom: '8px' }}>
                <AlertTriangle size={12} />
                <span>{customWarning}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '6px' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '4px 10px', fontSize: '12px' }}
                onClick={() => {
                  setIsCustomMode(false);
                  setCustomError('');
                  setCustomWarning('');
                }}
              >
                Back
              </button>
              <button
                type="submit"
                className="btn-primary"
                style={{ padding: '4px 12px', fontSize: '12px' }}
              >
                Set
              </button>
            </div>
          </form>
        )}
      </Popover>
    </div>
  );
}
