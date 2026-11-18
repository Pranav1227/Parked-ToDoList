/**
 * Robust, resilient localStorage manager with corrupted data recovery and memory fallback.
 */

let memoryStore = {};
let isStorageAvailable = true;

// Probe storage availability (handles disabled cookies / private browsing exceptions)
try {
  const testKey = '__parked_test__';
  window.localStorage.setItem(testKey, testKey);
  window.localStorage.removeItem(testKey);
} catch {
  isStorageAvailable = false;
  console.warn('localStorage is unavailable (e.g. private mode or disabled). Falling back to memory storage.');
}

export function getSafeStorageItem(key, defaultValue = null) {
  if (!isStorageAvailable) {
    return memoryStore[key] !== undefined ? memoryStore[key] : defaultValue;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null || raw === undefined) {
      return defaultValue;
    }

    try {
      return JSON.parse(raw);
    } catch (parseErr) {
      // Corrupt data: preserve a copy for safety under a recovery key
      const corruptBackupKey = `parked_corrupt_backup_${Date.now()}`;
      try {
        window.localStorage.setItem(corruptBackupKey, raw);
        console.warn(`Corrupted localStorage entry at "${key}". Preserved backup at "${corruptBackupKey}".`);
      } catch {
        // Ignore backup failure if storage is full
      }
      return defaultValue;
    }
  } catch (err) {
    console.error(`Error reading key "${key}" from localStorage:`, err);
    return defaultValue;
  }
}

export function setSafeStorageItem(key, value) {
  const serialized = JSON.stringify(value);

  if (!isStorageAvailable) {
    memoryStore[key] = value;
    return true;
  }

  try {
    window.localStorage.setItem(key, serialized);
    return true;
  } catch (err) {
    console.error(`localStorage error writing "${key}":`, err);

    // If quota exceeded or storage blocked, keep copy in memory so session continues seamlessly
    memoryStore[key] = value;

    // Dispatch warning event so UI can inform user
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(
        new CustomEvent('parked-storage-warning', {
          detail: {
            message: 'Browser storage is full or restricted. Changes will be kept in memory for this session.',
          },
        })
      );
    }
    return false;
  }
}

export function removeSafeStorageItem(key) {
  delete memoryStore[key];
  if (isStorageAvailable) {
    try {
      window.localStorage.removeItem(key);
    } catch (err) {
      console.warn(`Error removing key "${key}":`, err);
    }
  }
}
