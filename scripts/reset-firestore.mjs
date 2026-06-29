// One-time reset: deletes ALL documents from players, leagues, results collections
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCvk_Pf8NlU5OpF2JR53mKLcJPmVkv-9Sw",
  authDomain: "lets-predict.firebaseapp.com",
  projectId: "lets-predict",
  storageBucket: "lets-predict.firebasestorage.app",
  messagingSenderId: "1022913469673",
  appId: "1:1022913469673:web:31b5f7cc6f162bc41ea478",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clearCollection(name) {
  const snap = await getDocs(collection(db, name));
  await Promise.all(snap.docs.map((d) => deleteDoc(doc(db, name, d.id))));
  console.log(`✓ Cleared ${snap.size} doc(s) from '${name}'`);
}

await clearCollection("players");
await clearCollection("leagues");
await clearCollection("results");

console.log("\nFirestore reset complete. All data wiped.");
process.exit(0);
