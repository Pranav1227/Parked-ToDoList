import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { INITIAL_NOTES, getNoteRotation } from '../constants';
import { migrateStorageData, normalizeNoteToV2, CURRENT_SCHEMA_VERSION } from '../utils/migrations';
import { getSafeStorageItem, setSafeStorageItem } from '../utils/storage';
import { getLocalDateString } from '../utils/dateValidation';

const STORAGE_KEY_STORE = 'parked_data_v2';
const STORAGE_KEY_V1_LEGACY = 'parked_notes_v1';
const STORAGE_KEY_THEME = 'parked_theme_v1';
const STORAGE_KEY_VIEW = 'parked_view_v1';

const NotesContext = createContext(null);

export function NotesProvider({ children, projects = [], setProjects, registerOnProjectDeleted }) {
  // Theme state: 'light' or 'dark' (defaults to 'light')
  const [theme, setTheme] = useState(() => {
    const saved = getSafeStorageItem(STORAGE_KEY_THEME, null);
    if (saved === 'dark' || saved === 'light') return saved;
    return 'light';
  });

  // View state: 'wall' | 'list' | 'today'
  const [view, setView] = useState(() => {
    const saved = getSafeStorageItem(STORAGE_KEY_VIEW, 'wall');
    if (saved === 'list' || saved === 'today' || saved === 'wall') return saved;
    return 'wall';
  });

  // Load and migrate notes from safe storage
  const [notes, setNotes] = useState(() => {
    try {
      // 1. Check Phase 2 storage first
      const v2Data = getSafeStorageItem(STORAGE_KEY_STORE, null);
      if (v2Data) {
        const migrated = migrateStorageData(v2Data);
        if (migrated && Array.isArray(migrated.notes) && migrated.notes.length > 0) {
          return migrated.notes;
        }
      }

      // 2. Check Phase 1 legacy storage
      const v1Data = getSafeStorageItem(STORAGE_KEY_V1_LEGACY, null);
      if (v1Data) {
        const migrated = migrateStorageData(v1Data);
        if (migrated && Array.isArray(migrated.notes) && migrated.notes.length > 0) {
          return migrated.notes;
        }
      }
    } catch (err) {
      console.warn('Failed to parse or migrate notes from storage:', err);
    }
    return INITIAL_NOTES;
  });

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedPriorities, setSelectedPriorities] = useState([]);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [sortBy, setSortBy] = useState('order'); // 'order' | 'newest' | 'oldest' | 'priority' | 'dueDate'

  // Modal edit note state
  const [editingNote, setEditingNote] = useState(null);

  // Delete confirmation state: note object to delete, or null
  const [deleteConfirmNote, setDeleteConfirmNote] = useState(null);

  // Undo delete toast state: { notes: Note[], timeoutId: number }
  const [undoItem, setUndoItem] = useState(null);

  // Document Picture-in-Picture window reference
  const [pipWindow, setPipWindow] = useState(null);

  // Check midnight rollover for Do-Today flags
  const checkDailyRollover = useCallback(() => {
    const todayStr = getLocalDateString();
    setNotes((prevNotes) => {
      let changed = false;
      const updated = prevNotes.map((n) => {
        if (!n.doToday) return n;

        // Note flagged on previous day
        if (n.doTodayDate && n.doTodayDate < todayStr) {
          if (n.status === 'Done') {
            changed = true;
            return { ...n, doToday: false, doTodayDate: null };
          }
          // Unfinished notes carry over
        }
        return n;
      });
      return changed ? updated : prevNotes;
    });
  }, []);

  useEffect(() => {
    checkDailyRollover();
    // Re-check periodically every 60s for midnight transition
    const interval = setInterval(checkDailyRollover, 60000);
    return () => clearInterval(interval);
  }, [checkDailyRollover]);

  // Sync theme attribute to <html> element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    setSafeStorageItem(STORAGE_KEY_THEME, theme);
    if (pipWindow && pipWindow.document) {
      pipWindow.document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme, pipWindow]);

  // Sync view preference
  useEffect(() => {
    setSafeStorageItem(STORAGE_KEY_VIEW, view);
  }, [view]);

  // Persist versioned data to safe storage
  useEffect(() => {
    const storePayload = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      updatedAt: new Date().toISOString(),
      notes,
      projects,
    };
    setSafeStorageItem(STORAGE_KEY_STORE, storePayload);
  }, [notes, projects]);

  // Multi-tab storage synchronization
  useEffect(() => {
    const handleStorageEvent = (e) => {
      if (!e.newValue) return;

      if (e.key === STORAGE_KEY_STORE) {
        try {
          const parsed = JSON.parse(e.newValue);
          const migrated = migrateStorageData(parsed);
          if (migrated && Array.isArray(migrated.notes)) {
            setNotes(migrated.notes);
          }
          if (migrated && Array.isArray(migrated.projects) && setProjects) {
            setProjects(migrated.projects);
          }
        } catch {
          // Ignore parse errors from other tabs
        }
      } else if (e.key === STORAGE_KEY_THEME) {
        if (e.newValue === 'light' || e.newValue === 'dark') {
          setTheme(e.newValue);
        }
      } else if (e.key === STORAGE_KEY_VIEW) {
        if (e.newValue === 'wall' || e.newValue === 'list' || e.newValue === 'today') {
          setView(e.newValue);
        }
      }
    };

    window.addEventListener('storage', handleStorageEvent);
    return () => window.removeEventListener('storage', handleStorageEvent);
  }, [setProjects]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  // Quick Add / Add Note
  const addNote = useCallback((data) => {
    const now = new Date();
    const todayStr = getLocalDateString(now);

    const newNote = {
      id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: data.title.trim(),
      details: (data.details || '').trim(),
      category: data.category || 'Idea',
      priority: data.priority || 'Medium',
      status: data.status || 'Pending',
      createdAt: now.toISOString(),
      dueDate: data.dueDate || '',
      rotation: getNoteRotation(Date.now()),
      order: 0,
      project: data.project || null,
      context: data.context || null,
      doToday: Boolean(data.doToday),
      doTodayDate: data.doToday ? todayStr : null,
      remindAt: data.remindAt || null,
      savedRemindAt: null,
      reminderFired: false,
    };

    setNotes((prevNotes) => {
      const shifted = prevNotes.map((n) => ({ ...n, order: (n.order || 0) + 1 }));
      return [newNote, ...shifted];
    });

    return newNote;
  }, []);

  // Update Note
  const updateNote = useCallback((id, updates) => {
    setNotes((prevNotes) =>
      prevNotes.map((n) => {
        if (n.id === id) {
          return {
            ...n,
            ...updates,
            updatedAt: new Date().toISOString(),
          };
        }
        return n;
      })
    );
  }, []);

  // Toggle Note Done
  const toggleNoteDone = useCallback((id) => {
    setNotes((prevNotes) =>
      prevNotes.map((n) => {
        if (n.id === id) {
          const isMarkingDone = n.status !== 'Done';
          if (isMarkingDone) {
            // Cancel reminder when marked done, saving it in case of undo
            return {
              ...n,
              status: 'Done',
              completedAt: new Date().toISOString(),
              savedRemindAt: n.remindAt || n.savedRemindAt || null,
              remindAt: null,
              reminderFired: false,
            };
          } else {
            // Unmarking done: restore reminder if still in future
            let restoredRemindAt = null;
            if (n.savedRemindAt && new Date(n.savedRemindAt).getTime() > Date.now()) {
              restoredRemindAt = n.savedRemindAt;
            }
            return {
              ...n,
              status: 'Pending',
              completedAt: null,
              remindAt: restoredRemindAt,
              reminderFired: false,
              savedRemindAt: null,
            };
          }
        }
        return n;
      })
    );
  }, []);

  // Toggle Do Today
  const toggleDoToday = useCallback((id) => {
    const todayStr = getLocalDateString();
    setNotes((prevNotes) =>
      prevNotes.map((n) => {
        if (n.id === id) {
          const nextDoToday = !n.doToday;
          return {
            ...n,
            doToday: nextDoToday,
            doTodayDate: nextDoToday ? todayStr : null,
          };
        }
        return n;
      })
    );
  }, []);

  // Clear all notes from Today
  const clearToday = useCallback(() => {
    setNotes((prevNotes) =>
      prevNotes.map((n) => (n.doToday ? { ...n, doToday: false, doTodayDate: null } : n))
    );
  }, []);

  // Reminders
  const setNoteReminder = useCallback((id, isoString) => {
    updateNote(id, { remindAt: isoString, reminderFired: false, savedRemindAt: null });
  }, [updateNote]);

  const clearNoteReminder = useCallback((id) => {
    updateNote(id, { remindAt: null, reminderFired: false, savedRemindAt: null });
  }, [updateNote]);

  // Clean up references when a project is deleted
  const cleanUpProjectReferences = useCallback((deletedProjectId) => {
    setNotes((prevNotes) =>
      prevNotes.map((n) => (n.project === deletedProjectId ? { ...n, project: null } : n))
    );
    setSelectedProjects((prev) => prev.filter((id) => id !== deletedProjectId));
  }, []);

  // Listen for project deletions from ProjectsProvider
  useEffect(() => {
    if (typeof registerOnProjectDeleted === 'function') {
      return registerOnProjectDeleted((deletedProjectId) => {
        cleanUpProjectReferences(deletedProjectId);
      });
    }
  }, [registerOnProjectDeleted, cleanUpProjectReferences]);

  // Delete note with undo toast supporting quick successive deletes
  const deleteNote = useCallback((id) => {
    setNotes((prevNotes) => {
      const noteToDelete = prevNotes.find((n) => n.id === id);
      if (!noteToDelete) return prevNotes;

      setUndoItem((prev) => {
        if (prev?.timeoutId) clearTimeout(prev.timeoutId);
        const timeoutId = setTimeout(() => {
          setUndoItem(null);
        }, 6000);

        const existingNotes = prev?.notes || [];
        return {
          notes: [...existingNotes, noteToDelete],
          timeoutId,
        };
      });

      return prevNotes.filter((n) => n.id !== id);
    });
  }, []);

  const requestDeleteNote = useCallback((note) => {
    if (!note) return;
    setDeleteConfirmNote(note);
  }, []);

  const confirmDeleteNote = useCallback(() => {
    if (!deleteConfirmNote) return;
    const noteId = deleteConfirmNote.id;
    deleteNote(noteId);
    setDeleteConfirmNote(null);
    setEditingNote((current) => (current?.id === noteId ? null : current));
  }, [deleteConfirmNote, deleteNote]);

  const cancelDeleteNote = useCallback(() => {
    setDeleteConfirmNote(null);
  }, []);

  // Undo delete
  const undoDelete = useCallback(() => {
    if (!undoItem?.notes || undoItem.notes.length === 0) return;
    if (undoItem.timeoutId) clearTimeout(undoItem.timeoutId);

    const now = Date.now();
    const restoredNotes = undoItem.notes.map((n) => {
      // Restore reminder only if still in future
      const hasFutureReminder = n.remindAt && new Date(n.remindAt).getTime() > now;
      return {
        ...n,
        remindAt: hasFutureReminder ? n.remindAt : null,
        reminderFired: false,
      };
    });

    setNotes((prev) => [...restoredNotes, ...prev]);
    setUndoItem(null);
  }, [undoItem]);

  const dismissUndo = useCallback(() => {
    if (undoItem?.timeoutId) clearTimeout(undoItem.timeoutId);
    setUndoItem(null);
  }, [undoItem]);

  // HTML5 Drag and drop reordering
  const reorderNotes = useCallback((draggedId, targetId) => {
    if (!draggedId || !targetId || draggedId === targetId) return;

    setNotes((prevNotes) => {
      const items = [...prevNotes];
      const fromIndex = items.findIndex((n) => n.id === draggedId);
      const toIndex = items.findIndex((n) => n.id === targetId);
      if (fromIndex < 0 || toIndex < 0) return prevNotes;

      const [moved] = items.splice(fromIndex, 1);
      items.splice(toIndex, 0, moved);

      return items.map((item, idx) => ({ ...item, order: idx }));
    });
  }, []);

  // Multi-select toggle helpers
  const toggleCategoryFilter = useCallback((cat) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }, []);

  const clearCategoryFilters = useCallback(() => setSelectedCategories([]), []);

  const togglePriorityFilter = useCallback((p) => {
    setSelectedPriorities((prev) =>
      prev.includes(p) ? prev.filter((item) => item !== p) : [...prev, p]
    );
  }, []);

  const clearPriorityFilters = useCallback(() => setSelectedPriorities([]), []);

  const toggleProjectFilter = useCallback((projId) => {
    setSelectedProjects((prev) =>
      prev.includes(projId) ? prev.filter((id) => id !== projId) : [...prev, projId]
    );
  }, []);

  const clearProjectFilters = useCallback(() => setSelectedProjects([]), []);

  // Filtered & Sorted Notes
  const filteredNotes = useMemo(() => {
    const projectMap = new Map((projects || []).map((p) => [p.id, p.name.toLowerCase()]));

    let result = notes.filter((n) => {
      // Search query across title, details, category, project name, context text, context link
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const inTitle = n.title?.toLowerCase().includes(query);
        const inDetails = n.details?.toLowerCase().includes(query);
        const inCategory = n.category?.toLowerCase().includes(query);
        const projectName = n.project ? projectMap.get(n.project) : '';
        const inProject = projectName ? projectName.includes(query) : false;
        const inContextText = n.context?.text ? n.context.text.toLowerCase().includes(query) : false;
        const inContextLink = n.context?.link ? n.context.link.toLowerCase().includes(query) : false;

        if (!inTitle && !inDetails && !inCategory && !inProject && !inContextText && !inContextLink) {
          return false;
        }
      }

      // Category multi-select
      if (selectedCategories.length > 0 && !selectedCategories.includes(n.category)) {
        return false;
      }

      // Priority multi-select
      if (selectedPriorities.length > 0 && !selectedPriorities.includes(n.priority)) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'All' && n.status !== statusFilter) {
        return false;
      }

      // Project multi-select
      if (selectedProjects.length > 0) {
        const noteProj = n.project || 'none';
        if (!selectedProjects.includes(noteProj)) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      // Done notes always fade and move to the bottom
      const aDone = a.status === 'Done';
      const bDone = b.status === 'Done';
      if (aDone && !bDone) return 1;
      if (!aDone && bDone) return -1;

      if (sortBy === 'newest') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      }
      if (sortBy === 'priority') {
        const priorityWeights = { High: 3, Medium: 2, Low: 1 };
        const weightA = priorityWeights[a.priority] || 0;
        const weightB = priorityWeights[b.priority] || 0;
        if (weightA !== weightB) return weightB - weightA;
        return (a.order ?? 0) - (b.order ?? 0);
      }
      if (sortBy === 'dueDate') {
        if (!a.dueDate && !b.dueDate) return (a.order ?? 0) - (b.order ?? 0);
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }

      return (a.order ?? 0) - (b.order ?? 0);
    });

    return result;
  }, [notes, projects, searchQuery, selectedCategories, selectedPriorities, statusFilter, selectedProjects, sortBy]);

  // Today notes - completed tasks sink to the bottom
  const todayNotes = useMemo(() => {
    return [...notes]
      .filter((n) => n.doToday)
      .sort((a, b) => {
        const aDone = a.status === 'Done';
        const bDone = b.status === 'Done';
        if (aDone && !bDone) return 1;
        if (!aDone && bDone) return -1;
        return (a.order ?? 0) - (b.order ?? 0);
      });
  }, [notes]);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('All');
    setSelectedCategories([]);
    setSelectedPriorities([]);
    setSelectedProjects([]);
    setSortBy('order');
  }, []);

  const hasActiveFilters = useMemo(() => {
    return (
      searchQuery.trim() !== '' ||
      statusFilter !== 'All' ||
      selectedCategories.length > 0 ||
      selectedPriorities.length > 0 ||
      selectedProjects.length > 0 ||
      sortBy !== 'order'
    );
  }, [searchQuery, statusFilter, selectedCategories, selectedPriorities, selectedProjects, sortBy]);

  // Export notes as JSON file with date in filename
  const exportNotes = useCallback(() => {
    const payload = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      notes,
      projects,
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    const dateStr = getLocalDateString();
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `parked-backup-${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }, [notes, projects]);

  // Import notes with duplicate strategy support
  const importNotes = useCallback((importedNotes, importedProjects, strategy = 'merge') => {
    try {
      if (strategy === 'replace') {
        setNotes(importedNotes);
        if (Array.isArray(importedProjects) && setProjects) {
          setProjects(importedProjects);
        }
        return { success: true, count: importedNotes.length };
      }

      if (strategy === 'skip') {
        const existingIds = new Set(notes.map((n) => n.id));
        const newNotes = importedNotes.filter((n) => !existingIds.has(n.id));
        setNotes((prev) => [...newNotes, ...prev]);

        if (Array.isArray(importedProjects) && setProjects) {
          const existingProjIds = new Set(projects.map((p) => p.id));
          const newProjs = importedProjects.filter((p) => !existingProjIds.has(p.id));
          setProjects((prev) => [...prev, ...newProjs]);
        }
        return { success: true, count: newNotes.length };
      }

      // Default: merge (overwrite existing with imported, append new)
      const importedMap = new Map(importedNotes.map((n) => [n.id, n]));
      const remainingNotes = notes.filter((n) => !importedMap.has(n.id));
      setNotes([...importedNotes, ...remainingNotes]);

      if (Array.isArray(importedProjects) && setProjects) {
        const importedProjMap = new Map(importedProjects.map((p) => [p.id, p]));
        const remainingProjs = projects.filter((p) => !importedProjMap.has(p.id));
        setProjects([...importedProjects, ...remainingProjs]);
      }

      return { success: true, count: importedNotes.length };
    } catch (err) {
      console.error('Import processing error:', err);
      return { success: false, error: err.message };
    }
  }, [notes, projects, setProjects]);

  // Document Picture-in-Picture Mini Mode
  const isPipSupported = typeof window !== 'undefined' && 'documentPictureInPicture' in window;

  const togglePipMode = useCallback(async () => {
    if (!isPipSupported) return;

    if (pipWindow) {
      pipWindow.close();
      setPipWindow(null);
      return;
    }

    try {
      const pip = await window.documentPictureInPicture.requestWindow({
        width: 360,
        height: 480,
      });

      Array.from(document.styleSheets).forEach((sheet) => {
        try {
          if (sheet.href) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = sheet.href;
            pip.document.head.appendChild(link);
          } else if (sheet.cssRules) {
            const style = document.createElement('style');
            style.textContent = Array.from(sheet.cssRules)
              .map((rule) => rule.cssText)
              .join('\n');
            pip.document.head.appendChild(style);
          }
        } catch {
          if (sheet.href) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = sheet.href;
            pip.document.head.appendChild(link);
          }
        }
      });

      pip.document.title = 'Parked — Pin';
      pip.document.documentElement.setAttribute('data-theme', theme);

      pip.addEventListener('pagehide', () => {
        setPipWindow(null);
      });

      setPipWindow(pip);
    } catch (err) {
      console.error('Failed to open Document Picture-in-Picture window:', err);
    }
  }, [isPipSupported, pipWindow, theme]);

  const value = {
    notes,
    filteredNotes,
    todayNotes,
    theme,
    toggleTheme,
    view,
    setView,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    selectedCategories,
    setSelectedCategories,
    toggleCategoryFilter,
    clearCategoryFilters,
    selectedPriorities,
    setSelectedPriorities,
    togglePriorityFilter,
    clearPriorityFilters,
    selectedProjects,
    setSelectedProjects,
    toggleProjectFilter,
    clearProjectFilters,
    sortBy,
    setSortBy,
    hasActiveFilters,
    resetFilters,
    addNote,
    updateNote,
    deleteNote,
    deleteConfirmNote,
    requestDeleteNote,
    confirmDeleteNote,
    cancelDeleteNote,
    undoDelete,
    undoItem,
    dismissUndo,
    toggleNoteDone,
    toggleDoToday,
    clearToday,
    setNoteReminder,
    clearNoteReminder,
    cleanUpProjectReferences,
    reorderNotes,
    editingNote,
    setEditingNote,
    exportNotes,
    importNotes,
    isPipSupported,
    pipWindow,
    togglePipMode,
  };

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}

export function useNotes() {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
}
