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

export async function restoreRecoveredCacheToFirestore(data: RecoverableCacheData): Promise<{
  schoolsRestored: number;
  announcementsRestored: number;
  associationsRestored: number;
}> {
  const batch = writeBatch(db);
  let schoolsRestored = 0;
  let announcementsRestored = 0;
  let associationsRestored = 0;

  for (const school of data.schools) {
    const { id, ...schoolData } = school;
    const docRef = id && id.length > 10 ? doc(db, 'schools', id) : doc(collection(db, 'schools'));
    batch.set(docRef, { ...schoolData, updatedAt: new Date().toISOString() }, { merge: true });
    schoolsRestored++;
  }

  for (const ann of data.announcements) {
    const { id, ...annData } = ann;
    const docRef = id && id.length > 10 ? doc(db, 'announcements', id) : doc(collection(db, 'announcements'));
    batch.set(docRef, { ...annData, updatedAt: new Date().toISOString() }, { merge: true });
    announcementsRestored++;
  }

  for (const assoc of data.associations) {
    const { id, ...assocData } = assoc;
    const docRef = id && id.length > 10 ? doc(db, 'associations', id) : doc(collection(db, 'associations'));
    batch.set(docRef, { ...assocData, updatedAt: new Date().toISOString() }, { merge: true });
    associationsRestored++;
  }

  await batch.commit();

  return {
    schoolsRestored,
    announcementsRestored,
    associationsRestored,
  };
}
