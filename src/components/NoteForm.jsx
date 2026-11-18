import React, { useState, useEffect, useRef } from 'react';
import {
  CornerDownLeft,
  Star,
  ChevronDown,
  ChevronUp,
  Compass,
  Link2,
  Calendar,
  Bell,
  X,
  AlertTriangle,
  AlertCircle,
  Plus,
  Check,
} from 'lucide-react';
import {
  CATEGORIES,
  CATEGORY_COLORS,
  PRIORITIES,
  PRIORITY_CONFIG,
  PROJECT_COLORS,
  STATUSES,
} from '../constants';
import { useProjects } from '../context/ProjectsContext';
import { SelectPopover } from './common/SelectPopover';
import { DatePickerPopover } from './common/DatePickerPopover';
import { PropertyButton } from './common/PropertyButton';
import { ReminderPopover } from './common/ReminderPopover';
import { formatReminderDisplay } from '../utils/reminders';
import {
  getLocalDateString,
  isPastDate,
  validateReminderDateTime,
} from '../utils/dateValidation';

const TITLE_MAX_LENGTH = 120;
const DETAILS_MAX_LENGTH = 2000;
const CONTEXT_TEXT_MAX_LENGTH = 200;
const CONTEXT_LINK_MAX_LENGTH = 500;

