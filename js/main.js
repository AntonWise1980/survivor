import { startApp, showMainApp } from './modules/app.js';
import { adminLogin, viewerLogin, logout } from './modules/auth.js';
import { addPlayer, removePlayer, toggleGidecek, toggleDuello } from './modules/player.js';
import { selectWinner, cancelActiveGame, deleteGame } from './modules/game.js';
import { deleteTeam } from './modules/team.js';
import { toggleSection, toggleArchive, updateSelectVisibility, switchToAdmin, switchToViewer } from './modules/ui-utils.js';
import { addPlayerModal, editPlayerModal, closeModal, startNewGameModal, startGameFromModal, closeNewGameModal, editGameModal, addTeamModal, editTeamModal, closeTeamModal } from './modules/modals.js';
import { renderAll } from './modules/render.js';

// Global window functions for onclick handlers
window.addPlayerModal = addPlayerModal;
window.editPlayer = editPlayerModal;
window.removePlayer = removePlayer;
window.closeModal = closeModal;
window.toggleSection = toggleSection;
window.toggleArchive = toggleArchive;
window.startNewGameModal = startNewGameModal;
window.startGameFromModal = startGameFromModal;
window.closeNewGameModal = closeNewGameModal;
window.updateSelectVisibility = updateSelectVisibility;
window.selectWinner = selectWinner;
window.cancelActiveGame = cancelActiveGame;
window.deleteGame = deleteGame;
window.editGame = editGameModal;
window.toggleGidecek = toggleGidecek;
window.toggleDuello = toggleDuello;
window.addTeamModal = addTeamModal;
window.editTeam = editTeamModal;
window.deleteTeam = deleteTeam;
window.closeTeamModal = closeTeamModal;
window.switchToAdmin = switchToAdmin;
window.switchToViewer = switchToViewer;
window.adminLogin = async () => {
    const success = await adminLogin();
    if (success) showMainApp();
};
window.viewerLogin = () => {
    viewerLogin();
    showMainApp();
};
window.logout = logout;

// Start the application
startApp();
