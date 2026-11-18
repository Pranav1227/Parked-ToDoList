import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Plus, Pin, Star, X } from 'lucide-react';
import { useNotes } from '../context/NotesContext';
import { useProjects } from '../context/ProjectsContext';
import { CATEGORY_COLORS, PROJECT_COLORS } from '../constants';

export function PipPortal() {
  const { pipWindow, todayNotes, addNote, toggleNoteDone, togglePipMode } = useNotes();
  const { getProject, lastUsedProjectId } = useProjects();
  const [quickTitle, setQuickTitle] = useState('');

  if (!pipWindow) return null;

  const handleQuickAdd = (e) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    addNote({
      title: quickTitle.trim(),
      doToday: true, // Auto-flags for Today in PiP mode
      priority: 'High',
      category: 'Pending Work',
      project: lastUsedProjectId || null,
      status: 'Pending',
    });

    setQuickTitle('');
  };

  return createPortal(
    <div className="pip-window-body">
      {/* PiP Header */}
      <div className="pip-header">
        <div className="pip-title">
          <Star size={15} className="star-filled" />
          <span>Today's Focus</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="pip-badge">
            {todayNotes.length} {todayNotes.length === 1 ? 'task' : 'tasks'}
          </span>
          <button
            type="button"
            className="icon-btn"
            style={{ width: '24px', height: '24px' }}
            onClick={togglePipMode}
            title="Close Pin window"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Mini Quick Add */}
      <form onSubmit={handleQuickAdd} style={{ display: 'flex', gap: '6px' }}>
        <input
          type="text"
          className="modal-input"
          style={{ height: '32px', fontSize: '13px', padding: '0 8px' }}
          placeholder="Quick park task for today..."
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          autoFocus
        />
        <button
          type="submit"
          className="btn-primary"
          style={{ padding: '0 10px', height: '32px', display: 'flex', alignItems: 'center' }}
          disabled={!quickTitle.trim()}
          title="Add task for today"
        >
          <Plus size={14} />
        </button>
      </form>

      {/* Today's Notes List */}
      <div className="pip-list">
        {todayNotes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 8px', color: 'var(--text-secondary)', fontSize: '12.5px' }}>
            No tasks parked for today. Star notes on your board to see them here.
          </div>
        ) : (
          todayNotes.map((note) => {
            const isDone = note.status === 'Done';
            const catColor = CATEGORY_COLORS[note.category]?.light || '#FFF1A8';
            const project = note.project ? getProject(note.project) : null;
            const projectDot = project
              ? PROJECT_COLORS[project.colorIndex % 8]?.dot || '#64748B'
              : null;

            return (
              <div key={note.id} className={`pip-note-item ${isDone ? 'is-done' : ''}`}>
                <button
                  type="button"
                  className="sticky-checkbox-container"
                  onClick={() => toggleNoteDone(note.id)}
                  title={isDone ? 'Mark as pending' : 'Mark as done'}
                >
                  <div className={`sticky-custom-checkbox ${isDone ? 'checked' : ''}`}>
                    {isDone && <Check size={11} strokeWidth={3} />}
                  </div>
                </button>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className={`pip-note-text ${isDone ? 'struck' : ''}`}>
                    {note.title}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        padding: '1px 5px',
                        borderRadius: '3px',
                        backgroundColor: catColor,
                        color: '#2B2B2B',
                      }}
                    >
                      {note.category}
                    </span>

                    {project && (
                      <span
                        style={{
                          fontSize: '10px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        <span
                          style={{
                            width: '5px',
                            height: '5px',
                            borderRadius: '50%',
                            backgroundColor: projectDot,
                          }}
                        />
                        {project.name}
                      </span>
                    )}

                    {note.dueDate && (
                      <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                        Due {note.dueDate}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>,
    pipWindow.document.body
  );
}
