import React, { useState, useRef } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import { Popover } from './Popover';

export function FilterDropdown({
  label,
  options = [],
  selectedValues = [],
  onToggle,
  onClear,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);

  const selectedCount = selectedValues.length;
  const isActive = selectedCount > 0;

  return (
    <div className="filter-dropdown-anchor">
      <button
        ref={triggerRef}
        type="button"
        className={`filter-dropdown-btn ${isActive ? 'active-filter' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <span>{label}</span>
        {isActive && (
          <span className="filter-count-badge">{selectedCount}</span>
        )}
        <ChevronDown size={12} className="filter-chevron" />
      </button>

      <Popover
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        triggerRef={triggerRef}
        className="menu-popover filter-popover"
      >
        <div className="popover-header-row">
          <span className="popover-header-title">{label}</span>
          {isActive && (
            <button
              type="button"
              className="popover-clear-btn"
              onClick={() => onClear && onClear()}
            >
              Clear
            </button>
          )}
        </div>

        <div className="popover-options-list multi-select-list">
          {options.map((opt) => {
            const isChecked = selectedValues.includes(opt.id);
            return (
              <label
                key={opt.id}
                className={`popover-checkbox-row ${isChecked ? 'checked' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(opt.id);
                }}
              >
                <div className={`custom-checkbox-box ${isChecked ? 'checked' : ''}`}>
                  {isChecked && <Check size={11} strokeWidth={3} />}
                </div>

                {opt.dotColor && (
                  <span
                    className="checkbox-option-dot"
                    style={{ backgroundColor: opt.dotColor }}
                    aria-hidden="true"
                  />
                )}

                <span className="checkbox-option-label">{opt.label}</span>

                {typeof opt.count === 'number' && (
                  <span className="checkbox-option-count">{opt.count}</span>
                )}
              </label>
            );
          })}
        </div>
      </Popover>
    </div>
  );
}
