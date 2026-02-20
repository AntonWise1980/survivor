import { db } from '../../firebase-config.js';
import { collection, addDoc, deleteDoc, doc, getDoc, setDoc, getDocs, writeBatch, updateDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { CONSTANTS, COLLECTIONS } from './constants.js';
import { state } from './state.js';

export async function startGame(gameData) {
    await setDoc(doc(db, COLLECTIONS.STATUS, "live"), gameData);
}

export async function selectWinner(winnerTeam) {
    if (state.currentUser.role !== CONSTANTS.ROLES.ADMIN) {
        return alert('Sadece admin oyuncu seçebilir!');
    }
    
    const liveGameDoc = doc(db, COLLECTIONS.STATUS, "live");
    const liveGameSnap = await getDoc(liveGameDoc);
    const currentGame = liveGameSnap.data();

    if (!currentGame) return;
    
    let wId;
    if (currentGame.redId2) {
        wId = winnerTeam === CONSTANTS.TEAMS.RED 
            ? [currentGame.redId, currentGame.redId2] 
            : [currentGame.blueId, currentGame.blueId2];
    } else {
        wId = winnerTeam === CONSTANTS.TEAMS.RED ? currentGame.redId : currentGame.blueId;
    }

    const gameToArchive = {
        ...currentGame,
        winnerId: wId,
        date: new Date().toLocaleDateString('tr-TR'),
        time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now()
    };

    await addDoc(collection(db, COLLECTIONS.GAMES), gameToArchive);
    
    const batch = writeBatch(db);
    const winners = Array.isArray(wId) ? wId : [wId];
    const losers = winnerTeam === CONSTANTS.TEAMS.RED 
        ? [currentGame.blueId, currentGame.blueId2].filter(Boolean) 
        : [currentGame.redId, currentGame.redId2].filter(Boolean);
    
    winners.forEach(id => {
        const p = state.players.find(x => x.id === id);
        if (p) {
            const s = p.stats || { m: 0, w: 0, l: 0, p: 0 };
            batch.update(doc(db, COLLECTIONS.PLAYERS, id), { 
                stats: { m: s.m + 1, w: s.w + 1, l: s.l, p: s.p + 1 } 
            });
        }
    });
    
    losers.forEach(id => {
        const p = state.players.find(x => x.id === id);
        if (p) {
            const s = p.stats || { m: 0, w: 0, l: 0, p: 0 };
            batch.update(doc(db, COLLECTIONS.PLAYERS, id), { 
                stats: { m: s.m + 1, w: s.w, l: s.l + 1, p: s.p - 1 } 
            });
        }
    });
    
    await batch.commit();
    await deleteDoc(liveGameDoc);
}

export async function cancelActiveGame() {
    if (state.currentUser.role !== CONSTANTS.ROLES.ADMIN) {
        return alert('Sadece admin maçı iptal edebilir!');
    }
    
    if (confirm('İptal edilsin mi?')) {
        await deleteDoc(doc(db, COLLECTIONS.STATUS, "live"));
    }
}

export async function deleteGame(gameId) {
    if (state.currentUser.role !== CONSTANTS.ROLES.ADMIN) {
        return alert('Sadece admin oyun silebilir!');
    }
    
    if (confirm('Silinsin mi?')) {
        const game = state.games.find(g => g.id === gameId);
        if (game) {
            const batch = writeBatch(db);
            const winners = Array.isArray(game.winnerId) ? game.winnerId : [game.winnerId];
            const winnerP = state.players.find(p => p.id === winners[0]);
            
            if (winnerP) {
                const isRedWinner = winnerP.team === CONSTANTS.TEAMS.RED;
                const losers = isRedWinner 
                    ? [game.blueId, game.blueId2].filter(Boolean) 
                    : [game.redId, game.redId2].filter(Boolean);
                
                winners.forEach(id => {
                    const p = state.players.find(x => x.id === id);
                    if (p && p.stats) {
                        const s = p.stats;
                        batch.update(doc(db, COLLECTIONS.PLAYERS, id), { 
                            stats: { 
                                m: Math.max(0, s.m - 1), 
                                w: Math.max(0, s.w - 1), 
                                l: s.l, 
                                p: s.p - 1 
                            } 
                        });
                    }
                });
                
                losers.forEach(id => {
                    const p = state.players.find(x => x.id === id);
                    if (p && p.stats) {
                        const s = p.stats;
                        batch.update(doc(db, COLLECTIONS.PLAYERS, id), { 
                            stats: { 
                                m: Math.max(0, s.m - 1), 
                                w: s.w, 
                                l: Math.max(0, s.l - 1), 
                                p: s.p + 1 
                            } 
                        });
                    }
                });
            }
            await batch.commit();
        }
        await deleteDoc(doc(db, COLLECTIONS.GAMES, gameId));
    }
}

export async function updateGameResult(gameId, newWinnerId) {
    const gameRef = doc(db, COLLECTIONS.GAMES, gameId);
    await updateDoc(gameRef, { winnerId: newWinnerId });
}

export function getGameTimestamp(game) {
    if (game.timestamp) return Number(game.timestamp);
    try {
        if (game.date && game.time) {
            const [d, m, y] = game.date.split('.').map(s => s.trim());
            const [hh, mm] = game.time.split(':').map(s => s.trim());
            return new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T${hh.padStart(2, '0')}:${mm.padStart(2, '0')}:00`).getTime();
        }
    } catch(e) {}
    return 0;
}
