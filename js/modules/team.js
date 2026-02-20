import { db } from '../../firebase-config.js';
import { collection, addDoc, deleteDoc, doc, updateDoc, writeBatch } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { CONSTANTS, COLLECTIONS } from './constants.js';
import { state } from './state.js';

export async function checkAndAddDefaultTeams() {
    if (state.teams.length === 0) {
        const batch = writeBatch(db);
        const redTeam = doc(collection(db, COLLECTIONS.TEAMS));
        batch.set(redTeam, { name: 'Kırmızı Takım', order: 1 });
        const blueTeam = doc(collection(db, COLLECTIONS.TEAMS));
        batch.set(blueTeam, { name: 'Mavi Takım', order: 2 });
        await batch.commit();
    }
}

export async function saveTeam(teamData) {
    if (state.editingTeamId) {
        await updateDoc(doc(db, COLLECTIONS.TEAMS, state.editingTeamId), teamData);
    } else {
        await addDoc(collection(db, COLLECTIONS.TEAMS), teamData);
    }
}

export async function deleteTeam(id) {
    if (state.currentUser.role !== CONSTANTS.ROLES.ADMIN) {
        return alert('Sadece admin takım silebilir!');
    }
    
    if (confirm('Takım silinsin mi?')) {
        await deleteDoc(doc(db, COLLECTIONS.TEAMS, id));
    }
}
