import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  setDoc,
  getDoc,
  writeBatch,
  query,
  where,
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

// A14: what a school delete cascades to. Returned by deleteSchool /
// getSchoolDeleteImpact so the caller can list the counts in the confirm
// dialog (and in the success message) before anything is deleted.
export interface SchoolDeleteImpact {
  schoolId: string;
  schoolName: string;
  transactionCount: number;
  eventCount: number;
  athleteCount: number;
  registrationCount: number;
  // v24.15 (V31): the school's pending/decided change requests — they used
  // to be left behind as orphans when the school was deleted.
  requestCount: number;
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
  // v24.15 (V4): non-null when a Firestore read failed — pages fed by this
  // context (Home, Dashboard, Contacts, Announcements) must show an honest
  // error state instead of confident "0 / no data" empty states. Set by any
  // onSnapshot error handler (or a failed syncData), cleared when that
  // collection delivers a snapshot again. Message: 'ဒေတာ ဖတ်မရပါ — ပြန်စမ်းကြည့်ပါ'.
  loadError: string | null;
  syncData: (force?: boolean) => Promise<void>;
  getSchoolById: (id: string) => School | undefined;
  // Robust CRUD Operations with instant optimistic update & storage persistence
  addSchool: (schoolData: Omit<School, 'id' | 'createdAt'>) => Promise<string>;
  updateSchool: (id: string, schoolData: Partial<School>) => Promise<void>;
  deleteSchool: (id: string) => Promise<SchoolDeleteImpact>;
  // A14: counts of the records a school delete would cascade to, so the
  // caller (Admin.tsx confirm dialog) can list them before deleting.
  getSchoolDeleteImpact: (id: string) => Promise<SchoolDeleteImpact>;
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
  // v24.15 (V4): which collections are currently in a failed-read state.
  // A single flag would flap (one listener's success clearing another's
  // error), so the error stays until EVERY failed collection recovers.
  const [loadError, setLoadError] = useState<string | null>(null);
  const loadErrorSourcesRef = React.useRef<Set<string>>(new Set());
  const reportLoadError = useCallback((source: string, failed: boolean) => {
    if (failed) loadErrorSourcesRef.current.add(source);
    else loadErrorSourcesRef.current.delete(source);
    setLoadError(
      loadErrorSourcesRef.current.size > 0 ? 'ဒေတာ ဖတ်မရပါ — ပြန်စမ်းကြည့်ပါ' : null
    );
  }, []);

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
          reportLoadError('schools', false);
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
          reportLoadError('schools', true);
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
          reportLoadError('announcements', false);
        },
        (error) => {
          console.warn('Realtime announcements listener error:', error);
          reportLoadError('announcements', true);
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
          reportLoadError('associations', false);
        },
        (error) => {
          console.warn('Realtime associations listener error:', error);
          reportLoadError('associations', true);
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
            reportLoadError('school_levels', false);
            try {
              localStorage.setItem(LEVELS_CACHE_KEY, JSON.stringify(updated));
            } catch (e) {}
          }
        },
        (error) => {
          console.warn('Realtime school_levels listener error:', error);
          reportLoadError('school_levels', true);
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
  }, [persistCache, reportLoadError]);

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
          // v24.6: no orderBy('publishedAt') — it silently dropped every
          // announcement missing publishedAt, then replaced state with the
          // subset. sortAnnouncementsByEventDate handles missing dates below.
          getDocs(collection(db, 'announcements')),
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
        reportLoadError('sync', false);

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
        reportLoadError('sync', true);
        if (force) {
          toast.error('Offline ဒေတာ အသုံးပြုနေပါသည်');
        }
      } finally {
        setIsSyncing(false);
        setLoading(false);
      }
    },
    [persistCache, reportLoadError]
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
      let prevSchools: School[] | null = null;
      setSchools((prev) => {
        prevSchools = prev;
        const next = prev.map((s) => (s.id === id ? { ...s, ...payload } : s));
        persistCache(next, announcements, associations);
        return next;
      });

      // 2. Write to Firestore — v24.7: on a denied/failed write, roll the
      // UI and the offline cache back. Before, the edit looked saved (and
      // stayed in the cache) even though Firestore rejected it.
      const cleanPayload = cleanFirestoreData(payload);
      try {
        await updateDoc(doc(db, 'schools', id), cleanPayload);
      } catch (err) {
        if (prevSchools) {
          setSchools(prevSchools);
          persistCache(prevSchools, announcements, associations);
        }
        throw err;
      }
    },
    [announcements, associations, persistCache]
  );

  // A14: everything that belongs to a school and must go with it when the
  // school is deleted. Key fields verified in code:
  // - fee transactions: transactions.schoolId (src/lib/finance.ts:35;
  //   rules allow moderator delete)
  // - school activities: events.schoolId (src/pages/SchoolPortal.tsx:84)
  // - athletes: athletes.schoolId since v24.7; older records only carry
  //   the free-text school name, so match by name too (same fallback the
  //   portal uses) — deduped by doc id
  // - registrations of the school's own events: event_registrations.eventId
  // The login (Auth) account is NOT touched here — it cannot be deleted
  // client-side; it must be removed in Firebase Console (the confirm
  // dialog and success toast in Admin.tsx must say so).
  const collectSchoolDeleteImpact = useCallback(
    async (id: string): Promise<{ impact: SchoolDeleteImpact; refs: Array<ReturnType<typeof doc>> }> => {
      const school = schools.find((s) => s.id === id);
      let schoolName = school?.name || '';
      if (!schoolName) {
        try {
          const snap = await getDoc(doc(db, 'schools', id));
          if (snap.exists()) schoolName = (snap.data() as School).name || '';
        } catch (e) {
          // Name is only used for the legacy athlete name-match and the
          // dialog text; the schoolId-keyed cascade still runs without it.
        }
      }

      const txSnap = await getDocs(query(collection(db, 'transactions'), where('schoolId', '==', id)));
      const evSnap = await getDocs(query(collection(db, 'events'), where('schoolId', '==', id)));
      const athByIdSnap = await getDocs(query(collection(db, 'athletes'), where('schoolId', '==', id)));
      // v24.15 (V31): the school's update requests (pending or decided) go
      // with the school — without them the requests list keeps pointing at
      // a deleted school.
      const reqSnap = await getDocs(query(collection(db, 'school_update_requests'), where('schoolId', '==', id)));

      const athleteRefs = new Map<string, ReturnType<typeof doc>>();
      athByIdSnap.docs.forEach((d) => athleteRefs.set(d.id, d.ref));
      if (schoolName) {
        const athByNameSnap = await getDocs(query(collection(db, 'athletes'), where('school', '==', schoolName)));
        athByNameSnap.docs.forEach((d) => {
          if (!athleteRefs.has(d.id)) athleteRefs.set(d.id, d.ref);
        });
      }

      // Registrations belong to the school's events; without their event
      // they would be orphaned and invisible, so they go with the events.
      const regRefs: Array<ReturnType<typeof doc>> = [];
      for (const evDoc of evSnap.docs) {
        const regSnap = await getDocs(query(collection(db, 'event_registrations'), where('eventId', '==', evDoc.id)));
        regSnap.docs.forEach((d) => regRefs.push(d.ref));
      }

      const refs: Array<ReturnType<typeof doc>> = [
        doc(db, 'schools', id),
        ...txSnap.docs.map((d) => d.ref),
        ...evSnap.docs.map((d) => d.ref),
        ...Array.from(athleteRefs.values()),
        ...regRefs,
        ...reqSnap.docs.map((d) => d.ref),
      ];
      return {
        impact: {
          schoolId: id,
          schoolName,
          transactionCount: txSnap.size,
          eventCount: evSnap.size,
          athleteCount: athleteRefs.size,
          registrationCount: regRefs.length,
          requestCount: reqSnap.size,
        },
        refs,
      };
    },
    [schools]
  );

  const getSchoolDeleteImpact = useCallback(
    async (id: string): Promise<SchoolDeleteImpact> => {
      const { impact } = await collectSchoolDeleteImpact(id);
      return impact;
    },
    [collectSchoolDeleteImpact]
  );

  const deleteSchool = useCallback(
    async (id: string): Promise<SchoolDeleteImpact> => {
      // Count + collect everything first, so a failure to read the related
      // records aborts before the school doc itself is touched.
      const { impact, refs } = await collectSchoolDeleteImpact(id);

      // 1. Optimistic UI update immediately
      let prevSchools: School[] | null = null;
      setSchools((prev) => {
        prevSchools = prev;
        const next = prev.filter((s) => s.id !== id);
        persistCache(next, announcements, associations);
        return next;
      });

      // 2. Cascade delete from Firestore (v24.7: roll back on failure, as
      // above). writeBatch caps at 500 ops, so chunk large cascades.
      // NOTE: batches commit one by one — a failure mid-cascade can leave
      // an earlier batch deleted while later ones remain; the UI rolls
      // back and the error is rethrown so the caller toasts it instead
      // of reporting success.
      try {
        for (let i = 0; i < refs.length; i += 500) {
          const batch = writeBatch(db);
          refs.slice(i, i + 500).forEach((ref) => batch.delete(ref));
          await batch.commit();
        }
      } catch (err) {
        if (prevSchools) {
          setSchools(prevSchools);
          persistCache(prevSchools, announcements, associations);
        }
        throw err;
      }
      return impact;
    },
    [announcements, associations, persistCache, collectSchoolDeleteImpact]
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
      let prevAnnouncements: Announcement[] | null = null;
      setAnnouncements((prev) => {
        prevAnnouncements = prev;
        const next = sortAnnouncementsByEventDate(prev.map((a) => (a.id === id ? { ...a, ...data } : a)));
        persistCache(schools, next, associations);
        return next;
      });

      const cleanData = cleanFirestoreData(data);
      try {
        await updateDoc(doc(db, 'announcements', id), cleanData);
      } catch (err) {
        // v24.7: roll back on failure (see updateSchool)
        if (prevAnnouncements) {
          setAnnouncements(prevAnnouncements);
          persistCache(schools, prevAnnouncements, associations);
        }
        throw err;
      }
    },
    [schools, associations, persistCache]
  );

  const deleteAnnouncement = useCallback(
    async (id: string): Promise<void> => {
      let prevAnnouncements: Announcement[] | null = null;
      setAnnouncements((prev) => {
        prevAnnouncements = prev;
        const next = prev.filter((a) => a.id !== id);
        persistCache(schools, next, associations);
        return next;
      });

      try {
        await deleteDoc(doc(db, 'announcements', id));
      } catch (err) {
        // v24.7: roll back on failure (see updateSchool)
        if (prevAnnouncements) {
          setAnnouncements(prevAnnouncements);
          persistCache(schools, prevAnnouncements, associations);
        }
        throw err;
      }
    },
    [schools, associations, persistCache]
  );

  // School Level Mutation Helpers
  const addSchoolLevel = useCallback(
    async (name: string, description?: string, order?: number): Promise<string> => {
      const cleanName = name.trim();
      if (!cleanName) throw new Error('ကျောင်းအဆင့် အမည် လိုအပ်ပါသည်');
      const newOrder =
        order !== undefined
          ? order
          : schoolLevels.length > 0
          ? Math.max(...schoolLevels.map((l) => l.order ?? 0)) + 1
          : 1;

      const hasDefaultIds = schoolLevels.some((l) => l.id.startsWith('default-'));

      if (hasDefaultIds) {
        // Persist all existing default items + new item in an atomic batch
        const batch = writeBatch(db);
        const newDocRef = doc(collection(db, 'school_levels'));
        const nextLevels: SchoolLevelItem[] = [];

        schoolLevels.forEach((l) => {
          const docRef = l.id.startsWith('default-') ? doc(collection(db, 'school_levels')) : doc(db, 'school_levels', l.id);
          const item: SchoolLevelItem = {
            id: docRef.id,
            name: l.name,
            order: l.order,
            description: l.description,
            createdAt: l.createdAt || new Date().toISOString(),
          };
          batch.set(docRef, {
            name: item.name,
            order: item.order,
            description: item.description,
            createdAt: item.createdAt,
          });
          nextLevels.push(item);
        });

        const newItem: SchoolLevelItem = {
          id: newDocRef.id,
          name: cleanName,
          description: description?.trim() || '',
          order: newOrder,
          createdAt: new Date().toISOString(),
        };
        batch.set(newDocRef, {
          name: newItem.name,
          order: newItem.order,
          description: newItem.description,
          createdAt: newItem.createdAt,
        });
        nextLevels.push(newItem);

        await batch.commit();
        setSchoolLevels(nextLevels.sort((a, b) => (a.order ?? 999) - (b.order ?? 999)));
        try {
          localStorage.setItem(LEVELS_CACHE_KEY, JSON.stringify(nextLevels));
        } catch (e) {}
        return newDocRef.id;
      } else {
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
      }
    },
    [schoolLevels]
  );

  const updateSchoolLevel = useCallback(
    async (id: string, data: Partial<SchoolLevelItem>): Promise<void> => {
      const existing = schoolLevels.find((l) => l.id === id);
      const oldName = existing?.name?.trim();
      const newName = data.name !== undefined ? data.name.trim() : oldName;

      const hasDefaultIds = schoolLevels.some((l) => l.id.startsWith('default-'));

      // v24.15 (V6): snapshot BOTH lists before any optimistic change, so a
      // failed write rolls the UI and the offline cache back — same pattern
      // as updateSchool / updateAnnouncement (v24.7).
      const prevLevels = schoolLevels;
      const prevSchools = schools;
      const rollbackLevels = () => {
        setSchoolLevels(prevLevels);
        try {
          localStorage.setItem(LEVELS_CACHE_KEY, JSON.stringify(prevLevels));
        } catch (e) {}
      };
      const rollbackSchools = () => {
        setSchools(prevSchools);
        persistCache(prevSchools, announcements, associations);
      };

      if (hasDefaultIds) {
        // Persist all current levels to Firestore in an atomic batch, updating ONLY target item
        const batch = writeBatch(db);
        const nextLevels: SchoolLevelItem[] = [];

        schoolLevels.forEach((l) => {
          if (l.id === id) {
            const docRef = doc(collection(db, 'school_levels'));
            const updatedItem: SchoolLevelItem = {
              id: docRef.id,
              name: newName ?? l.name,
              order: data.order !== undefined ? data.order : l.order,
              description: data.description !== undefined ? data.description : l.description,
              createdAt: l.createdAt || new Date().toISOString(),
            };
            batch.set(docRef, {
              name: updatedItem.name,
              order: updatedItem.order,
              description: updatedItem.description,
              createdAt: updatedItem.createdAt,
            });
            nextLevels.push(updatedItem);
          } else {
            const docRef = l.id.startsWith('default-') ? doc(collection(db, 'school_levels')) : doc(db, 'school_levels', l.id);
            const item: SchoolLevelItem = {
              id: docRef.id,
              name: l.name,
              order: l.order,
              description: l.description,
              createdAt: l.createdAt || new Date().toISOString(),
            };
            batch.set(docRef, {
              name: item.name,
              order: item.order,
              description: item.description,
              createdAt: item.createdAt,
            });
            nextLevels.push(item);
          }
        });

        try {
          await batch.commit();
        } catch (err) {
          rollbackLevels();
          throw err;
        }
        setSchoolLevels(nextLevels.sort((a, b) => (a.order ?? 999) - (b.order ?? 999)));
        try {
          localStorage.setItem(LEVELS_CACHE_KEY, JSON.stringify(nextLevels));
        } catch (e) {}
      } else {
        // Normal update: only update this single document in Firestore
        setSchoolLevels((prev) => {
          const next = prev
            .map((l) => (l.id === id ? { ...l, ...data, name: newName ?? l.name } : l))
            .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
          try {
            localStorage.setItem(LEVELS_CACHE_KEY, JSON.stringify(next));
          } catch (e) {}
          return next;
        });

        const updatePayload: Record<string, any> = {};
        if (data.name !== undefined) updatePayload.name = newName;
        if (data.order !== undefined) updatePayload.order = data.order;
        if (data.description !== undefined) updatePayload.description = data.description;

        try {
          await updateDoc(doc(db, 'school_levels', id), updatePayload);
        } catch (err) {
          rollbackLevels();
          throw err;
        }
      }

      // If level name changed, automatically migrate ONLY schools that EXACTLY have oldName
      if (oldName && newName && oldName.toLowerCase() !== newName.toLowerCase()) {
        const affectedSchools = schools.filter(
          (s) => (s.level || s.category || '').trim().toLowerCase() === oldName.toLowerCase()
        );
        if (affectedSchools.length > 0) {
          setSchools((prev) =>
            prev.map((s) =>
              (s.level || s.category || '').trim().toLowerCase() === oldName.toLowerCase()
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
            // v24.15 (V6): a failed migration used to only console.warn
            // while the screen kept showing the renamed level on the
            // schools — roll the schools back and let the caller toast.
            rollbackSchools();
            throw e;
          }
        }
      }
    },
    [schoolLevels, schools, announcements, associations, persistCache]
  );

  const deleteSchoolLevel = useCallback(
    async (id: string): Promise<void> => {
      const existing = schoolLevels.find((l) => l.id === id);
      const oldName = existing?.name?.trim();

      const hasDefaultIds = schoolLevels.some((l) => l.id.startsWith('default-'));

      // v24.15 (V6): same snapshot + rollback as updateSchoolLevel.
      const prevLevels = schoolLevels;
      const prevSchools = schools;
      const rollbackLevels = () => {
        setSchoolLevels(prevLevels);
        try {
          localStorage.setItem(LEVELS_CACHE_KEY, JSON.stringify(prevLevels));
        } catch (e) {}
      };
      const rollbackSchools = () => {
        setSchools(prevSchools);
        persistCache(prevSchools, announcements, associations);
      };

      if (hasDefaultIds) {
        const batch = writeBatch(db);
        const nextLevels: SchoolLevelItem[] = [];

        schoolLevels.forEach((l) => {
          if (l.id !== id) {
            const docRef = l.id.startsWith('default-') ? doc(collection(db, 'school_levels')) : doc(db, 'school_levels', l.id);
            const item: SchoolLevelItem = {
              id: docRef.id,
              name: l.name,
              order: l.order,
              description: l.description,
              createdAt: l.createdAt || new Date().toISOString(),
            };
            batch.set(docRef, {
              name: item.name,
              order: item.order,
              description: item.description,
              createdAt: item.createdAt,
            });
            nextLevels.push(item);
          }
        });

        try {
          await batch.commit();
        } catch (err) {
          rollbackLevels();
          throw err;
        }
        setSchoolLevels(nextLevels.sort((a, b) => (a.order ?? 999) - (b.order ?? 999)));
        try {
          localStorage.setItem(LEVELS_CACHE_KEY, JSON.stringify(nextLevels));
        } catch (e) {}
      } else {
        setSchoolLevels((prev) => {
          const next = prev.filter((l) => l.id !== id);
          try {
            localStorage.setItem(LEVELS_CACHE_KEY, JSON.stringify(next));
          } catch (e) {}
          return next;
        });

        try {
          await deleteDoc(doc(db, 'school_levels', id));
        } catch (err) {
          rollbackLevels();
          throw err;
        }
      }

      // If deleted level had schools, update local schools to unassigned so data is preserved
      if (oldName) {
        const affectedSchools = schools.filter(
          (s) => (s.level || s.category || '').trim().toLowerCase() === oldName.toLowerCase()
        );
        if (affectedSchools.length > 0) {
          setSchools((prev) =>
            prev.map((s) =>
              (s.level || s.category || '').trim().toLowerCase() === oldName.toLowerCase()
                ? { ...s, level: 'အဆင့် သတ်မှတ်ရန်လို' }
                : s
            )
          );
          try {
            const batch = writeBatch(db);
            affectedSchools.forEach((s) => {
              batch.update(doc(db, 'schools', s.id), { level: 'အဆင့် သတ်မှတ်ရန်လို' });
            });
            await batch.commit();
          } catch (e) {
            // v24.15 (V6): roll the schools back and surface the error —
            // before, this only console.warned while the screen kept
            // showing the schools as unassigned.
            rollbackSchools();
            throw e;
          }
        }
      }
    },
    [schoolLevels, schools, announcements, associations, persistCache]
  );

  const resetSchoolLevelsToDefault = useCallback(async (): Promise<void> => {
    const defaults = getDefaultSchoolLevels();

    try {
      const snap = await getDocs(collection(db, 'school_levels'));
      const batch = writeBatch(db);

      snap.docs.forEach((d) => {
        batch.delete(doc(db, 'school_levels', d.id));
      });

      const nextLevels: SchoolLevelItem[] = [];
      defaults.forEach((item) => {
        const docRef = doc(collection(db, 'school_levels'));
        const docItem: SchoolLevelItem = {
          id: docRef.id,
          name: item.name,
          order: item.order,
          description: item.description,
          createdAt: item.createdAt,
        };
        batch.set(docRef, {
          name: docItem.name,
          order: docItem.order,
          description: docItem.description,
          createdAt: docItem.createdAt,
        });
        nextLevels.push(docItem);
      });

      await batch.commit();
      setSchoolLevels(nextLevels.sort((a, b) => (a.order ?? 999) - (b.order ?? 999)));
      try {
        localStorage.setItem(LEVELS_CACHE_KEY, JSON.stringify(nextLevels));
      } catch (e) {}
      toast.success('ကျောင်းအဆင့်များ မူလအတိုင်း ပြန်ထားပါပြီ');
    } catch (e) {
      console.warn('Reset school levels error in Firestore:', e);
      toast.error('Reset မအောင်မြင်ပါ');
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
      loadError,
      syncData,
      getSchoolById,
      addSchool,
      updateSchool,
      deleteSchool,
      getSchoolDeleteImpact,
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
      loadError,
      syncData,
      getSchoolById,
      addSchool,
      updateSchool,
      deleteSchool,
      getSchoolDeleteImpact,
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
