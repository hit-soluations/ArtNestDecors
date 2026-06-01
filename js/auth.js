// ==========================================================================
// ARTNEST DECORS - ADMINISTRATIVE AUTHENTICATION MODULE (auth.js)
// ==========================================================================

const API_BASE_URL = "http://localhost:8080/api";

document.addEventListener('DOMContentLoaded', () => {
    syncAdministrativeSessionUI();
});

/**
 * Ensure an Admin link exists in the main navigation when logged in
 */
function ensureAdminLink(show) {
    const navList = document.querySelector('.nav-links');
    if (!navList) return;

    let adminLi = document.getElementById('adminLinkLi');
    if (show) {
        if (!adminLi) {
            adminLi = document.createElement('li');
            adminLi.id = 'adminLinkLi';
            adminLi.innerHTML = `<a href="/welcome">Admin</a>`;
            const loginBtn = document.getElementById('loginBtn');
            if (loginBtn) {
                const parentLi = loginBtn.closest('li');
                if (parentLi) parentLi.parentNode.insertBefore(adminLi, parentLi);
                else navList.appendChild(adminLi);
            } else {
                navList.appendChild(adminLi);
            }
        }
    } else {
        if (adminLi) adminLi.remove();
    }
}

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
        ensureAdminLink(true);
    } else {
        bodyNode.classList.remove('is-admin');
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (userBadge) userBadge.style.display = 'none';
        ensureAdminLink(false);
    }
}

/**
 * Purges admin tokens from systemic caching before routing back to root landing layers
 */
function logoutSession() {
    localStorage.removeItem('artnest_token');
    localStorage.removeItem('artnest_user');
    syncAdministrativeSessionUI();
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