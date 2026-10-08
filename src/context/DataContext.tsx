import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  getDocs,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { School, Announcement, Association } from '../types';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { toast } from 'sonner';

const CACHE_KEY = 'pss_offline_data_cache_v3';
const CACHE_TIMESTAMP_KEY = 'pss_last_sync_timestamp_v3';

// Helper to get reliable timestamp from Admin Set Date (eventDate) or fallback to publishedAt
export const getAnnouncementTimestamp = (a: { eventDate?: string; publishedAt?: string }): number => {
  if (a.eventDate && typeof a.eventDate === 'string' && a.eventDate.trim()) {
    const raw = a.eventDate.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      const parts = raw.split('-');
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      return new Date(y, m, d, 12, 0, 0).getTime();
    }
    const t = new Date(raw.includes('T') ? raw : `${raw}T12:00:00Z`).getTime();
    if (!isNaN(t)) return t;
  }
  if (a.publishedAt) {
    const t = new Date(a.publishedAt).getTime();
    if (!isNaN(t)) return t;
  }
  return 0;
};

// Helper to sort announcements strictly by Admin Set Date (eventDate) descending
export const sortAnnouncementsByEventDate = (list: Announcement[]): Announcement[] => {
  return [...list].sort((a, b) => {
    const timeA = getAnnouncementTimestamp(a);
    const timeB = getAnnouncementTimestamp(b);
    return timeB - timeA;
  });
};

interface CachePayload {
  schools: School[];
  announcements: Announcement[];
  associations: Association[];
  timestamp: number;
}

interface DataContextType {
  schools: School[];
  announcements: Announcement[];
  associations: Association[];
  loading: boolean;
  isSyncing: boolean;
  lastSyncTime: number | null;
  isOffline: boolean;
  syncData: (force?: boolean) => Promise<void>;
  getSchoolById: (id: string) => School | undefined;
  // Robust CRUD Operations with instant optimistic update & storage persistence
  addSchool: (schoolData: Omit<School, 'id' | 'createdAt'>) => Promise<string>;
  updateSchool: (id: string, schoolData: Partial<School>) => Promise<void>;
  deleteSchool: (id: string) => Promise<void>;
  addAnnouncement: (data: Omit<Announcement, 'id'>) => Promise<string>;
  updateAnnouncement: (id: string, data: Partial<Announcement>) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isOnline = useOnlineStatus();
  const [schools, setSchools] = useState<School[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);

