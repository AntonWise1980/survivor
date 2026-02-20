import { db } from '../../firebase-config.js';
import { collection, addDoc, deleteDoc, doc, updateDoc, getDocs, writeBatch, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { CONSTANTS, COLLECTIONS } from './constants.js';
import { state } from './state.js';

export async function addPlayer(team) {
    if (state.currentUser.role !== CONSTANTS.ROLES.ADMIN) {
        return alert('Sadece admin oyuncu ekleyebilir!');
    }
    
    const name = document.getElementById('player-name').value.trim();
    if (!name) return;
    
    const genderInput = document.querySelector('input[name="player-gender"]:checked');
    const gender = genderInput ? genderInput.value : CONSTANTS.GENDER.FEMALE;
    
    await addDoc(collection(db, COLLECTIONS.PLAYERS), { 
        name, 
        team, 
        gender, 
        stats: { m: 0, w: 0, l: 0, p: 0 } 
    });
}

export async function removePlayer(id) {
    if (state.currentUser.role !== CONSTANTS.ROLES.ADMIN) {
        return alert('Sadece admin oyuncu silebilir!');
    }
    
    if (confirm('Kaldırılsın mı?')) {
        await deleteDoc(doc(db, COLLECTIONS.PLAYERS, id));
        try {
            await deleteDoc(doc(db, COLLECTIONS.GIDECEKLER, id));
        } catch(e) {}
    }
}

export async function updatePlayer() {
    const newName = document.getElementById('player-name').value.trim();
    if (!newName || !state.editingPlayerId) return;

    const genderInput = document.querySelector('input[name="player-gender"]:checked');
    const newGender = genderInput ? genderInput.value : CONSTANTS.GENDER.FEMALE;
    const teamInput = document.querySelector('input[name="player-team"]:checked');
    const newTeam = teamInput ? teamInput.value : null;
    
    const newStats = {
        m: parseInt(document.getElementById('stat-m').value) || 0,
        w: parseInt(document.getElementById('stat-w').value) || 0,
        l: parseInt(document.getElementById('stat-l').value) || 0,
        p: parseInt(document.getElementById('stat-p').value) || 0
    };

    const playerRef = doc(db, COLLECTIONS.PLAYERS, state.editingPlayerId);
    const updateObj = { name: newName, gender: newGender, stats: newStats };
    if (newTeam) updateObj.team = newTeam;
    await updateDoc(playerRef, updateObj);

    const gamesQuerySnapshot = await getDocs(collection(db, COLLECTIONS.GAMES));
    const batch = writeBatch(db);
    
    gamesQuerySnapshot.forEach(gameDoc => {
        const g = gameDoc.data();
        let needsUpdate = false;
        let updateData = {};
        
        if (g.redId === state.editingPlayerId) { needsUpdate = true; updateData.redName = newName; }
        if (g.redId2 === state.editingPlayerId) { needsUpdate = true; updateData.redName2 = newName; }
        if (g.blueId === state.editingPlayerId) { needsUpdate = true; updateData.blueName = newName; }
        if (g.blueId2 === state.editingPlayerId) { needsUpdate = true; updateData.blueName2 = newName; }
        
        if (needsUpdate) {
            batch.update(doc(db, COLLECTIONS.GAMES, gameDoc.id), updateData);
        }
    });
    
    await batch.commit();

    try {
        const gRef = doc(db, COLLECTIONS.GIDECEKLER, state.editingPlayerId);
        const mergeObj = { name: newName, gender: newGender };
        if (newTeam) mergeObj.team = newTeam;
        await setDoc(gRef, mergeObj, { merge: true });
    } catch (e) {}
}

export async function toggleGidecek(playerId) {
    const docRef = doc(db, COLLECTIONS.GIDECEKLER, playerId);
    const existing = state.gidecekler.find(g => g.playerId === playerId);
    
    if (existing) {
        await deleteDoc(docRef);
        return;
    }
    
    const p = state.players.find(x => x.id === playerId);
    if (!p) return;
    await setDoc(docRef, { playerId, name: p.name, team: p.team });
}

export async function toggleDuello(playerId) {
    const docRef = doc(db, COLLECTIONS.DUELLO, playerId);
    const existing = state.duellolar.find(d => d.playerId === playerId);
    
    if (existing) {
        await deleteDoc(docRef);
        return;
    }
    
    const p = state.players.find(x => x.id === playerId);
    if (!p) return;
    await setDoc(docRef, { playerId, name: p.name, team: p.team });
}
