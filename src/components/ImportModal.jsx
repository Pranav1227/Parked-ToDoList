import React, { useState } from 'react';
import { Upload, AlertCircle, Check, X, FileText } from 'lucide-react';

export function ImportModal({ importData, existingNotes, onConfirm, onCancel }) {
  const [strategy, setStrategy] = useState('merge');

  if (!importData) return null;

  const { notes: newNotes, projects: newProjects, schemaVersion } = importData;
  const existingIds = new Set(existingNotes.map((n) => n.id));
  const duplicateCount = newNotes.filter((n) => existingIds.has(n.id)).length;

  return (
    <div
      className="modal-overlay"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-modal-title"
    >
      <div
        className="delete-confirm-card"
        style={{ maxWidth: '440px', width: '92%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="delete-confirm-close-btn"
          onClick={onCancel}
          aria-label="Cancel import"
        >
          <X size={16} />
        </button>

        <div className="delete-confirm-header">
          <div className="delete-confirm-icon-badge" style={{ backgroundColor: 'var(--accent-light, rgba(20, 110, 80, 0.1))', color: 'var(--accent)' }}>
            <Upload size={22} strokeWidth={2.2} />
          </div>
          <div>
            <h3 id="import-modal-title" className="delete-confirm-title">
              Import Backup
            </h3>
            <p className="delete-confirm-subtitle">
              Format: Schema v{schemaVersion} · {newNotes.length} notes, {newProjects.length} projects
            </p>
          </div>
        </div>

        {duplicateCount > 0 && (
          <div style={{ marginBottom: '16px', padding: '10px 12px', background: 'var(--bg-secondary, #f8fafc)', borderRadius: '6px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              {duplicateCount} existing {duplicateCount === 1 ? 'note shares' : 'notes share'} the same ID
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 10px 0' }}>
              How would you like to handle duplicates?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="import-strategy"
                  value="merge"
                  checked={strategy === 'merge'}
                  onChange={() => setStrategy('merge')}
                />
                <span><strong>Merge & Update</strong> (update matching notes, keep others)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="import-strategy"
                  value="skip"
                  checked={strategy === 'skip'}
                  onChange={() => setStrategy('skip')}
                />
                <span><strong>Skip duplicates</strong> (keep your existing notes as they are)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="import-strategy"
                  value="replace"
                  checked={strategy === 'replace'}
                  onChange={() => setStrategy('replace')}
                />
                <span><strong>Replace everything</strong> (overwrite current desk with backup)</span>
              </label>
            </div>
          </div>
        )}

        <div className="delete-confirm-hint">
          {duplicateCount === 0
            ? `Ready to import ${newNotes.length} notes into your current workspace.`
            : `Selected strategy: ${strategy}`}
        </div>

        <div className="delete-confirm-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => onConfirm(newNotes, newProjects, strategy)}
            autoFocus
          >
            <Check size={14} />
            <span>Confirm Import</span>
          </button>
        </div>
      </div>
    </div>
  );
}
