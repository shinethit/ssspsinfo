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
  setDoc,
  getDoc,
  writeBatch,
} from 'firebase/firestore';
import { db, cleanFirestoreData } from '../lib/firebase';
import { School, Announcement, Association, DEFAULT_SCHOOL_LEVELS, SchoolLevelItem } from '../types';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { toast } from 'sonner';

const CACHE_KEY = 'pss_offline_data_cache_v5';
const CACHE_TIMESTAMP_KEY = 'pss_last_sync_timestamp_v5';
const LEVELS_CACHE_KEY = 'pss_school_levels_cache_v2';

export const getDefaultSchoolLevels = (): SchoolLevelItem[] => {
  return DEFAULT_SCHOOL_LEVELS.map((name, idx) => ({
    id: `default-${idx + 1}`,
    name,
    order: idx + 1,
    description: `အဆင့်သတ်မှတ်ချက် (${name})`,
    createdAt: new Date().toISOString(),
  }));
};

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
  schoolLevels: SchoolLevelItem[];
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
  // School Levels Management (Admin-customizable)
  addSchoolLevel: (name: string, description?: string, order?: number) => Promise<string>;
  updateSchoolLevel: (id: string, data: Partial<SchoolLevelItem>) => Promise<void>;
  deleteSchoolLevel: (id: string) => Promise<void>;
  resetSchoolLevelsToDefault: () => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isOnline = useOnlineStatus();
  const [schools, setSchools] = useState<School[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [schoolLevels, setSchoolLevels] = useState<SchoolLevelItem[]>(() => {
    try {
      const cached = localStorage.getItem(LEVELS_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse cached school levels:', e);
    }
    return getDefaultSchoolLevels();
  });
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
      // Note: Do NOT delete v2 or prior caches, as they might hold the user's authentic offline data!
      // Only remove the temporary v3/v4 dummy caches if needed
      localStorage.removeItem('pss_offline_data_cache_v3');
      localStorage.removeItem('pss_offline_data_cache_v4');

      const cachedRaw = localStorage.getItem(CACHE_KEY);
      const cachedTime = localStorage.getItem(CACHE_TIMESTAMP_KEY);

      if (cachedRaw) {
        const parsed: CachePayload = JSON.parse(cachedRaw);
        if (Array.isArray(parsed.schools)) {
          setSchools(parsed.schools);
        }
        if (Array.isArray(parsed.announcements)) {
          setAnnouncements(sortAnnouncementsByEventDate(parsed.announcements));
        }
        if (Array.isArray(parsed.associations)) {
          setAssociations(parsed.associations);
        }

        if (cachedTime) {
          setLastSyncTime(parseInt(cachedTime, 10));
        }
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
    let unsubLevels: (() => void) | undefined;

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

      // School Levels real-time listener
      unsubLevels = onSnapshot(
        collection(db, 'school_levels'),
        (snapshot) => {
          if (!snapshot.empty) {
            const updated = snapshot.docs.map((docSnap) => ({
              id: docSnap.id,
              ...docSnap.data(),
            })) as SchoolLevelItem[];
            updated.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
            setSchoolLevels(updated);
            try {
              localStorage.setItem(LEVELS_CACHE_KEY, JSON.stringify(updated));
            } catch (e) {}
          }
        },
        (error) => {
          console.warn('Realtime school_levels listener error:', error);
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
      if (unsubLevels) unsubLevels();
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
        const [schoolsSnap, announcementsSnap, associationsSnap, levelsSnap] = await Promise.all([
          getDocs(collection(db, 'schools')),
          getDocs(query(collection(db, 'announcements'), orderBy('publishedAt', 'desc'))),
          getDocs(collection(db, 'associations')),
          getDocs(collection(db, 'school_levels')),
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

        if (!levelsSnap.empty) {
          const fetchedLevels = levelsSnap.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          })) as SchoolLevelItem[];
          fetchedLevels.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
          setSchoolLevels(fetchedLevels);
          try {
            localStorage.setItem(LEVELS_CACHE_KEY, JSON.stringify(fetchedLevels));
          } catch (e) {}
        }

        if (force) {
          toast.success('Sync အောင်မြင်ပါသည်');
        }
      } catch (err) {
        console.error('Offline Sync background error:', err);
        if (force) {
          toast.error('Offline ဒေတာ အသုံးပြုနေပါသည်');
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
      const cleanPayload = cleanFirestoreData(payload);
      const docRef = await addDoc(collection(db, 'schools'), cleanPayload);
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
      const cleanPayload = cleanFirestoreData(payload);
      await updateDoc(doc(db, 'schools', id), cleanPayload);
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
      const cleanData = cleanFirestoreData(data);
      const docRef = await addDoc(collection(db, 'announcements'), cleanData);
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

      const cleanData = cleanFirestoreData(data);
      await updateDoc(doc(db, 'announcements', id), cleanData);
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

  // School Level Mutation Helpers
  const addSchoolLevel = useCallback(
    async (name: string, description?: string, order?: number): Promise<string> => {
      const cleanName = name.trim();
      if (!cleanName) throw new Error('ကျောင်းအဆင့် အမည် လိုအပ်ပါသည်');
      const newOrder = order ?? (schoolLevels.length + 1);
      const payload = {
        name: cleanName,
        description: description?.trim() || '',
        order: newOrder,
        createdAt: new Date().toISOString(),
      };
      const docRef = await addDoc(collection(db, 'school_levels'), payload);
      const newItem: SchoolLevelItem = { id: docRef.id, ...payload };
      setSchoolLevels((prev) => {
        const next = [...prev.filter((l) => l.id !== docRef.id), newItem].sort(
          (a, b) => (a.order ?? 999) - (b.order ?? 999)
        );
        try {
          localStorage.setItem(LEVELS_CACHE_KEY, JSON.stringify(next));
        } catch (e) {}
        return next;
      });
      return docRef.id;
    },
    [schoolLevels]
  );

  const updateSchoolLevel = useCallback(
    async (id: string, data: Partial<SchoolLevelItem>): Promise<void> => {
      const existing = schoolLevels.find((l) => l.id === id);
      const oldName = existing?.name?.trim();
      const newName = data.name?.trim();

      setSchoolLevels((prev) => {
        const next = prev
          .map((l) => (l.id === id ? { ...l, ...data } : l))
          .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
        try {
          localStorage.setItem(LEVELS_CACHE_KEY, JSON.stringify(next));
        } catch (e) {}
        return next;
      });

      if (!id.startsWith('default-')) {
        await updateDoc(doc(db, 'school_levels', id), data);
      } else {
        const payload = {
          name: newName ?? existing?.name ?? '',
          description: data.description ?? existing?.description ?? '',
          order: data.order ?? existing?.order ?? 1,
          createdAt: new Date().toISOString(),
        };
        await addDoc(collection(db, 'school_levels'), payload);
      }

      // If level name changed, automatically migrate all schools under the old level name
      if (oldName && newName && oldName.toLowerCase() !== newName.toLowerCase()) {
        const affectedSchools = schools.filter(
          (s) => (s.level || '').trim().toLowerCase() === oldName.toLowerCase()
        );
        if (affectedSchools.length > 0) {
          setSchools((prev) =>
            prev.map((s) =>
              (s.level || '').trim().toLowerCase() === oldName.toLowerCase()
                ? { ...s, level: newName }
                : s
            )
          );
          try {
            const batch = writeBatch(db);
            affectedSchools.forEach((s) => {
              batch.update(doc(db, 'schools', s.id), { level: newName });
            });
            await batch.commit();
          } catch (e) {
            console.warn('Batch update schools on level rename error:', e);
          }
        }
      }
    },
    [schoolLevels, schools]
  );

  const deleteSchoolLevel = useCallback(
    async (id: string): Promise<void> => {
      const existing = schoolLevels.find((l) => l.id === id);
      const oldName = existing?.name?.trim();

      setSchoolLevels((prev) => {
        const next = prev.filter((l) => l.id !== id);
        try {
          localStorage.setItem(LEVELS_CACHE_KEY, JSON.stringify(next));
        } catch (e) {}
        return next;
      });

      if (!id.startsWith('default-')) {
        await deleteDoc(doc(db, 'school_levels', id));
      }

      // If deleted level had schools, update local schools so they don't break
      if (oldName) {
        const affectedSchools = schools.filter(
          (s) => (s.level || '').trim().toLowerCase() === oldName.toLowerCase()
        );
        if (affectedSchools.length > 0) {
          setSchools((prev) =>
            prev.map((s) =>
              (s.level || '').trim().toLowerCase() === oldName.toLowerCase()
                ? { ...s, level: '' }
                : s
            )
          );
          try {
            const batch = writeBatch(db);
            affectedSchools.forEach((s) => {
              batch.update(doc(db, 'schools', s.id), { level: '' });
            });
            await batch.commit();
          } catch (e) {
            console.warn('Batch clear school levels on delete error:', e);
          }
        }
      }
    },
    [schoolLevels, schools]
  );

  const resetSchoolLevelsToDefault = useCallback(async (): Promise<void> => {
    const defaults = getDefaultSchoolLevels();
    setSchoolLevels(defaults);
    try {
      localStorage.setItem(LEVELS_CACHE_KEY, JSON.stringify(defaults));
    } catch (e) {}

    try {
      const snap = await getDocs(collection(db, 'school_levels'));
      for (const d of snap.docs) {
        await deleteDoc(doc(db, 'school_levels', d.id));
      }
      for (const item of defaults) {
        await addDoc(collection(db, 'school_levels'), {
          name: item.name,
          order: item.order,
          description: item.description,
          createdAt: item.createdAt,
        });
      }
      toast.success('ကျောင်းအဆင့်များ မူလအတိုင်း ပြန်ထားပါပြီ');
    } catch (e) {
      console.warn('Reset school levels error in Firestore:', e);
    }
  }, []);

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
      schoolLevels,
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
      addSchoolLevel,
      updateSchoolLevel,
      deleteSchoolLevel,
      resetSchoolLevelsToDefault,
    }),
    [
      schools,
      announcements,
      associations,
      schoolLevels,
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
      addSchoolLevel,
      updateSchoolLevel,
      deleteSchoolLevel,
      resetSchoolLevelsToDefault,
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
