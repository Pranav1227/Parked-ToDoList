import { describe, it, expect } from 'vitest';
import {
  migrateStorageData,
  normalizeNoteToV2,
  CURRENT_SCHEMA_VERSION,
} from '../src/utils/migrations';

describe('Data Migrations', () => {
  it('migrates legacy Phase 1 array to valid Phase 2 schema', () => {
    const legacyNotes = [
      {
        id: 'note-1',
        title: 'Legacy Note 1',
        category: 'Bug',
        priority: 'High',
        status: 'Pending',
        createdAt: '2026-11-01T10:00:00.000Z',
      },
      {
        id: 'note-2',
        title: 'Legacy Note 2',
        category: 'Idea',
        priority: 'Low',
        status: 'Done',
      },
    ];

    const result = migrateStorageData(legacyNotes);
    expect(result.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(result.notes.length).toBe(2);
    expect(result.notes[0].title).toBe('Legacy Note 1');
    expect(result.notes[0].project).toBeNull();
    expect(result.notes[0].context).toBeNull();
    expect(result.notes[0].doToday).toBe(false);
    expect(result.notes[0].remindAt).toBeNull();
    expect(result.notes[0].rotation).toBeDefined();
    expect(result.projects).toBeDefined();
  });

  it('migrates raw JSON string representing Phase 1 array', () => {
    const rawJson = JSON.stringify([
      { id: 'note-abc', title: 'Json string note' },
    ]);

    const result = migrateStorageData(rawJson);
    expect(result.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(result.notes[0].title).toBe('Json string note');
    expect(result.notes[0].category).toBe('Idea');
    expect(result.notes[0].priority).toBe('Medium');
    expect(result.notes[0].status).toBe('Pending');
  });

  it('loads Phase 2 schema directly and preserves custom fields', () => {
    const v2Payload = {
      schemaVersion: 2,
      updatedAt: '2026-11-18T10:00:00.000Z',
      notes: [
        {
          id: 'note-v2',
          title: 'Phase 2 note',
          category: 'Integration',
          priority: 'High',
          status: 'Pending',
          project: 'proj-1',
          context: { text: 'In meeting', link: 'https://github.com' },
          doToday: true,
          doTodayDate: '2026-11-18',
          remindAt: '2026-11-19T09:00:00.000Z',
        },
      ],
      projects: [
        { id: 'proj-1', name: 'Auth Refactor', colorIndex: 2 },
      ],
    };

    const result = migrateStorageData(v2Payload);
    expect(result.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(result.notes[0].title).toBe('Phase 2 note');
    expect(result.notes[0].project).toBe('proj-1');
    expect(result.notes[0].context.text).toBe('In meeting');
    expect(result.notes[0].context.link).toBe('https://github.com');
    expect(result.notes[0].doToday).toBe(true);
    expect(result.projects[0].name).toBe('Auth Refactor');
  });

  it('normalizeNoteToV2 safely sanitizes partial or malformed notes', () => {
    const partial = {
      title: '  Trimmed Title  ',
      category: 'UnknownCategory',
      priority: 'InvalidPriority',
    };

    const normalized = normalizeNoteToV2(partial, 0);
    expect(normalized.title).toBe('Trimmed Title');
    expect(normalized.category).toBe('Idea'); // falls back to default
    expect(normalized.priority).toBe('Medium'); // falls back to default
    expect(normalized.status).toBe('Pending');
    expect(normalized.id).toBeDefined();
    expect(normalized.rotation).toBeDefined();
  });
});
