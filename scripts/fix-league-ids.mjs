// One-time migration: stamp leagueId on every player doc that's missing it
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";

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

async function run() {
  // Load all players and all leagues
  const [playersSnap, leaguesSnap] = await Promise.all([
    getDocs(collection(db, "players")),
    getDocs(collection(db, "leagues")),
  ]);

  const players = new Map();
  playersSnap.forEach((d) => players.set(d.id, d.data()));

  const leagues = [];
  leaguesSnap.forEach((d) => leagues.push(d.data()));

  // Build map: playerId -> leagueId
  const memberOf = new Map();
  for (const league of leagues) {
    for (const m of (league.members ?? [])) {
      memberOf.set(m.playerId, league.id);
    }
  }

  let fixed = 0;
  for (const [playerId, player] of players) {
    if (!player.leagueId && memberOf.has(playerId)) {
      const leagueId = memberOf.get(playerId);
      await updateDoc(doc(db, "players", playerId), { leagueId });
      console.log(`✓ ${player.name} (${playerId}) → leagueId: ${leagueId}`);
      fixed++;
    }
  }

  if (fixed === 0) {
    console.log("All players already have leagueId — nothing to fix.");
  } else {
    console.log(`\nDone. Fixed ${fixed} player(s).`);
  }
  process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });
