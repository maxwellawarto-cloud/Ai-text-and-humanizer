import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  address: string;
  country: string;
  createdAt: any;
  profileCompleted: boolean;
}

export const saveUserProfile = async (uid: string, data: Partial<UserProfile>) => {
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true });
};

export const getUserProfile = async (uid: string) => {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  return snap.exists() ? (snap.data() as UserProfile) : null;
};
