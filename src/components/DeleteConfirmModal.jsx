import React, { useEffect } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { useNotes } from '../context/NotesContext';

export function DeleteConfirmModal() {
  const { deleteConfirmNote, confirmDeleteNote, cancelDeleteNote } = useNotes();

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        cancelDeleteNote();
      } else if (e.key === 'Enter') {
        confirmDeleteNote();
      }
    }

    if (deleteConfirmNote) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteConfirmNote, cancelDeleteNote, confirmDeleteNote]);

  if (!deleteConfirmNote) return null;

  return (
    <div
      className="modal-overlay delete-confirm-overlay"
      onClick={cancelDeleteNote}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-confirm-title"
    >
      <div
        className="delete-confirm-card"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="delete-confirm-close-btn"
          onClick={cancelDeleteNote}
          aria-label="Cancel deletion"
        >
          <X size={16} />
        </button>

        <div className="delete-confirm-header">
          <div className="delete-confirm-icon-badge">
            <Trash2 size={22} strokeWidth={2.2} />
          </div>
          <div>
            <h3 id="delete-confirm-title" className="delete-confirm-title">
              Delete this note?
            </h3>
            <p className="delete-confirm-subtitle">
              This will remove the note from your active board.
            </p>
          </div>
        </div>

        <div className="delete-confirm-preview">
          <p className="delete-confirm-note-title">
            "{deleteConfirmNote.title}"
          </p>
          {deleteConfirmNote.details && (
            <p className="delete-confirm-note-details">
              {deleteConfirmNote.details}
            </p>
          )}
        </div>

        <div className="delete-confirm-hint">
          Don't worry — an <strong>Undo</strong> button will be available for 6 seconds after deletion.
        </div>

        <div className="delete-confirm-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={cancelDeleteNote}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-danger-delete"
            onClick={confirmDeleteNote}
            autoFocus
          >
            <Trash2 size={14} />
            <span>Yes, Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
