import { useState, useEffect, useCallback, useRef } from 'react';

const NOTIFICATION_LOCK_PREFIX = 'taskdock_notified_lock_';
const CHANNEL_NAME = 'taskdock_reminders_sync_channel';

export function useReminders(notes, updateNote) {
  const [permission, setPermission] = useState(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });

  const [dueReminders, setDueReminders] = useState([]);
  const sessionStartTimeRef = useRef(Date.now());
  const channelRef = useRef(null);

  // Set up BroadcastChannel for multi-tab sync
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const channel = new BroadcastChannel(CHANNEL_NAME);
        channelRef.current = channel;

        channel.onmessage = (event) => {
          if (event.data?.type === 'NOTIFICATION_FIRED' && Array.isArray(event.data.noteIds)) {
            // Another tab already fired notification for these noteIds
            event.data.noteIds.forEach((id) => {
              updateNote(id, { reminderFired: true });
            });
          }
        };

        return () => {
          channel.close();
        };
      } catch (err) {
        console.warn('BroadcastChannel initialization failed:', err);
      }
    }
  }, [updateNote]);

  // Request Notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    if (Notification.permission === 'granted') {
      setPermission('granted');
      return 'granted';
    }
    if (Notification.permission === 'denied') {
      setPermission('denied');
      return 'denied';
    }

    try {
      const res = await Notification.requestPermission();
      setPermission(res);
      return res;
    } catch {
      return 'denied';
    }
  }, []);

  // Shared lock check across tabs using localStorage timestamp
  const claimNotificationLock = useCallback((noteId) => {
    if (typeof window === 'undefined' || !window.localStorage) return true;
    const lockKey = `${NOTIFICATION_LOCK_PREFIX}${noteId}`;
    const now = Date.now();
    try {
      const existing = localStorage.getItem(lockKey);
      if (existing) {
        const timestamp = Number(existing);
        // If locked within the last 60 seconds, another tab handled it
        if (!isNaN(timestamp) && (now - timestamp) < 60000) {
          return false;
        }
      }
      localStorage.setItem(lockKey, String(now));
      return true;
    } catch {
      return true;
    }
  }, []);

  // Show native system/desktop notification
  const fireSystemNotification = useCallback(async (title, options) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    // 1. Try Service Worker showNotification first for native Windows toast
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.showNotification) {
          await registration.showNotification(title, {
            icon: '/icon.svg',
            badge: '/icon.svg',
            requireInteraction: true,
            ...options,
          });
          return;
        }
      }
    } catch {
      // Fallback to Window Notification API
    }

    // 2. Standard Web Notification
    try {
      const notif = new Notification(title, {
        icon: '/icon.svg',
        badge: '/icon.svg',
        requireInteraction: true,
        ...options,
      });

      notif.onclick = () => {
        window.focus();
        notif.close();
      };
    } catch (err) {
      console.warn('System Notification invocation failed:', err);
    }
  }, []);

  // Check reminders and fire notifications if due
  const checkDueReminders = useCallback(() => {
    const now = Date.now();
    const newlyDueToNotify = [];
    const activeDue = [];
    const sessionStart = sessionStartTimeRef.current;

    notes.forEach((note) => {
      if (!note.remindAt || note.status === 'Done') return;

      const dueTime = new Date(note.remindAt).getTime();
      if (dueTime <= now) {
        activeDue.push(note);

        if (!note.reminderFired) {
          // Check if this was missed while closed (due more than 60s before session started)
          const wasMissedWhileClosed = dueTime < (sessionStart - 60000);

          if (wasMissedWhileClosed) {
            updateNote(note.id, { reminderFired: true, missed: true });
          } else {
            // Try to claim lock so only ONE tab fires the browser Notification
            if (claimNotificationLock(note.id)) {
              newlyDueToNotify.push(note);
              updateNote(note.id, { reminderFired: true });
            }
          }
        }
      }
    });

    setDueReminders(activeDue);

    // Fire browser system notification only if newly due and lock acquired
    if (newlyDueToNotify.length > 0) {
      if (channelRef.current) {
        try {
          channelRef.current.postMessage({
            type: 'NOTIFICATION_FIRED',
            noteIds: newlyDueToNotify.map((n) => n.id),
          });
        } catch {
          // ignore
        }
      }

      if (newlyDueToNotify.length === 1) {
        fireSystemNotification('TaskDock Reminder Due', {
          body: newlyDueToNotify[0].title,
          tag: `taskdock-${newlyDueToNotify[0].id}`,
        });
      } else {
        const preview = newlyDueToNotify.map((n) => `• ${n.title}`).slice(0, 3).join('\n');
        fireSystemNotification(`TaskDock: ${newlyDueToNotify.length} reminders due`, {
          body: preview,
          tag: 'taskdock-grouped-reminders',
        });
      }
    }
  }, [notes, updateNote, claimNotificationLock, fireSystemNotification]);

  // Periodic interval check (every 20 seconds for responsive notification timing)
  useEffect(() => {
    checkDueReminders();
    const interval = setInterval(checkDueReminders, 20000);
    return () => clearInterval(interval);
  }, [checkDueReminders]);

  // Check on tab focus / visibilitychange
  useEffect(() => {
    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        checkDueReminders();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [checkDueReminders]);

  // Dismiss a due reminder notice
  const dismissReminder = useCallback((noteId) => {
    updateNote(noteId, { remindAt: null, reminderFired: false, missed: false });
    setDueReminders((prev) => prev.filter((n) => n.id !== noteId));
  }, [updateNote]);

  return {
    permission,
    requestNotificationPermission,
    dueReminders,
    dismissReminder,
  };
}
