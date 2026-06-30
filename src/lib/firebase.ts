import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCvk_Pf8NlU5OpF2JR53mKLcJPmVkv-9Sw",
  authDomain: "lets-predict.firebaseapp.com",
  projectId: "lets-predict",
  storageBucket: "lets-predict.firebasestorage.app",
  messagingSenderId: "1022913469673",
  appId: "1:1022913469673:web:31b5f7cc6f162bc41ea478",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Waits for Firebase to resolve its initial auth state (may come from cache),
// then signs in anonymously if no user exists. More reliable than checking
// auth.currentUser directly, which can be non-null before the token is ready.
let authReadyPromise: Promise<void> | null = null;

export function ensureAuth(): Promise<void> {
  if (!authReadyPromise) {
    authReadyPromise = new Promise<void>((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(
        auth,
        (user) => {
          unsubscribe();
          if (user) {
            resolve();
          } else {
            signInAnonymously(auth).then(() => resolve()).catch((err) => {
              console.error("[Firebase] Anonymous sign-in failed — enable it in Firebase Console > Authentication > Sign-in method.", err);
              reject(err);
            });
          }
        },
        reject
      );
    });
  }
  return authReadyPromise;
}
