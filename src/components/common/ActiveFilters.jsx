import React from 'react';
import { X } from 'lucide-react';

export function ActiveFilters({ chips = [], onClearAll }) {
  if (!chips || chips.length === 0) return null;

  return (
    <div className="active-filters-line" role="region" aria-label="Active filters">
      <div className="active-chips-scroll">
        <span className="active-filters-title">Filtered by:</span>

        {chips.map((chip) => (
          <div key={chip.id} className="active-filter-chip">
            {chip.dotColor && (
              <span
                className="chip-dot"
                style={{ backgroundColor: chip.dotColor }}
                aria-hidden="true"
              />
            )}
            <span className="chip-label">{chip.label}</span>
            <button
              type="button"
              className="chip-remove-btn"
              onClick={chip.onRemove}
              title={`Remove ${chip.label} filter`}
              aria-label={`Remove ${chip.label} filter`}
            >
              <X size={11} />
            </button>
          </div>
        ))}

        <button
          type="button"
          className="active-clear-all-btn"
          onClick={onClearAll}
          title="Clear all active filters"
        >
          Clear all
        </button>
      </div>
    </div>
  );
}
