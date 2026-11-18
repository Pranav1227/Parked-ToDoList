import React, { useRef, useState } from 'react';
import { Calendar, X, Clock } from 'lucide-react';
import { PropertyButton } from './PropertyButton';
import { Popover } from './Popover';

function formatDateLabel(isoDate) {
  if (!isoDate) return 'No date';
  try {
    const [year, month, day] = isoDate.split('-');
    const date = new Date(year, month - 1, day);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);
    const isTomorrow =
      date.getDate() === tomorrow.getDate() &&
      date.getMonth() === tomorrow.getMonth() &&
      date.getFullYear() === tomorrow.getFullYear();

    if (isToday) return 'Today';
    if (isTomorrow) return 'Tomorrow';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return isoDate;
  }
}

export function DatePickerPopover({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const triggerRef = useRef(null);

  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const getTomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const getNextWeekStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  };

  const handleSelect = (dateStr) => {
    onChange(dateStr);
    setIsOpen(false);
    setShowCustomInput(false);
    triggerRef.current?.focus();
  };

  const handleClear = () => {
    onChange('');
    setIsOpen(false);
    setShowCustomInput(false);
    triggerRef.current?.focus();
  };

  const isSet = Boolean(value);

  return (
    <div className="property-popover-anchor">
      <PropertyButton
        ref={triggerRef}
        icon={Calendar}
        label="Due date"
        value={formatDateLabel(value)}
        isActive={isSet}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      />

      <Popover
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setShowCustomInput(false);
        }}
        triggerRef={triggerRef}
        className="menu-popover date-popover"
      >
        <div className="popover-header-title">Due date</div>

        <div className="popover-options-list">
          <button
            type="button"
            className={`popover-option-item ${value === getTodayStr() ? 'selected' : ''}`}
            onClick={() => handleSelect(getTodayStr())}
          >
            <Clock size={14} className="option-icon" />
            <span>Today</span>
          </button>

          <button
            type="button"
            className={`popover-option-item ${value === getTomorrowStr() ? 'selected' : ''}`}
            onClick={() => handleSelect(getTomorrowStr())}
          >
            <Clock size={14} className="option-icon" />
            <span>Tomorrow</span>
          </button>

          <button
            type="button"
            className={`popover-option-item ${value === getNextWeekStr() ? 'selected' : ''}`}
            onClick={() => handleSelect(getNextWeekStr())}
          >
            <Calendar size={14} className="option-icon" />
            <span>Next week</span>
          </button>

          <div className="popover-divider" />

          {!showCustomInput ? (
            <button
              type="button"
              className="popover-option-item"
              onClick={() => setShowCustomInput(true)}
            >
              <Calendar size={14} className="option-icon" />
              <span>Pick date...</span>
            </button>
          ) : (
            <div className="popover-custom-date-container">
              <input
                type="date"
                className="custom-popover-date-field"
                value={value || ''}
                onChange={(e) => handleSelect(e.target.value)}
                autoFocus
              />
            </div>
          )}

          {isSet && (
            <>
              <div className="popover-divider" />
              <button
                type="button"
                className="popover-option-item clear-option"
                onClick={handleClear}
              >
                <X size={14} className="option-icon" />
                <span>No date</span>
              </button>
            </>
          )}
        </div>
      </Popover>
    </div>
  );
}
