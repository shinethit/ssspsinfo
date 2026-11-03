import { School, Announcement, Association } from '../types';
import { db } from './firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';

export interface RecoverableCacheData {
  sourceKey: string;
  schools: School[];
  announcements: Announcement[];
  associations: Association[];
}

const FAKE_DOC_IDS = new Set([
  'school-1',
  'school-2',
  'school-3',
  'school-4',
  'announce-1',
  'announce-2',
  'assoc-1',
  'ticker-1',
]);

export function findRecoverableCache(): RecoverableCacheData | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;

  const candidateKeys = [
    'pss_offline_data_cache_v2',
    'pss_offline_data_cache',
    'pss_offline_data_cache_v1',
    'pss_offline_data_cache_v5',
    'pss_offline_data_cache_v4',
  ];

  for (const key of candidateKeys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);

      const rawSchools: School[] = Array.isArray(parsed?.schools) ? parsed.schools : [];
      const authenticSchools = rawSchools.filter(
        (s) => s && s.name && !FAKE_DOC_IDS.has(s.id) && s.name.trim() !== 'ပညာရောင်ခြည်'
      );

      const rawAnnouncements: Announcement[] = Array.isArray(parsed?.announcements) ? parsed.announcements : [];
      const authenticAnnouncements = rawAnnouncements.filter(
        (a) => a && a.title && !FAKE_DOC_IDS.has(a.id)
      );

      const rawAssociations: Association[] = Array.isArray(parsed?.associations) ? parsed.associations : [];
      const authenticAssociations = rawAssociations.filter(
        (asc) => asc && asc.name && !FAKE_DOC_IDS.has(asc.id)
      );

      if (authenticSchools.length > 0 || authenticAnnouncements.length > 0 || authenticAssociations.length > 0) {
        return {
          sourceKey: key,
          schools: authenticSchools,
          announcements: authenticAnnouncements,
          associations: authenticAssociations,
        };
      }
    } catch {
      // Continue checking next candidate key
    }
  }

  return null;
}

// v24.13 (F8): a cached doc keeps its stored id — the old length > 10
// test minted a fresh id for any short real id, duplicating the doc on
// every restore. Only a doc with no id at all gets a generated one.
// v24.15 (V22): writes are chunked at 450 ops (a single batch over 500
// docs used to fail entirely), counts report only COMMITTED docs, and the
// cache key is deleted after a successful restore so the same stale
// snapshot can never be restored twice over newer data.
export async function restoreRecoveredCacheToFirestore(data: RecoverableCacheData): Promise<{
  schoolsRestored: number;
  announcementsRestored: number;
  associationsRestored: number;
}> {
  // Queue every write first, then commit in 450-op chunks.
  type PendingWrite = { collection: 'schools' | 'announcements' | 'associations'; ref: ReturnType<typeof doc>; data: Record<string, unknown> };
  const pending: PendingWrite[] = [];
  for (const school of data.schools) {
    const { id, ...schoolData } = school;
    const docRef = id ? doc(db, 'schools', id) : doc(collection(db, 'schools'));
    pending.push({ collection: 'schools', ref: docRef, data: { ...schoolData, updatedAt: new Date().toISOString() } });
  }
  for (const ann of data.announcements) {
    const { id, ...annData } = ann;
    const docRef = id ? doc(db, 'announcements', id) : doc(collection(db, 'announcements'));
    pending.push({ collection: 'announcements', ref: docRef, data: { ...annData, updatedAt: new Date().toISOString() } });
  }
  for (const assoc of data.associations) {
    const { id, ...assocData } = assoc;
    const docRef = id ? doc(db, 'associations', id) : doc(collection(db, 'associations'));
    pending.push({ collection: 'associations', ref: docRef, data: { ...assocData, updatedAt: new Date().toISOString() } });
  }

  const counts = { schoolsRestored: 0, announcementsRestored: 0, associationsRestored: 0 };
  const CHUNK_SIZE = 450;
  try {
    for (let i = 0; i < pending.length; i += CHUNK_SIZE) {
      const chunk = pending.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      for (const w of chunk) batch.set(w.ref, w.data, { merge: true });
      await batch.commit();
      // Only committed docs count.
      for (const w of chunk) {
        if (w.collection === 'schools') counts.schoolsRestored++;
        else if (w.collection === 'announcements') counts.announcementsRestored++;
        else counts.associationsRestored++;
      }
    }
  } catch (err) {
    // A failed chunk leaves earlier chunks committed and later chunks
    // unwritten — report how far it got so the caller can say so honestly.
    const restoredSoFar = counts.schoolsRestored + counts.announcementsRestored + counts.associationsRestored;
    throw new Error(`Cache restore တစ်စိတ်တစ်ပိုင်း မအောင်မြင်ပါ — (${restoredSoFar}) ခု ပြန်သွင်းပြီး၊ ကျန်သော မှတ်တမ်းများ မသွင်းရသေးပါ`);
  }

  // Success only — delete the cache key so restoring again cannot roll
  // newer data back to this stale snapshot.
  try {
    localStorage.removeItem(data.sourceKey);
  } catch {
    // Key removal failing must not turn a successful restore into an error.
  }

  return counts;
}
