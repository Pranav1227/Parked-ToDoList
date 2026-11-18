import React, { useState, useRef } from 'react';
import { PropertyButton } from './PropertyButton';
import { Popover } from './Popover';
import { Check } from 'lucide-react';

export function SelectPopover({
  label,
  value,
  options = [],
  onChange,
  icon: Icon,
  placeholder = 'Select...',
  isNonDefault = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);

  const selectedOption = options.find((o) => o.id === value);
  const displayLabel = selectedOption?.label || placeholder;
  const dotColor = selectedOption?.dotColor;

  const handleSelect = (id) => {
    onChange(id);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div className="property-popover-anchor">
      <PropertyButton
        ref={triggerRef}
        icon={Icon}
        dotColor={dotColor}
        label={label}
        value={displayLabel}
        isActive={isNonDefault}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      />

      <Popover
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        triggerRef={triggerRef}
        className="menu-popover select-popover"
      >
        <div className="popover-header-title">{label}</div>

        <div className="popover-options-list" role="listbox">
          {options.map((opt) => {
            const isSelected = opt.id === value;
            return (
              <button
                key={opt.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`popover-option-item ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelect(opt.id)}
              >
                {opt.dotColor && (
                  <span
                    className="option-dot"
                    style={{ backgroundColor: opt.dotColor }}
                    aria-hidden="true"
                  />
                )}
                <span className="option-label-text">{opt.label}</span>
                {isSelected && <Check size={13} className="option-check-icon" />}
              </button>
            );
          })}
        </div>
      </Popover>
    </div>
  );
}
