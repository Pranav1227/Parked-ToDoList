import React from 'react';
import { Check, Edit2, Trash2, Calendar, Star, Bell, SearchX, StickyNote as StickyIcon } from 'lucide-react';
import { CATEGORY_COLORS, PRIORITY_CONFIG, PROJECT_COLORS } from '../constants';
import { useNotes } from '../context/NotesContext';
import { useProjects } from '../context/ProjectsContext';
import { ContextField } from './ContextField';
import { ReminderMenu } from './ReminderMenu';
import { formatReminderDisplay, isReminderDue } from '../utils/reminders';
import { getLocalDateString } from '../utils/dateValidation';

export function ListView() {
  const {
    filteredNotes,
    toggleNoteDone,
    toggleDoToday,
    requestDeleteNote,
    setEditingNote,
    setNoteReminder,
    clearNoteReminder,
    hasActiveFilters,
    resetFilters,
  } = useNotes();

  const { getProject } = useProjects();
  const todayStr = getLocalDateString();

  if (filteredNotes.length === 0) {
    return (
      <div className="empty-state-card" role="status">
        <div className="empty-state-icon">
          {hasActiveFilters ? <SearchX size={26} /> : <StickyIcon size={26} />}
        </div>
        <h3 className="empty-state-title">
          {hasActiveFilters ? 'No matching notes in list' : 'No docked tasks yet'}
        </h3>
        <p className="empty-state-desc">
          {hasActiveFilters
            ? 'Try adjusting or clearing your filters to see more notes.'
            : 'Capture tasks in under 5 seconds using the Quick Add bar above or press Ctrl+K.'}
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
    <div className="list-view-container" role="table" aria-label="Notes List">
      <div className="list-view-header" role="row">
        <span role="columnheader">Done</span>
        <span role="columnheader">Title, Context & Details</span>
        <span role="columnheader">Project</span>
        <span role="columnheader">Category</span>
        <span role="columnheader">Priority</span>
        <span role="columnheader">Due / Reminder</span>
        <span role="columnheader" style={{ textAlign: 'right' }}>Actions</span>
      </div>

      <div role="rowgroup">
        {filteredNotes.map((note) => {
          const isDone = note.status === 'Done';
          const priority = PRIORITY_CONFIG[note.priority] || PRIORITY_CONFIG.Medium;
          const categoryColor = CATEGORY_COLORS[note.category]?.light || '#FFF1A8';

          const project = note.project ? getProject(note.project) : null;
          const projectDotColor = project
            ? PROJECT_COLORS[project.colorIndex % 8]?.dot || '#64748B'
            : null;

          const formattedDueDate = note.dueDate
            ? new Date(note.dueDate + 'T00:00:00').toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })
            : null;

          const isOverdue =
            note.dueDate &&
            !isDone &&
            new Date(note.dueDate + 'T23:59:59').getTime() < Date.now();

          const reminderIsDue = Boolean(note.remindAt) && isReminderDue(note.remindAt) && !isDone;
          const isCarriedOver =
            Boolean(note.doToday) &&
            Boolean(note.doTodayDate) &&
            note.doTodayDate < todayStr &&
            !isDone;

          return (
            <div
              key={note.id}
              className={`list-row ${isDone ? 'is-done' : ''} ${reminderIsDue ? 'reminder-due-row' : ''}`}
              role="row"
            >
              {/* Checkbox */}
              <div role="cell">
                <button
                  type="button"
                  className="sticky-checkbox-container"
                  onClick={() => toggleNoteDone(note.id)}
                  title={isDone ? 'Mark pending' : 'Mark done'}
                  aria-label={isDone ? 'Mark pending' : 'Mark done'}
                >
                  <div className={`sticky-custom-checkbox ${isDone ? 'checked' : ''}`}>
                    {isDone && <Check size={12} strokeWidth={3} />}
                  </div>
                </button>
              </div>

              {/* Title, Context & Details */}
              <div className="list-title-cell" role="cell">
                <div className="list-title-header-line">
                  <span className={`list-title-text ${isDone ? 'struck' : ''}`}>
                    {note.title}
                  </span>

                  {isCarriedOver && (
                    <span className="carried-over-badge list-badge">Carried over</span>
                  )}

                  {reminderIsDue && (
                    <span className="note-reminder-due-badge list-badge">Due</span>
                  )}
                </div>

                {note.details && (
                  <div className="list-details-preview">{note.details}</div>
                )}

                {note.context && (
                  <div className="list-context-wrapper">
                    <ContextField context={note.context} compact />
                  </div>
                )}
              </div>

              {/* Project */}
              <div className="list-meta-cell" role="cell">
                {project ? (
                  <span className="list-project-pill" title={`Project: ${project.name}`}>
                    <span
                      className="project-dot"
                      style={{ backgroundColor: projectDotColor }}
                    />
                    <span>{project.name}</span>
                  </span>
                ) : (
                  <span className="list-no-project">—</span>
                )}
              </div>

              {/* Category */}
              <div className="list-meta-cell" role="cell">
                <span
                  className="category-tag-badge"
                  style={{
                    backgroundColor: categoryColor,
                    color: '#2B2B2B',
                    border: '1px solid rgba(0,0,0,0.08)',
                  }}
                >
                  {note.category}
                </span>
              </div>

              {/* Priority */}
              <div className="list-meta-cell" role="cell">
                <span
                  className="priority-badge"
                  style={{
                    backgroundColor: priority.bgColor,
                    color: priority.color,
                  }}
                >
                  <span
                    className="priority-dot"
                    style={{ backgroundColor: priority.color }}
                  />
                  {priority.label}
                </span>
              </div>

              {/* Due Date & Reminder */}
              <div className="list-meta-cell" role="cell">
                <div className="list-date-stack">
                  {formattedDueDate ? (
                    <span
                      className={`list-due-tag ${isOverdue ? 'overdue-text' : ''}`}
                    >
                      {isOverdue ? `Overdue: ${formattedDueDate}` : formattedDueDate}
                    </span>
                  ) : (
                    <span className="list-no-project">—</span>
                  )}

                  {note.remindAt && (
                    <span className="list-reminder-subtext" title="Reminder set">
                      <Bell size={10} />
                      <span>{formatReminderDisplay(note.remindAt)}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div
                role="cell"
                className="list-actions-cell"
              >
                <button
                  type="button"
                  className={`note-action-icon-btn star-btn ${note.doToday ? 'active' : ''}`}
                  onClick={() => toggleDoToday(note.id)}
                  title={note.doToday ? 'Remove from Today' : 'Do today'}
                >
                  <Star size={13} className={note.doToday ? 'star-filled' : ''} />
                </button>

                <ReminderMenu
                  note={note}
                  onSetReminder={setNoteReminder}
                  onClearReminder={clearNoteReminder}
                />

                <button
                  type="button"
                  className="note-action-icon-btn"
                  onClick={() => setEditingNote(note)}
                  title="Edit note"
                  aria-label="Edit note"
                >
                  <Edit2 size={13} />
                </button>

                <button
                  type="button"
                  className="note-action-icon-btn delete"
                  onClick={() => requestDeleteNote(note)}
                  title="Delete note (requires confirmation)"
                  aria-label="Delete note"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
