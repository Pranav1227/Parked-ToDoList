/**
 * Schema versioning and migration utilities for Parked data.
 * Phase 1 format: Array of notes
 * Phase 2 format: { schemaVersion: 2, notes: [...], projects: [...] }
 */

export const CURRENT_SCHEMA_VERSION = 2;

const VALID_CATEGORIES = ['Idea', 'Pending Work', 'Bug', 'Integration', 'Personal'];
const VALID_PRIORITIES = ['Low', 'Medium', 'High'];
const VALID_STATUSES = ['Pending', 'In Progress', 'Done'];

export function normalizeNoteToV2(rawNote, index = 0) {
  if (!rawNote || typeof rawNote !== 'object') return null;

  const nowIso = new Date().toISOString();
  const rawTitle = String(rawNote.title || '').trim();

  return {
    id: String(rawNote.id || `note-${Date.now()}-${index}`),
    title: rawTitle || 'Untitled Note',
    details: String(rawNote.details || '').trim(),
    category: VALID_CATEGORIES.includes(rawNote.category) ? rawNote.category : 'Idea',
    priority: VALID_PRIORITIES.includes(rawNote.priority) ? rawNote.priority : 'Medium',
    status: VALID_STATUSES.includes(rawNote.status) ? rawNote.status : 'Pending',
    createdAt: rawNote.createdAt || nowIso,
    dueDate: rawNote.dueDate || '',
    rotation: typeof rawNote.rotation === 'number' ? rawNote.rotation : 0,
    order: typeof rawNote.order === 'number' ? rawNote.order : index,
    // Phase 2 additions
    project: typeof rawNote.project === 'string' ? rawNote.project : null,
    context: rawNote.context && typeof rawNote.context === 'object'
      ? {
          text: String(rawNote.context.text || '').trim(),
          link: String(rawNote.context.link || '').trim(),
        }
      : null,
    doToday: Boolean(rawNote.doToday),
    doTodayDate: rawNote.doTodayDate || (rawNote.doToday ? new Date().toISOString().split('T')[0] : null),
    remindAt: rawNote.remindAt || null,
    savedRemindAt: rawNote.savedRemindAt || null,
    reminderFired: Boolean(rawNote.reminderFired),
  };
}

export function migrateStorageData(rawStored) {
  if (!rawStored) return null;

  try {
    const parsed = typeof rawStored === 'string' ? JSON.parse(rawStored) : rawStored;

    // Case 1: Already Phase 2 object
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed.schemaVersion >= 2) {
      return {
        schemaVersion: parsed.schemaVersion,
        notes: Array.isArray(parsed.notes) ? parsed.notes.map(normalizeNoteToV2).filter(Boolean) : [],
        projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      };
    }

    // Case 2: Phase 1 array of notes
    if (Array.isArray(parsed)) {
      return {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        notes: parsed.map(normalizeNoteToV2).filter(Boolean),
        projects: [],
      };
    }

    return null;
  } catch (err) {
    console.warn('Data migration failed:', err);
    return null;
  }
}
