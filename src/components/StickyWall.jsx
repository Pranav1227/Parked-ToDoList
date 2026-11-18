import React, { useState } from 'react';
import { StickyNote } from './StickyNote';
import { useNotes } from '../context/NotesContext';
import { StickyNote as StickyIcon, SearchX } from 'lucide-react';

export function StickyWall() {
  const { filteredNotes, reorderNotes, hasActiveFilters, resetFilters, sortBy } = useNotes();
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  const canReorder = !hasActiveFilters && sortBy === 'order';

  const handleDragStart = (e, id) => {
    if (!canReorder) {
      e.preventDefault();
      return;
    }
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e, id) => {
    if (!canReorder) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverId !== id) {
      setDragOverId(id);
    }
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    if (canReorder && draggedId && targetId && draggedId !== targetId) {
      reorderNotes(draggedId, targetId);
    }
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  if (filteredNotes.length === 0) {
    return (
      <div className="empty-state-card" role="status">
        <div className="empty-state-icon">
          {hasActiveFilters ? <SearchX size={26} /> : <StickyIcon size={26} />}
        </div>
        <h3 className="empty-state-title">
          {hasActiveFilters ? 'No matching notes found' : 'Your desk is clean'}
        </h3>
        <p className="empty-state-desc">
          {hasActiveFilters
            ? 'Try adjusting or clearing your filters to see other parked notes.'
            : 'Got a sudden idea, bug to fix, or pending work to integrate later? Press Ctrl+K or "/" to park it.'}
        </p>
        {hasActiveFilters && (
          <button
            type="button"
            className="btn-secondary"
            onClick={resetFilters}
            style={{ marginTop: '8px' }}
          >
            Clear active filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="sticky-wall-container">
      {!canReorder && (
        <div
          className="reorder-disabled-notice"
          style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            marginBottom: '10px',
            fontStyle: 'italic',
          }}
        >
          Reordering is available when viewing all notes in manual order.
        </div>
      )}
      <div className="sticky-wall-grid" role="region" aria-label="Sticky Notes Board">
        {filteredNotes.map((note) => (
          <StickyNote
            key={note.id}
            note={note}
            canReorder={canReorder}
            onDragStart={canReorder ? handleDragStart : null}
            onDragOver={canReorder ? handleDragOver : null}
            onDrop={canReorder ? handleDrop : null}
            onDragEnd={handleDragEnd}
            isDragTarget={dragOverId === note.id && draggedId !== note.id}
            isDragging={draggedId === note.id}
          />
        ))}
      </div>
    </div>
  );
}
