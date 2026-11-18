import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutGrid,
  List as ListIcon,
  Star,
  Sun,
  Moon,
  Pin,
  Download,
  Upload,
  MoreVertical,
  Search,
  X,
  Folder,
  Bell,
} from 'lucide-react';
import { useNotes } from '../context/NotesContext';
import { useProjects } from '../context/ProjectsContext';
import { validateImportData } from '../utils/importValidation';
import { ImportModal } from './ImportModal';

export function Header({ quickAddInputRef, permission, onRequestPermission }) {
  const {
    view,
    setView,
    theme,
    toggleTheme,
    searchQuery,
    setSearchQuery,
    isPipSupported,
    pipWindow,
    togglePipMode,
    exportNotes,
    importNotes,
    notes,
    todayNotes,
  } = useNotes();

  const { setIsManagingProjects, projects } = useProjects();

  const [menuOpen, setMenuOpen] = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  const [pendingImport, setPendingImport] = useState(null);
  const menuRef = useRef(null);
  const fileInputRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        const validation = validateImportData(content);
        if (!validation.success) {
          setImportStatus(`Import rejected: ${validation.error}`);
          setTimeout(() => setImportStatus(null), 4000);
          return;
        }
        setPendingImport(validation);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
    setMenuOpen(false);
  };

  const handleConfirmImport = (importedNotes, importedProjects, strategy) => {
    const result = importNotes(importedNotes, importedProjects, strategy);
    if (result.success) {
      setImportStatus(`Imported ${result.count} notes successfully!`);
    } else {
      setImportStatus(`Failed to import: ${result.error}`);
    }
    setPendingImport(null);
    setTimeout(() => setImportStatus(null), 3500);
  };

  return (
    <header className="header-wrapper" role="banner">
      <div className="header-inner">
        {/* Logo and Branding */}
        <div className="logo-area" title="TaskDock">
          <img
            src="/favicon-transparent.png"
            alt="TaskDock logo"
            className="logo-mark-img"
            width="32"
            height="32"
          />
          <h1 className="logo-title">
            <span className="logo-text-task">Task</span><span className="logo-text-dock">Dock</span>
            <span className="logo-tag">Quick Capture</span>
          </h1>
        </div>

        {/* Search bar */}
        <div className="header-center">
          <div className="header-search-bar">
            <Search size={16} className="search-icon-inside" aria-hidden="true" />
            <input
              type="text"
              className="search-input"
              placeholder="Search notes, context, or projects... ('/' to dock)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search notes"
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchQuery('')}
                title="Clear search"
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Actions & Utilities */}
        <div className="header-actions">
          {/* View Switcher: Wall | List | Today */}
          <div className="view-switcher" role="radiogroup" aria-label="View mode">
            <button
              type="button"
              className={`view-btn ${view === 'wall' ? 'active' : ''}`}
              onClick={() => setView('wall')}
              role="radio"
              aria-checked={view === 'wall'}
              title="Sticky Wall view"
            >
              <LayoutGrid size={15} />
              <span>Wall</span>
            </button>
            <button
              type="button"
              className={`view-btn ${view === 'list' ? 'active' : ''}`}
              onClick={() => setView('list')}
              role="radio"
              aria-checked={view === 'list'}
              title="Compact list view"
            >
              <ListIcon size={15} />
              <span>List</span>
            </button>
            <button
              type="button"
              className={`view-btn ${view === 'today' ? 'active' : ''}`}
              onClick={() => setView('today')}
              role="radio"
              aria-checked={view === 'today'}
              title="Today's focused items"
            >
              <Star size={15} />
              <span>Today</span>
              {todayNotes.length > 0 && (
                <span className="view-count-badge">{todayNotes.length}</span>
              )}
            </button>
          </div>

          {/* Manage Projects button */}
          <button
            type="button"
            className="icon-btn"
            onClick={() => setIsManagingProjects(true)}
            title="Manage projects"
            aria-label="Manage projects"
          >
            <Folder size={17} />
          </button>

          {/* Document Picture-in-Picture Pin Mini Mode */}
          {isPipSupported && (
            <button
              type="button"
              className={`icon-btn pin-btn ${pipWindow ? 'active' : ''}`}
              onClick={togglePipMode}
              title={
                pipWindow
                  ? 'Close pinned sticky window'
                  : 'Pin mini sticky mode (shows Quick Add + Today notes)'
              }
              aria-label="Toggle Document Picture-in-Picture sticky mode"
            >
              <Pin size={17} />
            </button>
          )}

          {/* Dark / Light Theme Toggle */}
          <button
            type="button"
            className="icon-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            aria-label="Toggle color theme"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Export / Import Menu */}
          <div className="menu-container" ref={menuRef}>
            <button
              type="button"
              className="icon-btn"
              onClick={() => setMenuOpen((prev) => !prev)}
              title="Backup & Restore (JSON)"
              aria-label="Backup and options menu"
              aria-expanded={menuOpen}
            >
              <MoreVertical size={17} />
            </button>

            {menuOpen && (
              <div className="menu-dropdown" role="menu">
                <button
                  type="button"
                  className="menu-item"
                  onClick={() => {
                    setIsManagingProjects(true);
                    setMenuOpen(false);
                  }}
                  role="menuitem"
                >
                  <Folder size={15} />
                  <span>Manage Projects ({projects.length})</span>
                </button>

                <button
                  type="button"
                  className="menu-item"
                  onClick={async () => {
                    if (onRequestPermission) {
                      await onRequestPermission();
                    }
                  }}
                  role="menuitem"
                >
                  <Bell size={15} />
                  <span>
                    {permission === 'granted'
                      ? 'System Alerts: Enabled'
                      : 'Enable Desktop Alerts'}
                  </span>
                </button>

                <div className="menu-divider" />

                <button
                  type="button"
                  className="menu-item"
                  onClick={() => {
                    exportNotes();
                    setMenuOpen(false);
                  }}
                  role="menuitem"
                >
                  <Download size={15} />
                  <span>Export Backup (JSON)</span>
                </button>

                <button
                  type="button"
                  className="menu-item"
                  onClick={() => fileInputRef.current?.click()}
                  role="menuitem"
                >
                  <Upload size={15} />
                  <span>Import Backup (JSON)</span>
                </button>

                <div className="menu-divider" />
                <div style={{ padding: '6px 12px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Total: {notes.length} notes · {todayNotes.length} for today
                </div>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              style={{ display: 'none' }}
            />
          </div>
        </div>
      </div>

      {importStatus && (
        <div
          style={{
            textAlign: 'center',
            fontSize: '12.5px',
            padding: '6px',
            backgroundColor: 'var(--accent)',
            color: 'var(--accent-text)',
            fontWeight: 500,
          }}
        >
          {importStatus}
        </div>
      )}

      {pendingImport && (
        <ImportModal
          importData={pendingImport}
          existingNotes={notes}
          onConfirm={handleConfirmImport}
          onCancel={() => setPendingImport(null)}
        />
      )}
    </header>
  );
}
