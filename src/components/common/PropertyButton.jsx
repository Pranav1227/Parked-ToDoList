import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

export const PropertyButton = forwardRef(function PropertyButton(
  {
    icon: Icon,
    dotColor,
    label,
    value,
    isActive = false,
    onClick,
    hasChevron = true,
    className = '',
    title,
    'aria-expanded': ariaExpanded,
    'aria-haspopup': ariaHasPopup,
  },
  ref
) {
  return (
    <button
      ref={ref}
      type="button"
      className={`property-btn ${isActive ? 'active-filled' : ''} ${className}`}
      onClick={onClick}
      title={title || `${label}: ${value}`}
      aria-expanded={ariaExpanded}
      aria-haspopup={ariaHasPopup}
    >
      {Icon && <Icon size={14} className="property-btn-icon" />}
      {dotColor && (
        <span
          className="property-btn-dot"
          style={{ backgroundColor: dotColor }}
          aria-hidden="true"
        />
      )}
      <span className="property-btn-text">
        {value || label}
      </span>
      {hasChevron && <ChevronDown size={12} className="property-btn-chevron" />}
    </button>
  );
});