  // Helper to persist current state to localStorage safely
  const persistCache = useCallback(
    (newSchools: School[], newAnnouncements: Announcement[], newAssociations: Association[]) => {
      const now = Date.now();
      setLastSyncTime(now);
      const payload: CachePayload = {
        schools: newSchools,
        announcements: newAnnouncements,
        associations: newAssociations,
        timestamp: now,
      };
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
        localStorage.setItem(CACHE_TIMESTAMP_KEY, now.toString());
      } catch (err) {
        console.warn('Failed to persist cache to localStorage:', err);
      }
    },
    []
  );

  // 1. Initial Load: Read from LocalStorage immediately (0ms delay)
  useEffect(() => {
    try {
      // Check v3 cache first, fallback to v2 if present
      const cachedRaw = localStorage.getItem(CACHE_KEY) || localStorage.getItem('pss_offline_data_cache_v2');
      const cachedTime = localStorage.getItem(CACHE_TIMESTAMP_KEY) || localStorage.getItem('pss_last_sync_timestamp');

      if (cachedRaw) {
        const parsed: CachePayload = JSON.parse(cachedRaw);
        if (Array.isArray(parsed.schools) && parsed.schools.length > 0) {
          setSchools(parsed.schools);
        }
        if (Array.isArray(parsed.announcements) && parsed.announcements.length > 0) {
          setAnnouncements(sortAnnouncementsByEventDate(parsed.announcements));
        }
        if (Array.isArray(parsed.associations) && parsed.associations.length > 0) {
          setAssociations(parsed.associations);
        }
        if (cachedTime) {
          setLastSyncTime(parseInt(cachedTime, 10));
        }
        // Data present, unblock immediately
        setLoading(false);
      }
    } catch (e) {
      console.warn('Failed to read from offline cache:', e);
    }
  }, []);

  // 2. Real-Time Snapshot Listeners: Listen for changes across Firestore collections
  useEffect(() => {
    let unsubSchools: (() => void) | undefined;
    let unsubAnnouncements: (() => void) | undefined;
    let unsubAssociations: (() => void) | undefined;

    try {
      // Schools real-time listener
      unsubSchools = onSnapshot(
        collection(db, 'schools'),
        (snapshot) => {
          const updatedSchools = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          })) as School[];

          setSchools(updatedSchools);
          setLoading(false);
          // Persist immediately to localStorage
          setAnnouncements((curAnnounce) => {
            setAssociations((curAssoc) => {
              persistCache(updatedSchools, curAnnounce, curAssoc);
              return curAssoc;
            });
            return curAnnounce;
          });
        },
        (error) => {
          console.warn('Realtime schools listener error (offline or rules fallback):', error);
          setLoading(false);
        }
      );

      // Announcements real-time listener
      unsubAnnouncements = onSnapshot(
        collection(db, 'announcements'),
        (snapshot) => {
          const updated = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          })) as Announcement[];
          setAnnouncements(sortAnnouncementsByEventDate(updated));
        },
        (error) => {
          console.warn('Realtime announcements listener error:', error);
        }
      );

      // Associations real-time listener
      unsubAssociations = onSnapshot(
        collection(db, 'associations'),
        (snapshot) => {
          const updated = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          })) as Association[];
          setAssociations(updated);
        },
        (error) => {
          console.warn('Realtime associations listener error:', error);
        }
      );
    } catch (err) {
      console.warn('Error setting up onSnapshot listeners:', err);
      setLoading(false);
    }

    return () => {
      if (unsubSchools) unsubSchools();
      if (unsubAnnouncements) unsubAnnouncements();
      if (unsubAssociations) unsubAssociations();
    };
  }, [persistCache]);

  // 3. Manual / Background Sync function (forces fresh fetch)
  const syncData = useCallback(
    async (force: boolean = false) => {
      if (!navigator.onLine && !force) {
        setLoading(false);
        return;
      }

      setIsSyncing(true);

      try {
        const [schoolsSnap, announcementsSnap, associationsSnap] = await Promise.all([
          getDocs(collection(db, 'schools')),
          getDocs(query(collection(db, 'announcements'), orderBy('publishedAt', 'desc'))),
          getDocs(collection(db, 'associations')),
        ]);

        const fetchedSchools = schoolsSnap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as School[];

        const fetchedAnnouncements = announcementsSnap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as Announcement[];

        const fetchedAssociations = associationsSnap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as Association[];

        setSchools(fetchedSchools);
        setAnnouncements(sortAnnouncementsByEventDate(fetchedAnnouncements));
        setAssociations(fetchedAssociations);
        persistCache(fetchedSchools, sortAnnouncementsByEventDate(fetchedAnnouncements), fetchedAssociations);

        if (force) {
          toast.success('အချက်အလက်များ အောင်မြင်စွာ နောက်ဆုံးဗားရှင်းသို့ Sync လုပ်ပြီးပါပြီ');
        }
      } catch (err) {
        console.error('Offline Sync background error:', err);
        if (force) {
          toast.error('အင်တာနက် အချိတ်အဆက် မရရှိသေးသဖြင့် Offline Data ကို ဆက်လက် အသုံးပြုနေပါသည်');
        }
      } finally {
        setIsSyncing(false);
        setLoading(false);
      }
    },
    [persistCache]
  );

  // 4. Auto-sync on connection online
  useEffect(() => {
    const handleOnline = () => {
      syncData(false);
    };

    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [syncData]);

  // 5. Direct Mutation Helpers (Optimistic Update + Firestore Persistence + LocalStorage)
  const addSchool = useCallback(
    async (schoolData: Omit<School, 'id' | 'createdAt'>): Promise<string> => {
      const now = new Date().toISOString();
      const payload = {
        ...schoolData,
        createdAt: now,
      };

      // 1. Write to Firestore
      const docRef = await addDoc(collection(db, 'schools'), payload);
      const newSchool: School = {
        id: docRef.id,
        ...payload,
      };

      // 2. Optimistic UI update immediately
      setSchools((prev) => {
        const next = [newSchool, ...prev.filter((s) => s.id !== docRef.id)];
        persistCache(next, announcements, associations);
        return next;
      });

      return docRef.id;
    },
    [announcements, associations, persistCache]
  );

  const updateSchool = useCallback(
    async (id: string, schoolData: Partial<School>): Promise<void> => {
      const payload = {
        ...schoolData,
        updatedAt: new Date().toISOString(),
      };

      // 1. Optimistic UI update immediately
      setSchools((prev) => {
        const next = prev.map((s) => (s.id === id ? { ...s, ...payload } : s));
        persistCache(next, announcements, associations);
        return next;
      });

      // 2. Write to Firestore
      await updateDoc(doc(db, 'schools', id), payload);
    },
    [announcements, associations, persistCache]
  );

  const deleteSchool = useCallback(
    async (id: string): Promise<void> => {
      // 1. Optimistic UI update immediately
      setSchools((prev) => {
        const next = prev.filter((s) => s.id !== id);
        persistCache(next, announcements, associations);
        return next;
      });

      // 2. Delete from Firestore
      await deleteDoc(doc(db, 'schools', id));
    },
    [announcements, associations, persistCache]
  );

  const addAnnouncement = useCallback(
    async (data: Omit<Announcement, 'id'>): Promise<string> => {
      const docRef = await addDoc(collection(db, 'announcements'), data);
      const newAnnouncement: Announcement = {
        id: docRef.id,
        ...data,
      };

      setAnnouncements((prev) => {
        const next = sortAnnouncementsByEventDate([newAnnouncement, ...prev.filter((a) => a.id !== docRef.id)]);
        persistCache(schools, next, associations);
        return next;
      });

      return docRef.id;
    },
    [schools, associations, persistCache]
  );

  const updateAnnouncement = useCallback(
    async (id: string, data: Partial<Announcement>): Promise<void> => {
      setAnnouncements((prev) => {
        const next = sortAnnouncementsByEventDate(prev.map((a) => (a.id === id ? { ...a, ...data } : a)));
        persistCache(schools, next, associations);
        return next;
      });

      await updateDoc(doc(db, 'announcements', id), data);
    },
    [schools, associations, persistCache]
  );

  const deleteAnnouncement = useCallback(
    async (id: string): Promise<void> => {
      setAnnouncements((prev) => {
        const next = prev.filter((a) => a.id !== id);
        persistCache(schools, next, associations);
        return next;
      });

      await deleteDoc(doc(db, 'announcements', id));
    },
    [schools, associations, persistCache]
  );

  const getSchoolById = useCallback(
    (id: string) => {
      return schools.find((s) => s.id === id);
    },
    [schools]
  );

  const value = useMemo(
    () => ({
      schools,
      announcements,
      associations,
      loading,
      isSyncing,
      lastSyncTime,
      isOffline: !isOnline,
      syncData,
      getSchoolById,
      addSchool,
      updateSchool,
      deleteSchool,
      addAnnouncement,
      updateAnnouncement,
      deleteAnnouncement,
    }),
    [
      schools,
      announcements,
      associations,
      loading,
      isSyncing,
      lastSyncTime,
      isOnline,
      syncData,
      getSchoolById,
      addSchool,
      updateSchool,
      deleteSchool,
      addAnnouncement,
      updateAnnouncement,
      deleteAnnouncement,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
