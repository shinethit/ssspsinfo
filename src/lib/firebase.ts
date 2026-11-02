import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  memoryLocalCache,
  Firestore,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase config: prefer VITE_FIREBASE_* env vars, fall back to the
// built-in project values when an env var is missing.
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBfH74OIc-8mJIPTjjFhD7JDwkMWBWcC_E",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "southernshanstatepsinfo.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "southernshanstatepsinfo",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "southernshanstatepsinfo.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "474970491001",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:474970491001:web:4bb740401f9e9fb73aaca8"
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with force long polling and multi-tab persistence on default database
let firestoreDb: Firestore;
try {
  firestoreDb = initializeFirestore(app, {
    experimentalForceLongPolling: true,
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
} catch {
  try {
    firestoreDb = initializeFirestore(app, {
      experimentalForceLongPolling: true,
      localCache: memoryLocalCache(),
    });
  } catch {
    firestoreDb = getFirestore(app);
  }
}

/**
 * Recursively cleans an object/array for Firestore writes,
 * stripping out all `undefined` values which Firestore strictly forbids.
 */
export function cleanFirestoreData<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as any;
  }
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => cleanFirestoreData(item)) as any;
  }
  if (typeof obj === 'object') {
    if (obj.constructor && obj.constructor.name !== 'Object') {
      return obj;
    }
    const cleaned: Record<string, any> = {};
    for (const [key, val] of Object.entries(obj as Record<string, any>)) {
      if (val !== undefined) {
        cleaned[key] = cleanFirestoreData(val);
      }
    }
    return cleaned as T;
  }
  return obj;
}

export const db = firestoreDb;
export const auth = getAuth(app);
export const storage = getStorage(app);
