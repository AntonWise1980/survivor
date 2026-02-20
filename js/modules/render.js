import { state } from './state.js';
import { CONSTANTS } from './constants.js';
import { getGameTimestamp } from './game.js';

export function renderAll() {
    renderTeam(CONSTANTS.TEAMS.RED);
    renderTeam(CONSTANTS.TEAMS.BLUE);
    renderArchive();
    renderScoreboard('daily');
    renderScoreboard('general');
    renderGidecekler();
    renderDuellolar();
    renderTeamStats();
}

export function renderTeam(team) {
    const topC = document.getElementById(team + '-players-top');
    const extraC = document.getElementById(team + '-extra');
    const btn = document.getElementById('btn-' + team);
    
    topC.innerHTML = '';
    extraC.innerHTML = '';
    
    const teamPlayers = state.players.filter(p => p.team === team);
    teamPlayers.sort((a, b) => {
        const weight = (g) => (g === CONSTANTS.GENDER.FEMALE ? 0 : (g === CONSTANTS.GENDER.MALE ? 1 : 2));
        const wa = weight(a.gender || 'unknown');
        const wb = weight(b.gender || 'unknown');
        if (wa !== wb) return wa - wb;
        return (a.name || '').localeCompare(b.name || '');
    });

    teamPlayers.forEach((player, i) => {
        const div = document.createElement('div');
        div.className = 'flex items-center justify-between bg-zinc-900/50 border border-zinc-700/30 p-3 rounded-xl';
        
        const inG = state.gidecekler.find(g => g.playerId === player.id);
        const inD = state.duellolar.find(d => d.playerId === player.id);
        
        let gidecekBtn = '';
        let duelloBtn = '';
        
        if (state.currentUser.role === CONSTANTS.ROLES.ADMIN) {
            gidecekBtn = `<button onclick="window.toggleGidecek('${player.id}')" class="text-zinc-600 hover:text-emerald-400 transition-colors"><i class="${inG ? 'fas fa-check-circle text-emerald-400' : 'fas fa-arrow-right text-zinc-400'} text-xs"></i></button>`;
            duelloBtn = `<button onclick="window.toggleDuello('${player.id}')" class="text-zinc-600 hover:text-amber-400 transition-colors"><i class="fas fa-crosshairs ${inD ? 'text-amber-400' : 'text-zinc-400'} text-xs"></i></button>`;
        }
        
        const buttonsHTML = `<div class="flex gap-3">${state.currentUser.role === CONSTANTS.ROLES.ADMIN ? `<button onclick="window.editPlayer('${player.id}')" class="text-zinc-600 hover:text-yellow-500 transition-colors"><i class="fas fa-edit text-xs"></i></button><button onclick="window.removePlayer('${player.id}')" class="text-zinc-600 hover:text-red-500 transition-colors"><i class="fas fa-times text-xs"></i></button>` : ''}${gidecekBtn}${duelloBtn}</div>`;
        
        div.innerHTML = `<div class="font-bold text-sm truncate">${i + 1}- ${player.name}</div>${buttonsHTML}`;
        
        if (i < CONSTANTS.DISPLAY_LIMITS.TEAM_TOP) topC.appendChild(div);
        else extraC.appendChild(div);
    });
    
    if (teamPlayers.length > CONSTANTS.DISPLAY_LIMITS.TEAM_TOP) btn.classList.remove('hidden');
    else btn.classList.add('hidden');
}

