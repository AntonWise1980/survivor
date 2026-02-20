import { state } from './state.js';
import { CONSTANTS } from './constants.js';

export function toggleSection(type) {
    state.expanded[type] = !state.expanded[type];
    const extra = document.getElementById(type + '-extra');
    const btn = document.getElementById('btn-' + type);
    
    if (state.expanded[type]) {
        extra.style.maxHeight = extra.scrollHeight + "px";
        btn.textContent = "DAHA AZ";
    } else {
        extra.style.maxHeight = "0";
        btn.textContent = "DAHA FAZLA";
    }
}

export function toggleArchive(date) {
    state.openArchives[date] = !state.openArchives[date];
}

export function attachGenderToggle() {
    const inputs = Array.from(document.querySelectorAll('input[name="player-gender"]'));
    inputs.forEach(input => {
        const lab = input.closest('label');
        if (!lab) return;
        lab.onclick = (e) => {
            e.preventDefault();
            input.checked = true;
            syncGenderUI();
        };
    });
}

export function syncGenderUI() {
    document.querySelectorAll('label.player-gender-label').forEach(l => {
        const inp = l.querySelector('input[name="player-gender"]');
        if (!inp) return;
        if (inp.checked) l.classList.add('active');
        else l.classList.remove('active');
    });
}

export function attachTeamToggle() {
    const inputs = Array.from(document.querySelectorAll('input[name="player-team"]'));
    inputs.forEach(input => {
        const lab = input.closest('label');
        if (!lab) return;
        lab.onclick = (e) => {
            e.preventDefault();
            input.checked = true;
            syncTeamUI();
        };
    });
}

export function syncTeamUI() {
    document.querySelectorAll('label.player-team-label').forEach(l => {
        const inp = l.querySelector('input[name="player-team"]');
        if (!inp) return;
        if (inp.checked) l.classList.add('active');
        else l.classList.remove('active');
    });
}

export function updateSelectVisibility() {
    const type = document.querySelector('input[name="game-type"]:checked').value;
    const red2 = document.getElementById('red-select-2');
    const blue2 = document.getElementById('blue-select-2');
    
    if (type === CONSTANTS.GAME_TYPES.TWO_VS_TWO) {
        red2.classList.remove('hidden');
        blue2.classList.remove('hidden');
    } else {
        red2.classList.add('hidden');
        blue2.classList.add('hidden');
    }
}

export function switchToAdmin() {
    document.getElementById('admin-tab').classList.remove('hidden');
    document.getElementById('viewer-tab').classList.add('hidden');
}

export function switchToViewer() {
    document.getElementById('admin-tab').classList.add('hidden');
    document.getElementById('viewer-tab').classList.remove('hidden');
}