export function NoteForm({
  mode = 'create',
  initialNote = null,
  onSubmit,
  onCancel,
  inputRef,
  isExpanded = false,
  onToggleExpanded,
  showPropertyRow = true,
  onRequestPermission,
  onCategoryChange,
}) {
  const { projects, lastUsedProjectId, setLastUsedProjectId } = useProjects();

  // Form states pre-filled from initialNote if in edit mode
  const [title, setTitle] = useState(() => initialNote?.title || '');
  const [details, setDetails] = useState(() => initialNote?.details || '');
  const [category, setCategory] = useState(() => initialNote?.category || 'Idea');
  const [priority, setPriority] = useState(() => initialNote?.priority || 'Medium');
  const [status, setStatus] = useState(() => initialNote?.status || 'Pending');
  const [selectedProjectId, setSelectedProjectId] = useState(
    () => (initialNote ? initialNote.project : lastUsedProjectId)
  );
  const [contextText, setContextText] = useState(() => initialNote?.context?.text || '');
  const [contextLink, setContextLink] = useState(() => initialNote?.context?.link || '');
  const [doToday, setDoToday] = useState(() => Boolean(initialNote?.doToday));
  const [dueDate, setDueDate] = useState(() => initialNote?.dueDate || '');
  const [remindAt, setRemindAt] = useState(() => initialNote?.remindAt || null);

  // Validation & feedback state
  const [inlineError, setInlineError] = useState('');
  const [inlineWarning, setInlineWarning] = useState('');
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const isSubmittingRef = useRef(false);
  const detailsRef = useRef(null);

  // Track initial values to detect unsaved changes
  const initialValuesRef = useRef({
    title: initialNote?.title || '',
    details: initialNote?.details || '',
    category: initialNote?.category || 'Idea',
    priority: initialNote?.priority || 'Medium',
    status: initialNote?.status || 'Pending',
    project: initialNote?.project || null,
    contextText: initialNote?.context?.text || '',
    contextLink: initialNote?.context?.link || '',
    doToday: Boolean(initialNote?.doToday),
    dueDate: initialNote?.dueDate || '',
    remindAt: initialNote?.remindAt || null,
  });

  // Re-sync when initialNote changes in edit mode
  useEffect(() => {
    if (initialNote && mode === 'edit') {
      setTitle(initialNote.title || '');
      setDetails(initialNote.details || '');
      setCategory(initialNote.category || 'Idea');
      setPriority(initialNote.priority || 'Medium');
      setStatus(initialNote.status || 'Pending');
      setSelectedProjectId(initialNote.project || null);
      setContextText(initialNote.context?.text || '');
      setContextLink(initialNote.context?.link || '');
      setDoToday(Boolean(initialNote.doToday));
      setDueDate(initialNote.dueDate || '');
      setRemindAt(initialNote.remindAt || null);
      setInlineError('');
      setInlineWarning('');

      initialValuesRef.current = {
        title: initialNote.title || '',
        details: initialNote.details || '',
        category: initialNote.category || 'Idea',
        priority: initialNote.priority || 'Medium',
        status: initialNote.status || 'Pending',
        project: initialNote.project || null,
        contextText: initialNote.context?.text || '',
        contextLink: initialNote.context?.link || '',
        doToday: Boolean(initialNote.doToday),
        dueDate: initialNote.dueDate || '',
        remindAt: initialNote.remindAt || null,
      };
    }
  }, [initialNote, mode]);

  // Has meaningful content been typed into create form?
  const hasEnteredContent = Boolean(
    title.trim() ||
    details.trim() ||
    contextText.trim() ||
    contextLink.trim() ||
    dueDate ||
    remindAt
  );

  // Is the form dirty? (BUG-09: create mode doesn't trigger ghost discard on empty content)
  const isDirty = mode === 'create'
    ? hasEnteredContent
    : (
        title !== initialValuesRef.current.title ||
        details !== initialValuesRef.current.details ||
        category !== initialValuesRef.current.category ||
        priority !== initialValuesRef.current.priority ||
        status !== initialValuesRef.current.status ||
        selectedProjectId !== initialValuesRef.current.project ||
        contextText !== initialValuesRef.current.contextText ||
        contextLink !== initialValuesRef.current.contextLink ||
        doToday !== initialValuesRef.current.doToday ||
        dueDate !== initialValuesRef.current.dueDate ||
        remindAt !== initialValuesRef.current.remindAt
      );

  // Global Ctrl+Enter / Cmd+Enter handler for forms & textareas (BUG-06)
  const handleFormKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleFormSubmit(e);
    }
  };

  // Real-time check: reminder vs due date warning
  useEffect(() => {
    if (remindAt && dueDate) {
      const targetTime = new Date(remindAt).getTime();
      const dueEndTime = new Date(`${dueDate}T23:59:59`).getTime();
      if (!isNaN(targetTime) && !isNaN(dueEndTime) && targetTime > dueEndTime) {
        setInlineWarning('Reminder is after the due date');
      } else {
        setInlineWarning('');
      }
    } else {
      setInlineWarning('');
    }
  }, [remindAt, dueDate]);

  const handleTitleChange = (e) => {
    const val = e.target.value.slice(0, TITLE_MAX_LENGTH);
    setTitle(val);
    if (inlineError) setInlineError('');
  };

  const handleCategoryChange = (newCat) => {
    setCategory(newCat);
    if (onCategoryChange) {
      onCategoryChange(newCat);
    }
  };

  const handleDetailsChange = (e) => {
    const val = e.target.value.slice(0, DETAILS_MAX_LENGTH);
    setDetails(val);
    if (detailsRef.current) {
      detailsRef.current.style.height = 'auto';
      detailsRef.current.style.height = `${Math.max(76, detailsRef.current.scrollHeight)}px`;
    }
  };

  const handleContextTextChange = (e) => {
    setContextText(e.target.value.slice(0, CONTEXT_TEXT_MAX_LENGTH));
  };

  const handleContextLinkChange = (e) => {
    setContextLink(e.target.value.slice(0, CONTEXT_LINK_MAX_LENGTH));
  };

  const handleDueDateChange = (newDateStr) => {
    if (newDateStr && isPastDate(newDateStr)) {
      if (mode !== 'edit' || newDateStr !== initialNote?.dueDate) {
        setInlineError('Due date cannot be in the past');
        return;
      }
    }
    setDueDate(newDateStr);
    setInlineError('');
  };

  const handleSetReminder = (idOrIso, maybeIso) => {
    const isoString = typeof maybeIso === 'string' ? maybeIso : idOrIso;
    if (!isoString) {
      setRemindAt(null);
      return;
    }
    const t = new Date(isoString).getTime();
    if (isNaN(t) || t <= Date.now()) {
      setInlineError('Reminder time must be in the future');
      return;
    }
    setRemindAt(isoString);
    setInlineError('');
  };

  const handleClearReminder = () => {
    setRemindAt(null);
  };

  const handleFormSubmit = (e) => {
    if (e) e.preventDefault();

    if (isSubmittingRef.current) return;

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setInlineError('Please enter a note title');
      return;
    }

    if (remindAt) {
      const targetTime = new Date(remindAt).getTime();
      if (isNaN(targetTime) || targetTime <= Date.now()) {
        setInlineError('Reminder time has already passed. Please choose a future time.');
        return;
      }
    }

    if (dueDate && mode === 'create' && isPastDate(dueDate)) {
      setInlineError('Due date cannot be in the past');
      return;
    }

    isSubmittingRef.current = true;

    const hasContext = contextText.trim() || contextLink.trim();

    // BUG-05: If status is Done, cancel active reminder and archive into savedRemindAt
    const isDone = status === 'Done';
    const finalRemindAt = isDone ? null : (remindAt || null);
    const finalSavedRemindAt = isDone
      ? (remindAt || initialNote?.savedRemindAt || null)
      : null;
    const finalCompletedAt = isDone
      ? (initialNote?.completedAt || new Date().toISOString())
      : null;

    const payload = {
      ...(initialNote || {}),
      title: trimmedTitle,
      details: details.trim(),
      category,
      priority,
      status,
      project: selectedProjectId || null,
      context: hasContext ? { text: contextText.trim(), link: contextLink.trim() } : null,
      doToday,
      dueDate: dueDate || '',
      remindAt: finalRemindAt,
      savedRemindAt: finalSavedRemindAt,
      completedAt: finalCompletedAt,
      reminderFired:
        finalRemindAt && finalRemindAt !== initialNote?.remindAt
          ? false
          : Boolean(initialNote?.reminderFired && finalRemindAt),
    };

    if (selectedProjectId) {
      setLastUsedProjectId(selectedProjectId);
    }

    try {
      if (onSubmit) {
        onSubmit(payload);
      }
      if (mode === 'create') {
        setTitle('');
        setDetails('');
        setContextText('');
        setContextLink('');
        setDoToday(false);
        setDueDate('');
        setRemindAt(null);
        setInlineError('');
        setInlineWarning('');
        if (detailsRef.current) {
          detailsRef.current.style.height = 'auto';
        }
        // BUG-09: Update initialValuesRef after submit to prevent ghost discard dialogs
        initialValuesRef.current = {
          title: '',
          details: '',
          category,
          priority,
          status: 'Pending',
          project: selectedProjectId || null,
          contextText: '',
          contextLink: '',
          doToday: false,
          dueDate: '',
          remindAt: null,
        };
      }
    } finally {
      setTimeout(() => {
        isSubmittingRef.current = false;
      }, 300);
    }
  };

  const handleKeyDownInTitle = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleFormSubmit(e);
    }
  };

  const handleAttemptClose = () => {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      if (onCancel) onCancel();
    }
  };

  // Popover options
  const categoryOptions = CATEGORIES.map((cat) => ({
    id: cat,
    label: cat,
    dotColor: CATEGORY_COLORS[cat]?.light || '#FFF1A8',
  }));

  const priorityOptions = PRIORITIES.map((p) => ({
    id: p,
    label: p,
    dotColor: PRIORITY_CONFIG[p]?.color,
  }));

  const statusOptions = STATUSES.map((st) => ({
    id: st,
    label: st,
  }));

  const projectOptions = [
    { id: '', label: 'No project', dotColor: null },
    ...projects.map((proj) => ({
      id: proj.id,
      label: proj.name,
      dotColor: PROJECT_COLORS[proj.colorIndex % 8]?.dot || '#64748B',
    })),
  ];

  /* =========================================================================
     CREATE MODE (Quick Add Bar)
     ========================================================================= */
  if (mode === 'create') {
    return (
      <form onSubmit={handleFormSubmit} noValidate className="quick-add-form">
        {/* Top single row: Plus icon, full-width title input, Park button */}
        <div className="quick-add-top-row">
          <div className="quick-add-plus-icon" aria-hidden="true">
            <Plus size={19} strokeWidth={2.5} />
          </div>

          <input
            ref={inputRef}
            type="text"
            className="quick-add-main-input"
            placeholder="Dock an idea, bug, or pending work... (Enter to save)"
            value={title}
            onChange={handleTitleChange}
            onKeyDown={handleKeyDownInTitle}
            maxLength={TITLE_MAX_LENGTH}
            aria-label="Note title"
          />

          <div className="quick-add-top-right">
            {title.length > 80 && (
              <span className="char-counter" title="Character limit">
                {title.length}/{TITLE_MAX_LENGTH}
              </span>
            )}

            {!isExpanded && (
              <button
                type="submit"
                className="quick-add-park-btn"
                disabled={!title.trim()}
                title="Save note (Enter)"
              >
                <span>Dock</span>
                <CornerDownLeft size={13} strokeWidth={2.5} className="dock-shortcut-icon" />
              </button>
            )}
          </div>
        </div>

        {/* Inline Error */}
        {inlineError && (
          <div className="form-inline-error" role="alert">
            <AlertCircle size={13} />
            <span>{inlineError}</span>
          </div>
        )}

        {/* Inline Warning */}
        {inlineWarning && (
          <div className="form-inline-warning" role="status">
            <AlertTriangle size={13} />
            <span>{inlineWarning}</span>
          </div>
        )}

        {/* Compact Property Buttons Row (shown on focus / text / expanded) */}
        {showPropertyRow && (
          <div className="quick-add-properties-row">
            <div className="properties-cluster">
              <SelectPopover
                label="Category"
                value={category}
                options={categoryOptions}
                onChange={handleCategoryChange}
                isNonDefault={category !== 'Idea'}
              />

              <SelectPopover
                label="Priority"
                value={priority}
                options={priorityOptions}
                onChange={setPriority}
                isNonDefault={priority !== 'Medium'}
              />

              <SelectPopover
                label="Project"
                value={selectedProjectId || ''}
                options={projectOptions}
                onChange={(val) => setSelectedProjectId(val || null)}
                placeholder="No project"
                isNonDefault={Boolean(selectedProjectId)}
              />

              <DatePickerPopover
                value={dueDate}
                onChange={handleDueDateChange}
              />

              <ReminderPopover
                value={remindAt}
                onChange={handleSetReminder}
                dueDate={dueDate}
                onRequestPermission={onRequestPermission}
              />

              <PropertyButton
                icon={Star}
                label="Do today"
                value={doToday ? 'Today' : 'Do today'}
                isActive={doToday}
                hasChevron={false}
                onClick={() => setDoToday((prev) => !prev)}
                className={doToday ? 'do-today-active' : ''}
              />
            </div>

            {onToggleExpanded && (
              <button
                type="button"
                className="quick-add-details-toggle"
                onClick={onToggleExpanded}
                aria-expanded={isExpanded}
              >
                <span>{isExpanded ? 'Fewer details' : 'More details'}</span>
                {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
            )}
          </div>
        )}

        {/* Expanded Details State */}
        {isExpanded && (
          <div className="quick-add-expanded-body">
            <div className="expanded-section">
              <div className="section-label-row">
                <label className="expanded-section-label" htmlFor="create-note-notes">
                  Notes
                </label>
                {details.length > 1700 && (
                  <span className="char-counter">
                    {details.length}/{DETAILS_MAX_LENGTH}
                  </span>
                )}
              </div>
              <textarea
                id="create-note-notes"
                ref={detailsRef}
                className="expanded-textarea"
                placeholder="Add notes, steps, or technical pointers... (Enter for new line)"
                rows={3}
                value={details}
                onChange={handleDetailsChange}
                onKeyDown={handleFormKeyDown}
                maxLength={DETAILS_MAX_LENGTH}
              />
            </div>

            <div className="expanded-section">
              <label className="expanded-section-label">Context</label>
              <div className="expanded-context-row">
                <div className="expanded-input-wrap">
                  <Compass size={14} className="input-inner-icon" />
                  <input
                    type="text"
                    className="expanded-text-input"
                    placeholder="Where you were (e.g. debugging auth, staging soak test)"
                    value={contextText}
                    onChange={handleContextTextChange}
                    maxLength={CONTEXT_TEXT_MAX_LENGTH}
                  />
                </div>

                <div className="expanded-input-wrap">
                  <Link2 size={14} className="input-inner-icon" />
                  <input
                    type="text"
                    className="expanded-text-input"
                    placeholder="Link or path (branch name, issue URL, Figma)"
                    value={contextLink}
                    onChange={handleContextLinkChange}
                    maxLength={CONTEXT_LINK_MAX_LENGTH}
                  />
                </div>
              </div>
            </div>

            <div className="quick-add-expanded-footer">
              <button
                type="button"
                className="quick-add-cancel-btn"
                onClick={handleAttemptClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="quick-add-park-btn"
                disabled={!title.trim()}
              >
                <span>Park</span>
                <CornerDownLeft size={13} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        )}

        {/* Discard confirmation dialog */}
        {showDiscardConfirm && (
          <div className="modal-overlay" style={{ zIndex: 160 }}>
            <div className="delete-confirm-card" style={{ maxWidth: '380px' }}>
              <h3 className="delete-confirm-title">Discard unsaved note?</h3>
              <p className="delete-confirm-subtitle">
                You have unsaved changes in this form. Are you sure you want to discard them?
              </p>
              <div className="delete-confirm-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowDiscardConfirm(false)}
                >
                  Keep Editing
                </button>
                <button
                  type="button"
                  className="btn-danger-delete"
                  onClick={() => {
                    setShowDiscardConfirm(false);
                    if (onCancel) onCancel();
                  }}
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    );
  }

  /* =========================================================================
     EDIT MODE (Edit Note Modal)
     ========================================================================= */
  return (
    <form onSubmit={handleFormSubmit} onKeyDown={handleFormKeyDown} noValidate className="modal-form">
      {/* Title Field */}
      <div className="form-field-group">
        <label className="modal-label" htmlFor="edit-note-title">
          Note Title
        </label>
        <div style={{ position: 'relative' }}>
          <input
            id="edit-note-title"
            ref={inputRef}
            type="text"
            className="modal-input modal-title-handwriting-input"
            placeholder="Note title..."
            value={title}
            onChange={handleTitleChange}
            onKeyDown={handleKeyDownInTitle}
            maxLength={TITLE_MAX_LENGTH}
            aria-label="Note title"
            autoFocus
          />
          {title.length > 80 && (
            <span
              className="char-counter"
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
              }}
            >
              {title.length}/{TITLE_MAX_LENGTH}
            </span>
          )}
        </div>
      </div>

      {/* Inline Error Message */}
      {inlineError && (
        <div className="form-inline-error" role="alert">
          <AlertCircle size={13} />
          <span>{inlineError}</span>
        </div>
      )}

      {/* Inline Warning */}
      {inlineWarning && (
        <div className="form-inline-warning" role="status">
          <AlertTriangle size={13} />
          <span>{inlineWarning}</span>
        </div>
      )}

      {/* Active Reminder Display Banner in Edit Mode */}
      {remindAt && (
        <div className="saved-reminder-indicator">
          <div className="reminder-indicator-text">
            <Bell size={13} className="reminder-bell-icon" />
            <span>Reminder scheduled: <strong>{formatReminderDisplay(remindAt)}</strong></span>
          </div>
          <button
            type="button"
            className="reminder-indicator-clear"
            onClick={handleClearReminder}
            title="Remove reminder"
          >
            <X size={12} />
            <span>Remove</span>
          </button>
        </div>
      )}

      {/* Property Buttons Row: Category, Priority, Status, Project, Due Date, Reminder, Do Today */}
      <div className="form-field-group">
        <label className="modal-label" style={{ marginBottom: '6px', display: 'block' }}>
          Properties
        </label>
        <div className="properties-cluster">
          <SelectPopover
            label="Category"
            value={category}
            options={categoryOptions}
            onChange={handleCategoryChange}
            isNonDefault={category !== 'Idea'}
          />

          <SelectPopover
            label="Priority"
            value={priority}
            options={priorityOptions}
            onChange={setPriority}
            isNonDefault={priority !== 'Medium'}
          />

          <SelectPopover
            label="Status"
            value={status}
            options={statusOptions}
            onChange={setStatus}
            isNonDefault={status !== 'Pending'}
          />

          <SelectPopover
            label="Project"
            value={selectedProjectId || ''}
            options={projectOptions}
            onChange={(val) => setSelectedProjectId(val || null)}
            placeholder="No project"
            isNonDefault={Boolean(selectedProjectId)}
          />

          <DatePickerPopover
            value={dueDate}
            onChange={handleDueDateChange}
          />

          <ReminderPopover
            value={remindAt}
            onChange={handleSetReminder}
            dueDate={dueDate}
            onRequestPermission={onRequestPermission}
          />

          <PropertyButton
            icon={Star}
            label="Do today"
            value={doToday ? 'Today' : 'Do today'}
            isActive={doToday}
            hasChevron={false}
            onClick={() => setDoToday((prev) => !prev)}
            className={doToday ? 'do-today-active' : ''}
          />
        </div>
      </div>

      {/* Notes / Details Section */}
      <div className="form-field-group">
        <div className="section-label-row">
          <label className="modal-label" htmlFor="edit-note-details">
            Details & Context
          </label>
          {details.length > 1700 && (
            <span className="char-counter">
              {details.length}/{DETAILS_MAX_LENGTH}
            </span>
          )}
        </div>
        <textarea
          id="edit-note-details"
          ref={detailsRef}
          className="modal-input modal-textarea"
          placeholder="Add notes, steps, or technical pointers..."
          rows={4}
          value={details}
          onChange={handleDetailsChange}
          onKeyDown={handleFormKeyDown}
          maxLength={DETAILS_MAX_LENGTH}
        />
      </div>

      {/* Context Row */}
      <div className="form-field-group">
        <label className="modal-label">Context Reference (Optional)</label>
        <div className="expanded-context-row">
          <div className="expanded-input-wrap">
            <Compass size={14} className="input-inner-icon" />
            <input
              type="text"
              className="modal-input expanded-text-input"
              placeholder="Where you were (e.g. debugging auth, staging)"
              value={contextText}
              onChange={handleContextTextChange}
              maxLength={CONTEXT_TEXT_MAX_LENGTH}
            />
          </div>

          <div className="expanded-input-wrap">
            <Link2 size={14} className="input-inner-icon" />
            <input
              type="text"
              className="modal-input expanded-text-input"
              placeholder="Link or path (branch name, issue URL, Figma)"
              value={contextLink}
              onChange={handleContextLinkChange}
              maxLength={CONTEXT_LINK_MAX_LENGTH}
            />
          </div>
        </div>
      </div>

      {/* Modal Footer */}
      <div className="modal-footer-row">
        <span className="modal-shortcut-hint">
          Press <kbd>Ctrl+Enter</kbd> to save
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleAttemptClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={!title.trim()}
          >
            <Check size={14} style={{ marginRight: '4px' }} />
            Save Changes
          </button>
        </div>
      </div>

      {/* Discard confirmation dialog */}
      {showDiscardConfirm && (
        <div className="modal-overlay" style={{ zIndex: 160 }}>
          <div className="delete-confirm-card" style={{ maxWidth: '380px' }}>
            <h3 className="delete-confirm-title">Discard unsaved changes?</h3>
            <p className="delete-confirm-subtitle">
              You have modified this note. Are you sure you want to discard your changes?
            </p>
            <div className="delete-confirm-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowDiscardConfirm(false)}
              >
                Keep Editing
              </button>
              <button
                type="button"
                className="btn-danger-delete"
                onClick={() => {
                  setShowDiscardConfirm(false);
                  if (onCancel) onCancel();
                }}
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
