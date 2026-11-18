import React from 'react';
import { RotateCcw, X } from 'lucide-react';
import { useNotes } from '../context/NotesContext';

export function UndoToast() {
  const { undoItem, undoDelete, dismissUndo } = useNotes();

  if (!undoItem || !undoItem.notes || undoItem.notes.length === 0) return null;

  const count = undoItem.notes.length;
  const label =
    count === 1
      ? `Deleted "${undoItem.notes[0].title.slice(0, 24)}${undoItem.notes[0].title.length > 24 ? '...' : ''}"`
      : `Deleted ${count} notes`;

  return (
    <div className="undo-toast-container" role="status" aria-live="polite">
      <div className="undo-toast">
        <span>{label}</span>
        <button
          type="button"
          className="undo-toast-btn"
          onClick={undoDelete}
          title="Restore deleted items"
        >
          <RotateCcw size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
          Undo
        </button>
        <button
          type="button"
          className="undo-toast-dismiss"
          onClick={dismissUndo}
          title="Dismiss"
          aria-label="Dismiss toast"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
