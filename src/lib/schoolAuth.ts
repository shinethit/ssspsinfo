import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { firebaseConfig, db } from './firebase';

export async function createSchoolAccount(email: string, password: string, schoolId: string): Promise<string> {
  const secondaryAppName = `schoolWorker_${Date.now()}`;
  const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    // 1. Create User
    const userCred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const uid = userCred.user.uid;

    // 2. Link UID to the School document
    await updateDoc(doc(db, 'schools', schoolId), {
      authUid: uid,
      accountEmail: email
    });

    return uid;
  } finally {
    // 3. Clean up
    await signOut(secondaryAuth);
    await deleteApp(secondaryApp);
  }
}
