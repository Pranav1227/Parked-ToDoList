import React, { useState } from 'react';
import { Check, Edit2, Trash2, Calendar, Star, Bell, AlertTriangle } from 'lucide-react';
import { CATEGORY_COLORS, PRIORITY_CONFIG, PROJECT_COLORS } from '../constants';
import { useNotes } from '../context/NotesContext';
import { useProjects } from '../context/ProjectsContext';
import { ContextField } from './ContextField';
import { ReminderMenu } from './ReminderMenu';
import { formatReminderDisplay, isReminderDue } from '../utils/reminders';

export function StickyNote({
  note,
  canReorder = true,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragTarget,
  isDragging,
}) {
  const {
    theme,
    toggleNoteDone,
    toggleDoToday,
    requestDeleteNote,
    setEditingNote,
    setNoteReminder,
    clearNoteReminder,
  } = useNotes();

  const { getProject } = useProjects();
  const [isHovered, setIsHovered] = useState(false);

  const isDone = note.status === 'Done';
  const categoryConfig = CATEGORY_COLORS[note.category] || CATEGORY_COLORS.Idea;
  const paperColor = theme === 'dark' ? categoryConfig.dark : categoryConfig.light;
  const priorityConfig = PRIORITY_CONFIG[note.priority] || PRIORITY_CONFIG.Medium;

  // Project data
  const project = note.project ? getProject(note.project) : null;
  const projectDotColor = project
    ? PROJECT_COLORS[project.colorIndex % 8]?.dot || '#64748B'
    : null;

  // Due date & Overdue check
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

  // Carried over check for today
  const todayStr = new Date().toISOString().split('T')[0];
  const isCarriedOver =
    Boolean(note.doToday) &&
    Boolean(note.doTodayDate) &&
    note.doTodayDate < todayStr &&
    !isDone;

  // Due reminder check
  const reminderIsDue = Boolean(note.remindAt) && isReminderDue(note.remindAt) && !isDone;

  const cardStyle = {
    backgroundColor: paperColor,
    transform: isHovered
      ? `rotate(${note.rotation}deg) translateY(-4px) scale(1.015)`
      : `rotate(${note.rotation}deg)`,
  };

  return (
    <article
      className={`sticky-note-card ${isDone ? 'is-done' : ''} ${
        isDragging ? 'is-dragging' : ''
      } ${isDragTarget ? 'drag-over-target' : ''} ${
        reminderIsDue ? 'reminder-due-card' : ''
      }`}
      style={cardStyle}
      draggable={!isDone && canReorder}
      onDragStart={(e) => onDragStart && onDragStart(e, note.id)}
      onDragOver={(e) => onDragOver && onDragOver(e, note.id)}
      onDrop={(e) => onDrop && onDrop(e, note.id)}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={`Note: ${note.title}`}
    >
      {/* Tape strip at the top */}
      <div className="sticky-tape" aria-hidden="true" />

      {/* Reminder Due notification badge */}
      {reminderIsDue && (
        <div className="note-reminder-due-badge" title="This reminder is due!">
          <Bell size={11} className="bell-shake" />
          <span>Reminder due</span>
        </div>
      )}

      {/* Header with status checkbox, title, and quick actions */}
      <div>
        <div className="sticky-note-header">
          <button
            type="button"
            className="sticky-checkbox-container"
            onClick={(e) => {
              e.stopPropagation();
              toggleNoteDone(note.id);
            }}
            title={isDone ? 'Mark pending' : 'Mark as done'}
            aria-label={isDone ? 'Mark pending' : 'Mark done'}
          >
            <div className={`sticky-custom-checkbox ${isDone ? 'checked' : ''}`}>
              {isDone && <Check size={12} strokeWidth={3} />}
            </div>
          </button>

          <h2
            className={`sticky-note-title ${isDone ? 'struck' : ''}`}
            title={note.title}
          >
            {note.title}
          </h2>

          <div className="sticky-note-actions">
            {/* Do Today star toggle */}
            <button
              type="button"
              className={`note-action-icon-btn star-btn ${note.doToday ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleDoToday(note.id);
              }}
              title={note.doToday ? 'Remove from Today' : 'Do today'}
              aria-label="Toggle Do Today"
            >
              <Star size={13} className={note.doToday ? 'star-filled' : ''} />
            </button>

            {/* Reminder snooze menu */}
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

        {/* Note body details */}
        {note.details && (
          <p className="sticky-note-body">{note.details}</p>
        )}

        {/* Context Field */}
        {note.context && (
          <ContextField context={note.context} compact />
        )}
      </div>

      {/* Footer metadata badges */}
      <footer className="sticky-note-footer">
        <div className="note-badges-left">
          <span className="category-tag-badge">{note.category}</span>

          {/* Project label with color dot */}
          {project && (
            <span className="note-project-tag" title={`Project: ${project.name}`}>
              <span
                className="project-dot"
                style={{ backgroundColor: projectDotColor }}
              />
              <span>{project.name}</span>
            </span>
          )}

          <span
            className="priority-badge"
            style={{
              backgroundColor: priorityConfig.bgColor,
              color: priorityConfig.color,
            }}
          >
            <span
              className="priority-dot"
              style={{ backgroundColor: priorityConfig.color }}
            />
            {priorityConfig.label}
          </span>

          {/* Carried over tag */}
          {isCarriedOver && (
            <span className="carried-over-badge" title="Unfinished from previous day">
              Carried over
            </span>
          )}

          {/* Scheduled reminder bell pill */}
          {note.remindAt && !reminderIsDue && (
            <span className="note-reminder-pill" title={`Reminder: ${formatReminderDisplay(note.remindAt)}`}>
              <Bell size={10} />
              <span>{formatReminderDisplay(note.remindAt)}</span>
            </span>
          )}
        </div>

        <div className="note-dates-right">
          {formattedDueDate && (
            <span
              className={`due-date-tag ${isOverdue ? 'overdue' : ''}`}
              title={isOverdue ? 'Overdue due date' : 'Due date'}
            >
              <Calendar size={11} />
              <span>{isOverdue ? `Overdue: ${formattedDueDate}` : formattedDueDate}</span>
            </span>
          )}
        </div>
      </footer>
    </article>
  );
}
