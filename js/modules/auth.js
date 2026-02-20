import { db, auth, signInWithPopup, googleProvider, signOut } from '../../firebase-config.js';
import { collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { CONSTANTS, COLLECTIONS, STORAGE_KEYS } from './constants.js';
import { state } from './state.js';

export async function checkAndAddDefaultAdmin() {
    try {
        const adminsSnapshot = await getDocs(collection(db, COLLECTIONS.ADMINS));
        if (adminsSnapshot.size === 0) {
            await addDoc(collection(db, COLLECTIONS.ADMINS), { 
                username: "admin", 
                password: "1234" 
            });
        }
    } catch (e) {
        console.log('Admin setup:', e.message);
    }
}

export async function adminLogin() {
    const username = document.getElementById('admin-username').value.trim();
    const password = document.getElementById('admin-password').value.trim();
    
    if (!username || !password) return alert('Kullanıcı adı ve şifre gerekli!');

    try {
        await checkAndAddDefaultAdmin();
        const adminsSnapshot = await getDocs(collection(db, COLLECTIONS.ADMINS));
        const admin = adminsSnapshot.docs.find(doc => 
            doc.data().username === username && doc.data().password === password
        );
        
        if (admin) {
            state.currentUser = { role: CONSTANTS.ROLES.ADMIN, name: username };
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(state.currentUser));
            return true;
        } else {
            alert('Kullanıcı adı veya şifre yanlış!');
            return false;
        }
    } catch (error) {
        alert('Giriş hatası: ' + error.message);
        return false;
    }
}

export async function gmailLogin() {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        state.currentUser = { 
            role: CONSTANTS.ROLES.VIEWER, 
            name: result.user.displayName || result.user.email 
        };
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(state.currentUser));
        return true;
    } catch (error) {
        alert('Gmail girişi başarısız: ' + error.message);
        return false;
    }
}

export function viewerLogin() {
    state.currentUser = { role: CONSTANTS.ROLES.VIEWER, name: 'İzleyici' };
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(state.currentUser));
    return true;
}

export async function logout() {
    if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
        state.currentUser = { role: null, name: null };
        localStorage.removeItem(STORAGE_KEYS.USER);
        
        Object.values(state.unsubscribers).forEach(unsub => {
            if (unsub) unsub();
        });
        
        await signOut(auth);
        document.getElementById('login-screen').classList.remove('hidden');
        document.getElementById('admin-username').value = '';
        document.getElementById('admin-password').value = '';
    }
}

export function checkUserSession() {
    const saved = localStorage.getItem(STORAGE_KEYS.USER);
    if (saved) {
        state.currentUser = JSON.parse(saved);
        return true;
    }
    return false;
}

export function updateUIByRole() {
    const userInfo = document.getElementById('user-info');
    const isAdmin = state.currentUser.role === CONSTANTS.ROLES.ADMIN;

    if (isAdmin) {
        userInfo.innerHTML = `<i class="fas fa-user-shield text-orange-500"></i><span>Admin: ${state.currentUser.name}</span>`;
    } else {
        userInfo.innerHTML = `<i class="fas fa-eye text-blue-500"></i><span>İzleyici: ${state.currentUser.name}</span>`;
    }

    const adminElements = [
        'btn-add-player', 'btn-new-game', 'btn-cancel-game', 'btn-add-team'
    ];
    
    adminElements.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.toggle('hidden', !isAdmin);
        }
    });
}
