import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { DEFAULT_PROJECTS } from '../constants';
import { getSafeStorageItem, setSafeStorageItem } from '../utils/storage';

const STORAGE_KEY_PROJECTS = 'taskdock_projects_v2';
const STORAGE_KEY_PROJECTS_LEGACY = 'parked_projects_v2';
const STORAGE_KEY_LAST_PROJECT = 'taskdock_last_project_v2';
const STORAGE_KEY_LAST_PROJECT_LEGACY = 'parked_last_project_v2';

const ProjectsContext = createContext(null);

export function ProjectsProvider({ children, onProjectDeleted }) {
  const [projects, setProjects] = useState(() => {
    try {
      const saved = getSafeStorageItem(STORAGE_KEY_PROJECTS, null) || getSafeStorageItem(STORAGE_KEY_PROJECTS_LEGACY, null);
      if (saved && Array.isArray(saved)) return saved;
    } catch (err) {
      console.warn('Failed to parse saved projects:', err);
    }
    return DEFAULT_PROJECTS;
  });

  const [lastUsedProjectId, setLastUsedProjectId] = useState(() => {
    try {
      return getSafeStorageItem(STORAGE_KEY_LAST_PROJECT, null) || getSafeStorageItem(STORAGE_KEY_LAST_PROJECT_LEGACY, null);
    } catch {
      return null;
    }
  });

  const [isManagingProjects, setIsManagingProjects] = useState(false);
  const onProjectDeletedListenersRef = useRef(new Set());

  const registerOnProjectDeleted = useCallback((fn) => {
    if (typeof fn === 'function') {
      onProjectDeletedListenersRef.current.add(fn);
      return () => {
        onProjectDeletedListenersRef.current.delete(fn);
      };
    }
    return () => {};
  }, []);

  // Sync projects to safe storage
  useEffect(() => {
    setSafeStorageItem(STORAGE_KEY_PROJECTS, projects);
  }, [projects]);

  // Sync last used project
  useEffect(() => {
    if (lastUsedProjectId) {
      setSafeStorageItem(STORAGE_KEY_LAST_PROJECT, lastUsedProjectId);
    } else {
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.removeItem(STORAGE_KEY_LAST_PROJECT);
        } catch {
          // ignore
        }
      }
    }
  }, [lastUsedProjectId]);

  const getProject = useCallback(
    (id) => {
      if (!id) return null;
      return projects.find((p) => p.id === id) || null;
    },
    [projects]
  );

  const createProject = useCallback(
    (name) => {
      const trimmed = (name || '').trim();
      if (!trimmed) return null;

      // Duplicate check (case-insensitive) - BUG-12
      const isDuplicate = projects.some(
        (p) => p.name.trim().toLowerCase() === trimmed.toLowerCase()
      );
      if (isDuplicate) {
        return null;
      }

      const newProject = {
        id: `proj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: trimmed,
        colorIndex: projects.length % 8,
      };

      setProjects((prev) => [...prev, newProject]);
      setLastUsedProjectId(newProject.id);
      return newProject;
    },
    [projects]
  );

  const renameProject = useCallback(
    (id, newName) => {
      const trimmed = (newName || '').trim();
      if (!trimmed) return false;

      // Duplicate check (case-insensitive, excluding current project) - BUG-12 / BUG-17
      const isDuplicate = projects.some(
        (p) => p.id !== id && p.name.trim().toLowerCase() === trimmed.toLowerCase()
      );
      if (isDuplicate) {
        return false;
      }

      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, name: trimmed } : p))
      );
      return true;
    },
    [projects]
  );

  const deleteProject = useCallback(
    (id) => {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (lastUsedProjectId === id) {
        setLastUsedProjectId(null);
      }
      if (typeof onProjectDeleted === 'function') {
        onProjectDeleted(id);
      }
      onProjectDeletedListenersRef.current.forEach((fn) => {
        try {
          fn(id);
        } catch (err) {
          console.error('Error in onProjectDeleted listener:', err);
        }
      });
    },
    [lastUsedProjectId, onProjectDeleted]
  );

  const value = {
    projects,
    setProjects,
    getProject,
    createProject,
    renameProject,
    deleteProject,
    registerOnProjectDeleted,
    lastUsedProjectId,
    setLastUsedProjectId,
    isManagingProjects,
    setIsManagingProjects,
  };

  return <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>;
}

export function useProjects() {
  const ctx = useContext(ProjectsContext);
  if (!ctx) {
    throw new Error('useProjects must be used within ProjectsProvider');
  }
  return ctx;
}
