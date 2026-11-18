import React, { useRef, useEffect } from 'react';
import { ProjectsProvider, useProjects } from './context/ProjectsContext';
import { NotesProvider, useNotes } from './context/NotesContext';
import { Header } from './components/Header';
import { QuickAdd } from './components/QuickAdd';
import { FilterBar } from './components/FilterBar';
import { StickyWall } from './components/StickyWall';
import { ListView } from './components/ListView';
import { TodayView } from './components/TodayView';
import { EditNoteModal } from './components/EditNoteModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { ProjectManager } from './components/ProjectManager';
import { ReminderBanner } from './components/ReminderBanner';
import { UndoToast } from './components/UndoToast';
import { PipPortal } from './components/PipView';
import { useReminders } from './hooks/useReminders';

function MainAppShell() {
  const { view, notes, updateNote, toggleNoteDone, setNoteReminder } = useNotes();
  const quickAddInputRef = useRef(null);

  // Global keyboard shortcuts: Ctrl+K / Cmd+K and '/' (BUG-02)
  useEffect(() => {
    function handleGlobalKeyDown(e) {
      const activeEl = document.activeElement;
      const isInput =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          activeEl.isContentEditable);

      // Ctrl+K / Cmd+K works from anywhere
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        quickAddInputRef.current?.focus();
        quickAddInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return;
      }

      // '/' works when not typing inside an input/textarea
      if (e.key === '/' && !isInput && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        quickAddInputRef.current?.focus();
        quickAddInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Hook for lightweight reminder checking & native system/desktop notifications
  const {
    dueReminders,
    dismissReminder,
    permission,
    requestNotificationPermission,
  } = useReminders(notes, updateNote);

  return (
    <div className="app-container">
      {/* Due reminders banner for overdue reminders or when browser notification is blocked/unsupported */}
      <ReminderBanner
        dueReminders={dueReminders}
        onSnooze={(id, laterIso) => setNoteReminder(id, laterIso)}
        onDismiss={(id) => dismissReminder(id)}
        onMarkDone={(id) => toggleNoteDone(id)}
        permission={permission}
        onRequestPermission={requestNotificationPermission}
      />

      <Header
        quickAddInputRef={quickAddInputRef}
        permission={permission}
        onRequestPermission={requestNotificationPermission}
      />

      <main className="main-content">
        <QuickAdd
          inputRef={quickAddInputRef}
          onRequestPermission={requestNotificationPermission}
        />
        <FilterBar />

        {view === 'wall' && <StickyWall />}
        {view === 'list' && <ListView />}
        {view === 'today' && <TodayView />}
      </main>

      <EditNoteModal onRequestPermission={requestNotificationPermission} />
      <DeleteConfirmModal />
      <ProjectManager />
      <UndoToast />
      <PipPortal />
    </div>
  );
}

function AppWithProviders() {
  const { projects, setProjects, registerOnProjectDeleted } = useProjects();

  return (
    <NotesProvider
      projects={projects}
      setProjects={setProjects}
      registerOnProjectDeleted={registerOnProjectDeleted}
    >
      <MainAppShell />
    </NotesProvider>
  );
}

export default function App() {
  return (
    <ProjectsProvider>
      <AppWithProviders />
    </ProjectsProvider>
  );
}
