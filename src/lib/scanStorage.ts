import type { Scan } from '../types';

const DATABASE_NAME = 'dupedetective';
const DATABASE_VERSION = 1;
const SCANS_STORE = 'scans';

let databasePromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (databasePromise) return databasePromise;

  const opening = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is unavailable'));
      return;
    }

    let request: IDBOpenDBRequest;
    try {
      request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    } catch (error) {
      reject(error);
      return;
    }

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(SCANS_STORE)) {
        database.createObjectStore(SCANS_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => {
      const database = request.result;
      database.onversionchange = () => {
        database.close();
        databasePromise = null;
      };
      resolve(database);
    };
    request.onerror = () => reject(request.error ?? new Error('Could not open scan storage'));
    request.onblocked = () => reject(new Error('Scan storage is blocked by another tab'));
  }).catch((error) => {
    databasePromise = null;
    throw error;
  });

  databasePromise = opening;
  return opening;
}

export async function loadSavedScans(): Promise<Scan[]> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(SCANS_STORE, 'readonly');
    const request = transaction.objectStore(SCANS_STORE).getAll();
    transaction.oncomplete = () => resolve(request.result as Scan[]);
    transaction.onerror = () =>
      reject(transaction.error ?? new Error('Could not load saved scans'));
    transaction.onabort = () =>
      reject(transaction.error ?? new Error('Loading saved scans was aborted'));
  });
}

export async function saveScan(scan: Scan): Promise<void> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(SCANS_STORE, 'readwrite');
    transaction.objectStore(SCANS_STORE).put(scan);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Could not save scan'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Saving scan was aborted'));
  });
}

export async function deleteSavedScan(id: string): Promise<void> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(SCANS_STORE, 'readwrite');
    transaction.objectStore(SCANS_STORE).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Could not delete scan'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Deleting scan was aborted'));
  });
}
