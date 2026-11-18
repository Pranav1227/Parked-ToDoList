import { normalizeNoteToV2 } from './migrations';

export function validateImportData(rawJson) {
  if (!rawJson || typeof rawJson !== 'string') {
    return { success: false, error: 'The uploaded file is empty or not readable text.' };
  }

  let parsed;
  try {
    parsed = JSON.parse(rawJson);
  } catch (err) {
    return { success: false, error: 'Invalid JSON format. Please upload a valid TaskDock backup file.' };
  }

  if (!parsed || typeof parsed !== 'object') {
    return { success: false, error: 'The file does not contain a valid TaskDock backup structure.' };
  }

  let rawNotes = [];
  let rawProjects = [];
  let schemaVersion = 1;

  if (Array.isArray(parsed)) {
    // Phase 1 backup
    rawNotes = parsed;
    schemaVersion = 1;
  } else if (parsed && typeof parsed === 'object') {
    // Phase 2 or structured backup
    schemaVersion = typeof parsed.schemaVersion === 'number' ? parsed.schemaVersion : 1;
    if (Array.isArray(parsed.notes)) {
      rawNotes = parsed.notes;
    } else {
      return { success: false, error: 'Backup file is missing the notes list.' };
    }
    if (Array.isArray(parsed.projects)) {
      rawProjects = parsed.projects;
    }
  } else {
    return { success: false, error: 'Unrecognized backup structure.' };
  }

  // Validate and normalize notes
  const validatedNotes = [];
  for (let i = 0; i < rawNotes.length; i++) {
    const item = rawNotes[i];
    if (!item || typeof item !== 'object') continue;

    const normalized = normalizeNoteToV2(item, i);
    if (normalized && normalized.title) {
      validatedNotes.push(normalized);
    }
  }

  if (validatedNotes.length === 0 && rawNotes.length > 0) {
    return { success: false, error: 'None of the items in this backup contain valid notes.' };
  }

  // Validate projects
  const validatedProjects = [];
  for (const proj of rawProjects) {
    if (proj && typeof proj === 'object' && proj.id && proj.name) {
      validatedProjects.push({
        id: String(proj.id),
        name: String(proj.name).trim(),
        colorIndex: typeof proj.colorIndex === 'number' ? proj.colorIndex : 0,
      });
    }
  }

  return {
    success: true,
    schemaVersion,
    notes: validatedNotes,
    projects: validatedProjects,
  };
}

export function mergeImportedNotes(importedNotes, existingNotes, strategy = 'merge') {
  if (strategy === 'replace') {
    return importedNotes;
  }

  const existingMap = new Map(existingNotes.map((n) => [n.id, n]));
  const result = [...existingNotes];

  if (strategy === 'merge') {
    // Update existing if present, otherwise append
    importedNotes.forEach((impNote) => {
      const idx = result.findIndex((n) => n.id === impNote.id);
      if (idx >= 0) {
        result[idx] = impNote;
      } else {
        result.push(impNote);
      }
    });
  } else if (strategy === 'skip') {
    // Only add if ID doesn't already exist
    importedNotes.forEach((impNote) => {
      if (!existingMap.has(impNote.id)) {
        result.push(impNote);
      }
    });
  }

  return result;
}
