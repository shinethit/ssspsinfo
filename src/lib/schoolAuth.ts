import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut, deleteUser } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { firebaseConfig, db } from './firebase';

export async function createSchoolAccount(email: string, password: string, schoolId: string): Promise<string> {
  // v24.7: refuse when the school already has an account — re-creating used
  // to overwrite authUid and orphan the previous login.
  const schoolSnap = await getDoc(doc(db, 'schools', schoolId));
  if (schoolSnap.exists() && (schoolSnap.data() as any).authUid) {
    throw new Error('ဤကျောင်းတွင် အကောင့် ရှိနှပြီးသား ဖြစ်ပါသည်');
  }

  const secondaryAppName = `schoolWorker_${Date.now()}`;
  const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
  const secondaryAuth = getAuth(secondaryApp);

  let uid = '';
  try {
    // 1. Create User
    const userCred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    uid = userCred.user.uid;

    try {
      // 2. Link UID to the School document
      await updateDoc(doc(db, 'schools', schoolId), {
        authUid: uid,
        accountEmail: email
      });
    } catch (linkErr) {
      // v24.7: the link failed — delete the just-created Auth user again so
      // it cannot sign in while linked to no school.
      try {
        await deleteUser(userCred.user);
      } catch {
        // Rollback failed; the caller still reports the link error.
      }
      throw linkErr;
    }

    return uid;
  } finally {
    // 3. Clean up
    await signOut(secondaryAuth);
    await deleteApp(secondaryApp);
  }
}
