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

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBfH74OIc-8mJIPTjjFhD7JDwkMWBWcC_E",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "southernshanstatepsinfo.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "southernshanstatepsinfo",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "southernshanstatepsinfo.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "474970491001",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:474970491001:web:4bb740401f9e9fb73aaca8",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const databaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || "(default)";

// Initialize Firestore with force long polling and multi-tab persistence
let firestoreDb: Firestore;
try {
  firestoreDb = initializeFirestore(
    app,
    {
      experimentalForceLongPolling: true,
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    },
    databaseId
  );
} catch (err) {
  try {
    firestoreDb = initializeFirestore(
      app,
      {
        experimentalForceLongPolling: true,
        localCache: memoryLocalCache(),
      },
      databaseId
    );
  } catch {
    firestoreDb = getFirestore(app, databaseId);
  }
}

export const db = firestoreDb;
export const auth = getAuth(app);
export const storage = getStorage(app);

