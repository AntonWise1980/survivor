import { state } from './state.js';
import { CONSTANTS } from './constants.js';
import { addPlayer, updatePlayer } from './player.js';
import { startGame, updateGameResult } from './game.js';
import { saveTeam } from './team.js';
import { attachGenderToggle, syncGenderUI, attachTeamToggle, syncTeamUI } from './ui-utils.js';

export function addPlayerModal() {
    if (state.currentUser.role !== CONSTANTS.ROLES.ADMIN) {
        return alert('Sadece admin oyuncu ekleyebilir!');
    }
    
    try {
        document.querySelector('input[name="player-gender"][value="female"]').checked = true;
    } catch(e) {}
    
    try {
        document.getElementById('modal-team-select').classList.add('hidden');
    } catch(e) {}
    
    document.getElementById('add-player-modal').classList.remove('hidden');
    document.getElementById('player-name').focus();
    
    try {
        const r = document.getElementById('modal-add-red');
        const b = document.getElementById('modal-add-blue');
        if (r) r.onclick = () => { addPlayer(CONSTANTS.TEAMS.RED); closeModal(); };
        if (b) b.onclick = () => { addPlayer(CONSTANTS.TEAMS.BLUE); closeModal(); };
    } catch(e) {}
    
    try {
        attachGenderToggle();
        syncGenderUI();
    } catch(e) {}
}

export function editPlayerModal(id) {
    if (state.currentUser.role !== CONSTANTS.ROLES.ADMIN) {
        return alert('Sadece admin oyuncu düzeltebilir!');
    }
    
    const player = state.players.find(p => p.id === id);
    if (!player) return;
    
    state.editingPlayerId = id;
    document.getElementById('modal-title').textContent = "DÜZELT";
    document.getElementById('player-name').value = player.name;
    
    try {
        const genderVal = player.gender || CONSTANTS.GENDER.FEMALE;
        document.querySelectorAll('input[name="player-gender"]').forEach(r => 
            r.checked = (r.value === genderVal)
        );
    } catch(e) {}
    
    try {
        const teamSel = document.getElementById('modal-team-select');
        if (teamSel) teamSel.classList.remove('hidden');
        const teamVal = player.team || CONSTANTS.TEAMS.RED;
        document.querySelectorAll('input[name="player-team"]').forEach(r => 
            r.checked = (r.value === teamVal)
        );
    } catch(e) {}
    
    try {
        const statsSel = document.getElementById('modal-stats');
        if (statsSel) statsSel.classList.remove('hidden');
        const s = player.stats || { m: 0, w: 0, l: 0, p: 0 };
        document.getElementById('stat-m').value = s.m || 0;
        document.getElementById('stat-w').value = s.w || 0;
        document.getElementById('stat-l').value = s.l || 0;
        document.getElementById('stat-p').value = s.p || 0;
    } catch(e) {}
    
    document.getElementById('modal-buttons').innerHTML = `<button id="modal-update" class="flex-1 bg-yellow-600 py-4 rounded-2xl font-bold italic">GÜNCELLE</button>`;
    
    try {
        const upd = document.getElementById('modal-update');
        if (upd) upd.onclick = () => { updatePlayer(); closeModal(); };
    } catch(e) {}
    
    try {
        attachGenderToggle();
        syncGenderUI();
        attachTeamToggle();
        syncTeamUI();
    } catch(e) {}
    
    document.getElementById('add-player-modal').classList.remove('hidden');
}

export function closeModal() {
    document.getElementById('add-player-modal').classList.add('hidden');
    state.editingPlayerId = null;
    document.getElementById('modal-title').textContent = "YENİ OYUNCU";
    document.getElementById('modal-buttons').innerHTML = `<button id="modal-add-red" class="flex-1 bg-red-600 py-4 rounded-2xl font-bold italic">KIRMIZIYA EKLE</button><button id="modal-add-blue" class="flex-1 bg-blue-600 py-4 rounded-2xl font-bold italic">MAVİYE EKLE</button>`;
    document.getElementById('player-name').value = '';
    
    try {
        document.querySelector('input[name="player-gender"][value="female"]').checked = true;
    } catch(e) {}
    
    try {
        document.getElementById('modal-team-select').classList.add('hidden');
    } catch(e) {}
    
    try {
        document.getElementById('modal-stats').classList.add('hidden');
    } catch(e) {}
    
    try {
        syncGenderUI();
    } catch(e) {}
}

export function startNewGameModal() {
    if (state.currentUser.role !== CONSTANTS.ROLES.ADMIN) {
        return alert('Sadece admin oyun başlatabilir!');
    }
    
    const redP = state.players.filter(p => p.team === CONSTANTS.TEAMS.RED);
    const blueP = state.players.filter(p => p.team === CONSTANTS.TEAMS.BLUE);
    
    if (!redP.length || !blueP.length) {
        return alert('Oyuncu eksik!');
    }
    
    const selects = ['red-select-1', 'red-select-2', 'blue-select-1', 'blue-select-2'];
    selects.forEach(id => {
        const s = document.getElementById(id);
        s.innerHTML = '';
        const team = id.includes('red') ? redP : blueP;
        team.forEach(p => s.innerHTML += `<option value="${p.id}">${p.name}</option>`);
    });

    document.querySelector('input[name="game-type"][value="1"]').checked = true;
    window.updateSelectVisibility();
    document.getElementById('new-game-modal').classList.remove('hidden');
}

