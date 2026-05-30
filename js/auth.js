// ==========================================================================
// ARTNEST DECORS - ADMINISTRATIVE AUTHENTICATION MODULE (auth.js)
// ==========================================================================

const API_BASE_URL = "http://localhost:8080/api";

document.addEventListener('DOMContentLoaded', () => {
    syncAdministrativeSessionUI();
});

/**
 * Validates token states and manages visibility toggles for restricted controls
 */
function syncAdministrativeSessionUI() {
    const token = localStorage.getItem('artnest_token');
    const bodyNode = document.body;
    const logoutBtn = document.getElementById('logoutBtn');
    const loginBtn = document.getElementById('loginBtn');
    const userBadge = document.getElementById('userBadge');

    if (token) {
        bodyNode.classList.add('is-admin');
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        if (loginBtn) loginBtn.style.display = 'none';
        if (userBadge) userBadge.style.display = 'inline-block';
    } else {
        bodyNode.classList.remove('is-admin');
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (userBadge) userBadge.style.display = 'none';
    }
}

/**
 * Purges admin tokens from systemic caching before routing back to root landing layers
 */
function logoutSession() {
    localStorage.removeItem('artnest_token');
    const referencePrefix = window.location.pathname.includes('/services/') ? '../' : '';
    window.location.href = referencePrefix + 'index.html';
}

// Global shortcut macro command hook (Ctrl + Alt + A) for instant admin access
window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.altKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        const referencePrefix = window.location.pathname.includes('/services/') ? '../' : '';
        window.location.href = referencePrefix + 'login.html';
    }
});