export function renderScoreboard(type) {
    const topC = document.getElementById(type + '-scoreboard-top');
    const extraC = document.getElementById(type + '-extra');
    const btn = document.getElementById('btn-' + type);
    
    topC.innerHTML = '';
    extraC.innerHTML = '';
    
    if (type === 'daily') {
        const titleEl = document.getElementById('daily-title');
        if (titleEl) {
            const today = new Date().toLocaleDateString('tr-TR');
            titleEl.innerHTML = `<i class="fas fa-calendar-day"></i> GÜNLÜK TABLO <span class="text-xs text-zinc-500 font-normal">(${today})</span>`;
        }
    }
    
    let stats = calculateStats(type);
    
    stats.forEach((p, i) => {
        const div = document.createElement('div');
        div.className = 'flex items-center bg-zinc-900 p-3 rounded-xl border border-zinc-700/50';
        div.innerHTML = `
            <div class="flex-1 flex items-center gap-2 min-w-0">
                <div class="${p.team === CONSTANTS.TEAMS.RED ? 'bg-red-500' : 'bg-blue-500'} w-3 h-3 rounded-full shrink-0"></div>
                <div class="font-bold text-xs truncate">${p.name}</div>
            </div>
            <div class="w-7 text-center text-[11px] font-medium text-zinc-500">${p.m}</div>
            <div class="w-7 text-center text-[11px] font-black text-emerald-400">${p.w}</div>
            <div class="w-7 text-center text-[11px] font-medium text-red-400">${p.l}</div>
            <div class="w-7 text-center text-[11px] font-black text-emerald-400">${p.p}</div>
        `;
        
        if (i < CONSTANTS.DISPLAY_LIMITS.SCOREBOARD_TOP) topC.appendChild(div);
        else extraC.appendChild(div);
    });
    
    if (stats.length > CONSTANTS.DISPLAY_LIMITS.SCOREBOARD_TOP) btn.classList.remove('hidden');
    else btn.classList.add('hidden');
}

function calculateStats(type) {
    if (type === 'daily') {
        let stats = state.players.map(p => ({ ...p, m: 0, w: 0, l: 0, p: 0 }));
        const now = new Date();
        
        const relevantGames = state.games.filter(g => {
            const ts = getGameTimestamp(g);
            if (!ts) return false;
            const gameDate = new Date(ts);
            const resetDate = new Date(gameDate);
            resetDate.setDate(resetDate.getDate() + 1);
            resetDate.setHours(20, 0, 0, 0);
            return now < resetDate;
        });
        
        relevantGames.forEach(g => {
            const winners = Array.isArray(g.winnerId) ? g.winnerId : [g.winnerId];
            const winnerP = state.players.find(p => p.id === winners[0]);
            if (!winnerP) return;
            
            const isRedWinner = winnerP.team === CONSTANTS.TEAMS.RED;
            const losers = isRedWinner 
                ? [g.blueId, g.blueId2].filter(Boolean) 
                : [g.redId, g.redId2].filter(Boolean);
            
            winners.forEach(id => {
                const s = stats.find(x => x.id === id);
                if (s) { s.m++; s.w++; s.p++; }
            });
            
            losers.forEach(id => {
                const s = stats.find(x => x.id === id);
                if (s) { s.m++; s.l++; s.p--; }
            });
        });
        
        return stats.filter(s => s.m > 0).sort((a, b) => b.w - a.w || b.m - a.m);
    } else {
        return state.players
            .map(p => ({ 
                ...p, 
                m: p.stats?.m || 0, 
                w: p.stats?.w || 0, 
                l: p.stats?.l || 0, 
                p: p.stats?.p || 0 
            }))
            .filter(s => s.m > 0)
            .sort((a, b) => b.p - a.p || b.w - a.w);
    }
}

export function renderGidecekler() {
    renderSpecialList('gidecek', state.gidecekler);
}

export function renderDuellolar() {
    renderSpecialList('duello', state.duellolar);
}

