import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

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
