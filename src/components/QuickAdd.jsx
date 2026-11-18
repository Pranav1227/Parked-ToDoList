import React, { useState, useRef } from 'react';
import { useNotes } from '../context/NotesContext';
import { NoteForm } from './NoteForm';

export function QuickAdd({ inputRef, onRequestPermission }) {
  const { addNote } = useNotes();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [hasText, setHasText] = useState(false);
  const internalInputRef = useRef(null);
  const actualInputRef = inputRef || internalInputRef;

  const handleSubmit = (noteData) => {
    addNote({
      ...noteData,
      status: 'Pending',
    });

    setIsExpanded(false);
    setHasText(false);
    actualInputRef.current?.focus();
  };

  const showPropertyRow = isFocused || hasText || isExpanded;

  return (
    <div
      className={`quick-add-panel ${isExpanded ? 'is-expanded' : ''} ${
        showPropertyRow ? 'has-properties' : ''
      }`}
      onFocus={() => setIsFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setIsFocused(false);
        }
      }}
      onChange={(e) => {
        if (e.target.tagName === 'INPUT' && e.target.type === 'text') {
          setHasText(Boolean(e.target.value.trim()));
        }
      }}
    >
      <NoteForm
        mode="create"
        onSubmit={handleSubmit}
        onCancel={() => {
          setIsExpanded(false);
          setHasText(false);
        }}
        inputRef={actualInputRef}
        isExpanded={isExpanded}
        onToggleExpanded={() => setIsExpanded((prev) => !prev)}
        showPropertyRow={showPropertyRow}
        onRequestPermission={onRequestPermission}
      />
    </div>
  );
}
