import { describe, it, expect } from 'vitest';
import { validateImportData, mergeImportedNotes } from '../src/utils/importValidation';

describe('Import Validation and Merging', () => {
  it('validates a valid Phase 2 backup JSON string', () => {
    const validJson = JSON.stringify({
      schemaVersion: 2,
      notes: [
        { id: 'n-1', title: 'First Note', category: 'Idea', priority: 'Medium' },
        { id: 'n-2', title: 'Second Note', category: 'Bug', priority: 'High' },
      ],
      projects: [
        { id: 'p-1', name: 'Frontend', colorIndex: 1 },
      ],
    });

    const res = validateImportData(validJson);
    expect(res.success).toBe(true);
    expect(res.notes.length).toBe(2);
    expect(res.projects.length).toBe(1);
    expect(res.schemaVersion).toBe(2);
  });

  it('validates a Phase 1 legacy JSON array', () => {
    const legacyJson = JSON.stringify([
      { id: 'n-old', title: 'Old Note', category: 'Personal' },
    ]);

    const res = validateImportData(legacyJson);
    expect(res.success).toBe(true);
    expect(res.notes.length).toBe(1);
    expect(res.notes[0].title).toBe('Old Note');
  });

  it('rejects invalid JSON syntax gracefully without throwing', () => {
    const invalidJson = '{"notes": [ { id: "n-1", title: "broken" ...';
    const res = validateImportData(invalidJson);
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/invalid json/i);
  });

  it('rejects empty or non-string inputs', () => {
    expect(validateImportData('').success).toBe(false);
    expect(validateImportData(null).success).toBe(false);
    expect(validateImportData(undefined).success).toBe(false);
  });

  it('rejects object backup missing notes property', () => {
    const noNotes = JSON.stringify({
      schemaVersion: 2,
      projects: [{ id: 'p-1', name: 'Test' }],
    });
    const res = validateImportData(noNotes);
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/missing the notes list/i);
  });

  it('mergeImportedNotes handles merge strategy (updates matching ID, appends new)', () => {
    const existing = [
      { id: '1', title: 'Original 1', category: 'Idea' },
      { id: '2', title: 'Original 2', category: 'Bug' },
    ];
    const imported = [
      { id: '2', title: 'Updated 2', category: 'Bug' },
      { id: '3', title: 'New 3', category: 'Personal' },
    ];

    const result = mergeImportedNotes(imported, existing, 'merge');
    expect(result.length).toBe(3);
    const item2 = result.find((n) => n.id === '2');
    expect(item2.title).toBe('Updated 2');
    const item3 = result.find((n) => n.id === '3');
    expect(item3.title).toBe('New 3');
  });

  it('mergeImportedNotes handles skip strategy (ignores items with existing IDs)', () => {
    const existing = [
      { id: '1', title: 'Original 1' },
      { id: '2', title: 'Original 2' },
    ];
    const imported = [
      { id: '2', title: 'Ignored Update 2' },
      { id: '3', title: 'New 3' },
    ];

    const result = mergeImportedNotes(imported, existing, 'skip');
    expect(result.length).toBe(3);
    const item2 = result.find((n) => n.id === '2');
    expect(item2.title).toBe('Original 2');
  });

  it('mergeImportedNotes handles replace strategy (overwrites entire list)', () => {
    const existing = [{ id: '1', title: 'Old' }];
    const imported = [{ id: '2', title: 'Replacement' }];

    const result = mergeImportedNotes(imported, existing, 'replace');
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('2');
  });
});