function renderSpecialList(type, list) {
    const topC = document.getElementById(type + '-top');
    const extraC = document.getElementById(type + '-extra');
    const btn = document.getElementById('btn-' + type);
    
    if (!topC) return;
    
    topC.innerHTML = '';
    extraC.innerHTML = '';

    const ids = list.map(item => item.playerId);
    const filtered = state.players
        .filter(p => ids.includes(p.id))
        .map(p => ({ 
            ...p, 
            m: p.stats?.m || 0, 
            w: p.stats?.w || 0, 
            l: p.stats?.l || 0, 
            p: p.stats?.p || 0 
        }))
        .sort((a, b) => b.w - a.w || a.l - b.l);

    filtered.forEach((p, i) => {
        const div = document.createElement('div');
        div.className = 'flex items-center bg-zinc-900 p-3 rounded-xl border border-zinc-700/50';
        div.innerHTML = `
            <div class="flex-1 flex items-center gap-2 min-w-0">
                <div class="${p.team === CONSTANTS.TEAMS.RED ? 'bg-red-500' : 'bg-blue-500'} w-3 h-3 rounded-full shrink-0"></div>
                <div class="font-bold text-xs truncate">${p.name}</div>
            </div>
            <div class="w-7 text-center text-[11px] font-medium text-zinc-500">${p.m}</div>
            <div class="w-7 text-center text-[11px] font-black text-emerald-400">${p.w}</div>
            <div class="w-7 text-center text-[11px] font-medium text-red-400">${p.l}</div>
            <div class="w-7 text-center text-[11px] font-black text-emerald-400">${p.p}</div>
        `;
        
        if (i < CONSTANTS.DISPLAY_LIMITS.SCOREBOARD_TOP) topC.appendChild(div);
        else extraC.appendChild(div);
    });
    
    if (filtered.length > CONSTANTS.DISPLAY_LIMITS.SCOREBOARD_TOP) btn.classList.remove('hidden');
    else btn.classList.add('hidden');
}

