export const state = {
    players: [],
    games: [],
    gidecekler: [],
    duellolar: [],
    teams: [],
    expanded: { daily: false, general: false, red: false, blue: false, gidecek: false, duello: false },
    openArchives: {},
    editingPlayerId: null,
    editingTeamId: null,
    currentUser: { role: null, name: null },
    unsubscribers: {
        players: null,
        games: null,
        status: null,
        gidecek: null,
        duello: null,
        teams: null
    }
};

export function updateState(key, value) {
    state[key] = value;
}

export function getState(key) {
    return state[key];
}
