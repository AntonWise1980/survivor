import { db } from '../../firebase-config.js';
import { collection, onSnapshot, doc, getDocs, writeBatch } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { COLLECTIONS } from './constants.js';
import { state } from './state.js';
import { checkAndAddDefaultAdmin, updateUIByRole, checkUserSession } from './auth.js';
import { checkAndAddDefaultTeams } from './team.js';
import { renderAll } from './render.js';

export async function initApp() {
    Object.values(state.unsubscribers).forEach(unsub => {
        if (unsub) unsub();
    });

    await checkAndAddDefaultAdmin();

    const playersSnapshot = await getDocs(collection(db, COLLECTIONS.PLAYERS));
    state.players = playersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    await updatePlayerStatsFromScreenshot();

    const gamesSnapshot = await getDocs(collection(db, COLLECTIONS.GAMES));
    state.games = gamesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const teamsSnapshot = await getDocs(collection(db, COLLECTIONS.TEAMS));
    state.teams = teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    await checkAndAddDefaultTeams();

    renderAll();

    state.unsubscribers.players = onSnapshot(collection(db, COLLECTIONS.PLAYERS), (snapshot) => {
        state.players = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderAll();
    });

    state.unsubscribers.games = onSnapshot(collection(db, COLLECTIONS.GAMES), (snapshot) => {
        state.games = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderAll();
    });

    state.unsubscribers.gidecek = onSnapshot(collection(db, COLLECTIONS.GIDECEKLER), (snapshot) => {
        state.gidecekler = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        renderAll();
    });

    state.unsubscribers.duello = onSnapshot(collection(db, COLLECTIONS.DUELLO), (snapshot) => {
        state.duellolar = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        renderAll();
    });

    state.unsubscribers.teams = onSnapshot(collection(db, COLLECTIONS.TEAMS), (snapshot) => {
        state.teams = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderAll();
    });

    state.unsubscribers.status = onSnapshot(doc(db, COLLECTIONS.STATUS, "live"), (docSnap) => {
        const activeGameData = docSnap.data();
        const activeGameDiv = document.getElementById('active-game');
        const newGameBtn = document.getElementById('btn-new-game');

        if (activeGameData && activeGameData.redId) {
            const rFull = activeGameData.redName2 
                ? `${activeGameData.redName}<br>${activeGameData.redName2}` 
                : activeGameData.redName;
            const bFull = activeGameData.blueName2 
                ? `${activeGameData.blueName}<br>${activeGameData.blueName2}` 
                : activeGameData.blueName;

            document.getElementById('red-fighter').innerHTML = `<div class="text-xl font-bold text-red-400 italic">${rFull}</div><div class="text-[9px] text-red-500/50 uppercase font-black mt-1">Kırmızı Takım</div>`;
            document.getElementById('blue-fighter').innerHTML = `<div class="text-xl font-bold text-blue-400 italic">${bFull}</div><div class="text-[9px] text-blue-500/50 uppercase font-black mt-1">Mavi Takım</div>`;
            
            activeGameDiv.classList.remove('hidden');
            newGameBtn.classList.add('hidden');
        } else {
            activeGameDiv.classList.add('hidden');
            if (state.currentUser && state.currentUser.role === 'admin') {
                newGameBtn.classList.remove('hidden');
            } else {
                newGameBtn.classList.add('hidden');
            }
        }
    });
}

async function updatePlayerStatsFromScreenshot() {
    const statsMap = {
        "Mert Nobre": {m:94, w:64, l:30, p:34},
        "Ramazan Sarı": {m:85, w:51, l:34, p:17},
        "Nagihan Karadere": {m:51, w:34, l:17, p:17},
        "Deniz Çatalbaş": {m:73, w:44, l:29, p:15},
        "Seda Albayrak": {m:56, w:35, l:21, p:14},
        "Eren Semerci": {m:49, w:31, l:18, p:13},
        "Sude Demir": {m:60, w:36, l:24, p:12},
        "Osman Can": {m:39, w:25, l:14, p:11},
        "Onur Alp Çam": {m:75, w:41, l:34, p:7},
        "Gözde Bozkurt": {m:51, w:28, l:23, p:5},
        "Engincan Tura": {m:81, w:42, l:39, p:3},
        "Seren Ay": {m:67, w:35, l:32, p:3},
        "Büşra Yalçın": {m:25, w:14, l:11, p:3},
        "Nefise Karatay": {m:42, w:21, l:21, p:0},
        "Sercan Yıldırım": {m:32, w:16, l:16, p:0},
        "Can Berkay": {m:31, w:12, l:19, p:-7},
        "Serhan Onat": {m:49, w:21, l:28, p:-7},
        "Murat Arkın": {m:52, w:22, l:30, p:-8},
        "Beyza Gemici": {m:47, w:17, l:30, p:-13},
        "Nisanur Güler": {m:56, w:21, l:35, p:-14},
        "Lina Hourieh": {m:76, w:25, l:51, p:-26},
        "Bayhan Gürhan": {m:80, w:25, l:55, p:-30}
    };
    
    const batch = writeBatch(db);
    state.players.forEach(player => {
        if (statsMap[player.name]) {
            batch.update(doc(db, COLLECTIONS.PLAYERS, player.id), { stats: statsMap[player.name] });
        }
    });
    await batch.commit();
    
    const updatedSnapshot = await getDocs(collection(db, COLLECTIONS.PLAYERS));
    state.players = updatedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export function showMainApp() {
    document.getElementById('login-screen').classList.add('hidden');
    updateUIByRole();
    initApp();
}

export function startApp() {
    if (checkUserSession()) {
        showMainApp();
    }
}