export function renderArchive() {
    const container = document.getElementById('game-archive');
    container.innerHTML = '';
    
    const grouped = {};
    state.games.forEach(game => {
        if (!grouped[game.date]) grouped[game.date] = [];
        grouped[game.date].push(game);
    });
    
    const sortedDates = Object.keys(grouped).sort((a, b) => 
        b.split('.').reverse().join('-').localeCompare(a.split('.').reverse().join('-'))
    );
    
    if (sortedDates.length === 0) {
        container.innerHTML = '<div class="text-zinc-600 text-center py-10 text-sm italic">Henüz oynanmış bir maç yok.</div>';
        return;
    }

    sortedDates.forEach(date => {
        let dayGames = grouped[date];
        dayGames = [...dayGames].sort((a, b) => getGameTimestamp(b) - getGameTimestamp(a));
        
        let rW = 0, bW = 0;
        dayGames.forEach(g => {
            const firstWinnerId = Array.isArray(g.winnerId) ? g.winnerId[0] : g.winnerId;
            const winnerP = state.players.find(x => x.id === firstWinnerId);
            if (winnerP) (winnerP.team === CONSTANTS.TEAMS.RED) ? rW++ : bW++;
        });

        const dayCategory = dayGames.length ? (dayGames[0].category || '').toUpperCase() : '';
        const isOpen = state.openArchives[date];
        
        const itemDiv = document.createElement('div');
        itemDiv.className = `archive-item border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-900/20 ${isOpen ? 'active' : ''}`;
        
        itemDiv.innerHTML = `
            <div onclick="window.toggleArchive('${date}')" class="archive-header flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-800/50 transition-all">
                <div class="flex items-center gap-3">
                    <i class="fas fa-chevron-down text-[10px] text-zinc-500 chevron transition-transform duration-300"></i>
                    <span class="text-xs font-black uppercase tracking-widest text-zinc-400">${date}${dayCategory ? ' - ' + dayCategory : ''}</span>
                </div>
                <div class="flex items-center gap-4">
                    <div class="flex items-center gap-2 text-[11px] font-bold">
                        <span class="text-red-500">${rW}</span>
                        <span class="text-zinc-700">-</span>
                        <span class="text-blue-500">${bW}</span>
                    </div>
                    <div class="w-2 h-2 rounded-full ${rW > bW ? 'bg-red-500' : (bW > rW ? 'bg-blue-500' : 'bg-zinc-600')} shadow-[0_0_8px_currentColor]"></div>
                </div>
            </div>
            <div class="archive-content" style="max-height: ${isOpen ? '2000px' : '0'}">
                <div class="p-4 pt-0 space-y-3">
                    <div class="h-px bg-zinc-800/50 mb-4"></div>
                    ${dayGames.map(game => renderGameCard(game)).join('')}
                    <div class="mt-4 p-3 bg-zinc-900/30 rounded-xl text-sm font-bold text-center">
                        Günün Toplamı: <span class="text-red-400">${rW}</span> - <span class="text-blue-400">${bW}</span>
                        &nbsp;—&nbsp;Kazanan: <span class="${rW > bW ? 'text-red-400' : (bW > rW ? 'text-blue-400' : 'text-zinc-400')}">${rW > bW ? 'KIRMIZI' : (bW > rW ? 'MAVİ' : 'BERABERE')}</span>
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(itemDiv);
    });
}

function renderGameCard(game) {
    const winnerP = state.players.find(p => p.id === (Array.isArray(game.winnerId) ? game.winnerId[0] : game.winnerId));
    const isWinnerRed = winnerP ? winnerP.team === CONSTANTS.TEAMS.RED : false;
    const redDisplayName = game.redName2 ? `${game.redName} & ${game.redName2}` : game.redName;
    const blueDisplayName = game.blueName2 ? `${game.blueName} & ${game.blueName2}` : game.blueName;
    
    const editDeleteButtons = state.currentUser.role === CONSTANTS.ROLES.ADMIN ? `
        <div class="flex gap-3">
            <button onclick="window.editGame('${game.id}')" class="text-zinc-700 hover:text-yellow-500 transition-colors">
                <i class="fas fa-edit"></i>
            </button>
            <button onclick="window.deleteGame('${game.id}')" class="text-zinc-700 hover:text-red-500 transition-colors">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    ` : '';

    return `
        <div class="bg-zinc-800/30 border border-zinc-800/50 p-3 rounded-xl relative group">
            <div class="flex justify-between items-center text-[10px] text-zinc-600 mb-2 font-bold uppercase">
                <div class="flex items-center gap-2">
                    <span>${game.time}</span>
                    <span class="text-[10px] text-zinc-400 bg-zinc-900/40 px-2 py-1 rounded-xl font-medium">${game.category || ''}</span>
                </div>
                ${editDeleteButtons}
            </div>
            <div class="flex items-center gap-3">
                <div class="flex-1 text-right text-sm font-bold ${isWinnerRed ? 'text-red-400' : 'text-zinc-600'}">${redDisplayName}</div>
                <div class="text-[10px] text-zinc-800 font-black italic">VS</div>
                <div class="flex-1 text-left text-sm font-bold ${!isWinnerRed ? 'text-blue-400' : 'text-zinc-600'}">${blueDisplayName}</div>
            </div>
            <div class="text-center text-sm font-black text-emerald-500/80 mt-2 uppercase italic">
                🏆 KAZANAN: ${isWinnerRed ? 'KIRMIZI' : 'MAVİ'} ${game.redId2 ? '🚩' : ''}
            </div>
        </div>
    `;
}

export function renderTeamStats() {
    const container = document.getElementById('team-stats');
    if (!container) return;

    const redTeam = state.teams.find(t => t.name.toLowerCase().includes('kırmızı'));
    const blueTeam = state.teams.find(t => t.name.toLowerCase().includes('mavi'));
    
    if (!redTeam || !blueTeam) {
        container.innerHTML = '<div class="text-zinc-600 text-center py-4 text-sm">Takım bulunamadı</div>';
        return;
    }

    const groupedByDate = {};
    state.games.forEach(game => {
        if (!groupedByDate[game.date]) groupedByDate[game.date] = [];
        groupedByDate[game.date].push(game);
    });

    let redStats = { name: redTeam.name, m: redTeam.baseM || 0, w: redTeam.baseW || 0, l: redTeam.baseL || 0, p: redTeam.baseP || 0 };
    let blueStats = { name: blueTeam.name, m: blueTeam.baseM || 0, w: blueTeam.baseW || 0, l: blueTeam.baseL || 0, p: blueTeam.baseP || 0 };

    for (const date in groupedByDate) {
        const dayGames = groupedByDate[date];
        let redWins = 0, blueWins = 0;

        dayGames.forEach(game => {
            const winnerId = Array.isArray(game.winnerId) ? game.winnerId[0] : game.winnerId;
            const winnerPlayer = state.players.find(p => p.id === winnerId);
            if (winnerPlayer) {
                if (winnerPlayer.team === CONSTANTS.TEAMS.RED) redWins++;
                else blueWins++;
            }
        });

        if (redWins > 0 || blueWins > 0) {
            redStats.m++;
            blueStats.m++;
            if (redWins > blueWins) {
                redStats.w++;
                blueStats.l++;
                redStats.p++;
            } else if (blueWins > redWins) {
                blueStats.w++;
                redStats.l++;
                blueStats.p++;
            }
        }
    }

    const allStats = [redStats, blueStats].sort((a, b) => b.w - a.w);
    const totalWins = redStats.w + blueStats.w;

    container.innerHTML = `
        <div class="flex text-[10px] font-black text-zinc-500 uppercase px-4 mb-2">
            <div class="flex-1">TAKIM</div>
            <div class="w-7 text-center">M</div><div class="w-7 text-center">G</div><div class="w-7 text-center">M</div><div class="w-7 text-center">P</div>
            ${state.currentUser.role === CONSTANTS.ROLES.ADMIN ? '<div class="w-16"></div>' : ''}
        </div>
        ${allStats.map((t, idx) => {
            const teamId = idx === 0 && allStats[0].name === redTeam.name ? redTeam.id : blueTeam.id;
            return `
            <div class="flex items-center bg-zinc-900 p-3 rounded-xl border border-zinc-700/50">
                <div class="flex-1 flex items-center gap-2 min-w-0">
                    <div class="font-bold text-xs truncate">${t.name}</div>
                </div>
                <div class="w-7 text-center text-[11px] font-medium text-zinc-500">${t.m}</div>
                <div class="w-7 text-center text-[11px] font-black text-emerald-400">${t.w}</div>
                <div class="w-7 text-center text-[11px] font-medium text-red-400">${t.l}</div>
                <div class="w-7 text-center text-[11px] font-black text-emerald-400">${t.p}</div>
                ${state.currentUser.role === CONSTANTS.ROLES.ADMIN ? `<div class="w-16 flex gap-2 justify-end">
                    <button onclick="window.editTeam('${teamId}')" class="text-zinc-600 hover:text-yellow-500 transition-colors">
                        <i class="fas fa-edit text-xs"></i>
                    </button>
                    <button onclick="window.deleteTeam('${teamId}')" class="text-zinc-600 hover:text-red-500 transition-colors">
                        <i class="fas fa-trash-alt text-xs"></i>
                    </button>
                </div>` : ''}
            </div>
        `}).join('')}
        ${allStats.length >= 2 ? `
            <div class="mt-4 p-4 bg-zinc-900/50 rounded-xl border border-zinc-700/30">
                <div class="text-[10px] font-bold text-zinc-400 mb-3 uppercase text-center">Güç Karşılaştırması</div>
                <div class="flex items-center gap-2">
                    ${allStats.map(t => {
                        const percentage = totalWins > 0 ? Math.round((t.w / totalWins) * 100) : 0;
                        const isRed = t.name.toLowerCase().includes('kırmızı');
                        const isBlue = t.name.toLowerCase().includes('mavi');
                        const gradient = isRed ? 'from-red-500 to-red-600' : isBlue ? 'from-blue-500 to-blue-600' : 'from-emerald-500 to-emerald-600';
                        return `
                            <div class="flex-1">
                                <div class="text-[10px] font-bold mb-1 truncate">${t.name}</div>
                                <div class="w-full bg-zinc-800 rounded-full h-6 overflow-hidden">
                                    <div class="bg-gradient-to-r ${gradient} h-full flex items-center justify-center text-[10px] font-black text-white" style="width: ${percentage}%">
                                        ${percentage}%
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('<div class="text-zinc-600 font-black text-xs">VS</div>')}
                </div>
            </div>
        ` : ''}
    `;
}
