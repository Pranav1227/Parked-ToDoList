import React, { useEffect, useState } from 'react';
import { X, Trash2, Clock, Calendar, Bell, Star } from 'lucide-react';
import { CATEGORY_COLORS, PRIORITY_CONFIG } from '../constants';
import { useNotes } from '../context/NotesContext';
import { NoteForm } from './NoteForm';
import { formatReminderDisplay } from '../utils/reminders';

function formatCreatedDate(isoString) {
  if (!isoString) return 'Created recently';
  try {
    const d = new Date(isoString);
    const datePart = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const timePart = d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return `Created ${datePart}, ${timePart}`;
  } catch {
    return 'Created recently';
  }
}

export function EditNoteModal({ onRequestPermission }) {
  const {
    editingNote,
    setEditingNote,
    updateNote,
    requestDeleteNote,
    theme,
  } = useNotes();

  const [activeCategory, setActiveCategory] = useState(editingNote?.category || 'Idea');

  useEffect(() => {
    if (editingNote) {
      setActiveCategory(editingNote.category || 'Idea');
    }
  }, [editingNote]);

  // Handle ESC key to close dialog
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        // Let any open popover inside handle escape first if active
        const hasOpenPopover = document.querySelector('.custom-popover-panel');
        if (!hasOpenPopover) {
          setEditingNote(null);
        }
      }
    }
    if (editingNote) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingNote, setEditingNote]);

  if (!editingNote) return null;

  const categoryConfig = CATEGORY_COLORS[activeCategory] || CATEGORY_COLORS.Idea;
  const bannerBgColor = theme === 'dark' ? categoryConfig.dark : categoryConfig.light;
  const priorityConfig = PRIORITY_CONFIG[editingNote.priority] || PRIORITY_CONFIG.Medium;

  const handleSave = (updatedFields) => {
    updateNote(editingNote.id, updatedFields);
    setEditingNote(null);
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-heading"
    >
      <div
        className="modal-content-card edit-note-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Category-colored sticky note banner */}
        <div
          className="modal-sticky-banner"
          style={{ backgroundColor: bannerBgColor }}
        >
          {/* Centered desk tape */}
          <div className="modal-sticky-tape" aria-hidden="true" />

          {/* Category Pill Tag (uppercase) */}
          <div className="modal-banner-category-badge">
            {activeCategory.toUpperCase()}
          </div>

          {/* Creation date & time */}
          <div className="modal-banner-date">
            <Clock size={13} strokeWidth={2} />
            <span>{formatCreatedDate(editingNote.createdAt)}</span>
          </div>
        </div>

        {/* Modal Inner Body */}
        <div className="modal-inner-body">
          {/* Sub-header row: Priority & Status Badges + Action Buttons */}
          <div className="modal-sub-header-row">
            <div className="modal-sub-badges-left">
              <span
                className="modal-sub-badge priority-sub-badge"
                style={{
                  color: priorityConfig.color,
                  borderColor: priorityConfig.borderColor,
                  backgroundColor: priorityConfig.bgColor,
                }}
              >
                <span
                  className="priority-dot"
                  style={{ backgroundColor: priorityConfig.color }}
                />
                <span>{editingNote.priority} Priority</span>
              </span>

              <span className="modal-sub-badge status-sub-badge">
                Status: {editingNote.status}
              </span>
            </div>

            <div className="modal-sub-actions-right">
              <button
                type="button"
                className="modal-action-icon-btn delete"
                onClick={() => requestDeleteNote(editingNote)}
                title="Delete note (requires confirmation)"
                aria-label="Delete note"
              >
                <Trash2 size={16} />
              </button>
              <button
                type="button"
                className="modal-action-icon-btn close"
                onClick={() => setEditingNote(null)}
                title="Close editor (Esc)"
                aria-label="Close dialog"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          {/* Shared NoteForm in edit mode */}
          <NoteForm
            mode="edit"
            initialNote={editingNote}
            onSubmit={handleSave}
            onCancel={() => setEditingNote(null)}
            onCategoryChange={setActiveCategory}
            onRequestPermission={onRequestPermission}
          />
        </div>
      </div>
    </div>
  );
}
