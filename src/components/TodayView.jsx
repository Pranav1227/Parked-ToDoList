import React, { useState, useEffect } from 'react';
import { Star, Sparkles, AlertCircle, CheckCircle2, RotateCcw } from 'lucide-react';
import { StickyNote } from './StickyNote';
import { useNotes } from '../context/NotesContext';
import { getLocalDateString } from '../utils/dateValidation';

export function TodayView() {
  const { notes, clearToday } = useNotes();
  const [currentDateStr, setCurrentDateStr] = useState(() => getLocalDateString());

  // Periodically and on focus re-check current date for midnight rollover
  useEffect(() => {
    const updateDate = () => {
      const fresh = getLocalDateString();
      if (fresh !== currentDateStr) {
        setCurrentDateStr(fresh);
      }
    };

    const interval = setInterval(updateDate, 30000);
    window.addEventListener('focus', updateDate);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', updateDate);
    };
  }, [currentDateStr]);

  const rawTodayNotes = notes.filter((n) => n.doToday);
  const doneCount = rawTodayNotes.filter((n) => n.status === 'Done').length;
  const totalCount = rawTodayNotes.length;
  const isOverRecommended = totalCount > 3;

  // Completed notes sink to the bottom (BUG-08)
  const todayNotes = [...rawTodayNotes].sort((a, b) => {
    const aDone = a.status === 'Done';
    const bDone = b.status === 'Done';
    if (aDone && !bDone) return 1;
    if (!aDone && bDone) return -1;
    return (a.order ?? 0) - (b.order ?? 0);
  });

  const formattedDate = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="today-view-wrapper" role="region" aria-label="Today focus view">
      {/* Today Header & Progress summary */}
      <div className="today-header-banner">
        <div className="today-header-left">
          <div className="today-icon-badge">
            <Star size={18} className="star-filled" />
          </div>
          <div>
            <h2 className="today-heading">Today's Focus</h2>
            <span className="today-date-subtitle">{formattedDate}</span>
          </div>
        </div>

        <div className="today-header-right">
          {totalCount > 0 && (
            <div className="today-progress-group">
              <span className="today-progress-text">
                {doneCount} of {totalCount} done
              </span>
              <div className="today-progress-bar-track" aria-hidden="true">
                <div
                  className="today-progress-bar-fill"
                  style={{ width: `${totalCount > 0 ? (doneCount / totalCount) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          {totalCount > 0 && (
            <button
              type="button"
              className="btn-secondary today-clear-btn"
              onClick={clearToday}
              title="Remove all notes from Today"
            >
              <RotateCcw size={13} />
              <span>Clear today</span>
            </button>
          )}
        </div>
      </div>

      {/* Recommended limit gentle warning */}
      {isOverRecommended && (
        <div className="today-recommend-alert" role="status">
          <AlertCircle size={15} />
          <span>That is a full day. Consider moving one out.</span>
        </div>
      )}

      {/* Today Notes Board */}
      {todayNotes.length === 0 ? (
        <div className="empty-state-card" role="status">
          <div className="empty-state-icon">
            <Star size={26} />
          </div>
          <h3 className="empty-state-title">Today is empty</h3>
          <p className="empty-state-desc">
            Pick up to 3 high-impact notes from your Sticky Wall or List and click the star icon to focus on them today.
          </p>
        </div>
      ) : (
        <div className="sticky-wall-grid">
          {todayNotes.map((note) => (
            <StickyNote
              key={note.id}
              note={note}
              canReorder={false}
              onDragStart={null}
              onDragOver={null}
              onDrop={null}
              onDragEnd={() => {}}
              isDragTarget={false}
              isDragging={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