export async function startGameFromModal() {
    const type = document.querySelector('input[name="game-type"]:checked').value;
    const category = document.getElementById('game-category')?.value || CONSTANTS.CATEGORIES.REWARD_PUNISHMENT;
    const r1Id = document.getElementById('red-select-1').value;
    const b1Id = document.getElementById('blue-select-1').value;
    const r1P = state.players.find(p => p.id === r1Id);
    const b1P = state.players.find(p => p.id === b1Id);

    let newGame = {
        redId: r1Id,
        redName: r1P.name,
        blueId: b1Id,
        blueName: b1P.name,
        category: category,
    };

    if (type === CONSTANTS.GAME_TYPES.TWO_VS_TWO) {
        const r2Id = document.getElementById('red-select-2').value;
        const b2Id = document.getElementById('blue-select-2').value;
        
        if (r1Id === r2Id || b1Id === b2Id) {
            return alert("Aynı oyuncuyu iki kez seçemezsiniz!");
        }
        
        const r2P = state.players.find(p => p.id === r2Id);
        const b2P = state.players.find(p => p.id === b2Id);
        newGame.redId2 = r2Id;
        newGame.redName2 = r2P.name;
        newGame.blueId2 = b2Id;
        newGame.blueName2 = b2P.name;
    }
    
    await startGame(newGame);
    closeNewGameModal();
}

export function closeNewGameModal() {
    document.getElementById('new-game-modal').classList.add('hidden');
}

export function editGameModal(gameId) {
    const game = state.games.find(g => g.id === gameId);
    if (!game) return;
    
    const modal = document.getElementById('edit-game-modal');
    const info = document.getElementById('edit-info');
    info.textContent = `${game.redName}${game.redId2 ? ' & ' + game.redName2 : ''} vs ${game.blueName}${game.blueId2 ? ' & ' + game.blueName2 : ''}`;
    
    document.getElementById('edit-win-red').onclick = () => {
        updateGameResult(gameId, game.redId2 ? [game.redId, game.redId2] : game.redId);
        modal.classList.add('hidden');
    };
    
    document.getElementById('edit-win-blue').onclick = () => {
        updateGameResult(gameId, game.blueId2 ? [game.blueId, game.blueId2] : game.blueId);
        modal.classList.add('hidden');
    };
    
    modal.classList.remove('hidden');
}

export function addTeamModal() {
    if (state.currentUser.role !== CONSTANTS.ROLES.ADMIN) {
        return alert('Sadece admin takım ekleyebilir!');
    }
    
    state.editingTeamId = null;
    document.getElementById('team-modal-title').textContent = 'YENİ TAKIM EKLE';
    document.getElementById('team-name').value = '';
    document.getElementById('team-base-m').value = '0';
    document.getElementById('team-base-w').value = '0';
    document.getElementById('team-base-l').value = '0';
    document.getElementById('team-base-p').value = '0';
    document.getElementById('team-modal-buttons').innerHTML = `<button id="team-save" class="flex-1 bg-cyan-600 py-4 rounded-2xl font-bold italic">KAYDET</button>`;
    document.getElementById('team-save').onclick = () => { saveTeamFromModal(); };
    document.getElementById('team-modal').classList.remove('hidden');
}

export function editTeamModal(id) {
    if (state.currentUser.role !== CONSTANTS.ROLES.ADMIN) {
        return alert('Sadece admin takım düzeltebilir!');
    }
    
    const team = state.teams.find(t => t.id === id);
    if (!team) return;
    
    state.editingTeamId = id;
    document.getElementById('team-modal-title').textContent = 'TAKIMI DÜZELT';
    document.getElementById('team-name').value = team.name;
    document.getElementById('team-base-m').value = team.baseM || 0;
    document.getElementById('team-base-w').value = team.baseW || 0;
    document.getElementById('team-base-l').value = team.baseL || 0;
    document.getElementById('team-base-p').value = team.baseP || 0;
    document.getElementById('team-modal-buttons').innerHTML = `<button id="team-save" class="flex-1 bg-yellow-600 py-4 rounded-2xl font-bold italic">GÜNCELLE</button>`;
    document.getElementById('team-save').onclick = () => { saveTeamFromModal(); };
    document.getElementById('team-modal').classList.remove('hidden');
}

async function saveTeamFromModal() {
    const name = document.getElementById('team-name').value.trim();
    if (!name) return alert('Takım adı gerekli!');
    
    const teamData = {
        name,
        baseM: parseInt(document.getElementById('team-base-m').value) || 0,
        baseW: parseInt(document.getElementById('team-base-w').value) || 0,
        baseL: parseInt(document.getElementById('team-base-l').value) || 0,
        baseP: parseInt(document.getElementById('team-base-p').value) || 0
    };
    
    await saveTeam(teamData);
    closeTeamModal();
}

export function closeTeamModal() {
    document.getElementById('team-modal').classList.add('hidden');
    state.editingTeamId = null;
}
