// ==========================================================================
// GLOBAL WEBSITE OPERATIONS, CAROUSEL ENGINE & ASSET MANAGEMENT (main.js)
// ==========================================================================

/* --- Remove this comment document.addEventListener("DOMContentLoaded", function() {
    
    // --- 1. GLOBAL NAVBAR DROPDOWN CLICK LOGIC ---
    const dropdownTrigger = document.querySelector('.dropdown-trigger');
    const dropdownMenu = document.querySelector('.dropdown-menu');

    if (dropdownTrigger && dropdownMenu) {
        dropdownTrigger.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
        });

        // Close dropdown if user clicks anywhere else on the screen
        document.addEventListener('click', function() {
            dropdownMenu.classList.remove('show');
        });
    }

    // --- 2. SAFE HOME HERO CAROUSEL ENGINE (With Auto-Rotation Timing) ---
    const track = document.getElementById('homeHeroCarouselTrack');
    const prevBtn = document.getElementById('carouselPrevBtn');
    const nextBtn = document.getElementById('carouselNextBtn');
    const dotsContainer = document.getElementById('carouselDotsIndicatorRow');

    // CRITICAL GUARD CHECK: If carousel elements don't exist on this page, skip execution safely!
    if (track && prevBtn && nextBtn && dotsContainer) {
        initializeHomeHeroCarouselEngine(track, prevBtn, nextBtn, dotsContainer);
    }

    // --- 3. DYNAMIC SERVICE ROUTER INITIALIZATION ---
    // Automatically triggers gallery fetching if a query parameter id is present on current location
    const urlParams = new URLSearchParams(window.location.search);
    const serviceId = urlParams.get('id');
    if (serviceId) {
        fetchAndRenderServiceGallery(serviceId);
    }
});

/**
 * Complete Carousel Loop and Auto-Scrolling Core Mechanics Block
 */
/* --- Remove this comment function initializeHomeHeroCarouselEngine(track, prevBtn, nextBtn, dotsContainer) {
    const slides = Array.from(track.children);
    let activeIndex = 0;
    let rotationTimer = null;
    const ROTATION_INTERVAL_MS = 5000; // Auto-scrolling changes every 5 seconds

    // Build bottom indicator tracking dots dynamically based on verified slide counts
    slides.forEach((_, index) => {
        const dot = document.createElement('button');
        dot.className = `carousel-indicator-dot ${index === 0 ? 'is-active' : ''}`;
        dot.setAttribute('aria-label', `Maps to slide view framework node ${index + 1}`);
        dot.addEventListener('click', () => {
            jumpToTargetSlideIndex(index);
            restartAutoRotationTimer();
        });
        dotsContainer.appendChild(dot);
    });

    const dots = Array.from(dotsContainer.children);

    function jumpToTargetSlideIndex(targetIndex) {
        // Remove active class states from existing index track
        slides[activeIndex].classList.remove('is-active');
        if (dots.length > 0) dots[activeIndex].classList.remove('is-active');

        // Loop array indexes securely 
        if (targetIndex >= slides.length) {
            activeIndex = 0;
        } else if (targetIndex < 0) {
            activeIndex = slides.length - 1;
        } else {
            activeIndex = targetIndex;
        }

        // Apply active display classes to new targeted selection index
        slides[activeIndex].classList.add('is-active');
        if (dots[activeIndex]) dots[activeIndex].classList.add('is-active');
    }

    nextBtn.addEventListener('click', () => {
        jumpToTargetSlideIndex(activeIndex + 1);
        restartAutoRotationTimer();
    });

    prevBtn.addEventListener('click', () => {
        jumpToTargetSlideIndex(activeIndex - 1);
        restartAutoRotationTimer();
    });

    function startAutoRotationTimer() {
        rotationTimer = setInterval(() => {
            jumpToTargetSlideIndex(activeIndex + 1);
        }, ROTATION_INTERVAL_MS);
    }

    function restartAutoRotationTimer() {
        clearInterval(rotationTimer);
        startAutoRotationTimer();
    }

    // Fire up the auto-scroll cycle loop initialization
    startAutoRotationTimer();
}

// ==========================================================================
// CORE API PORTFOLIO DATABASE REPOSITORIES INTERACTIVE ENGINES
// ==========================================================================

/**
 * Fetches assets from the live API microservice or outputs standard secure locks
 */
/* --- Remove this comment async function fetchAndRenderServiceGallery(serviceId) {
    const token = localStorage.getItem('artnest_token');
    const galleryGrid = document.getElementById('runtimeActiveGalleryGrid');
    const premiumLockMessage = document.getElementById('premiumVaultLockMessage');
    
    if (!galleryGrid) return;
    galleryGrid.innerHTML = '';

    if (!token && premiumLockMessage) {
        premiumLockMessage.style.display = 'block';
    } else if (premiumLockMessage) {
        premiumLockMessage.style.display = 'none';
    }

    try {
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const response = await fetch(`${API_BASE_URL}/assets/${serviceId}`, { headers });
        const assets = await response.json();

        if (!assets || assets.length === 0) {
            galleryGrid.innerHTML = `<p style="grid-column: 1/-1; color: var(--text-muted); text-align: center; padding: 40px 0; font-style: italic;">No portfolio design images have been added yet.</p>`;
            return;
        }

        assets.forEach(asset => {
            const card = document.createElement('div');
            card.className = 'gallery-card-item'; // Matches our modular template styles
            
            let badgeMarkup = '';
            if (token) {
                badgeMarkup = `<span class="visibility-status-tag" style="position: absolute; top: 10px; left: 10px; padding: 4px 8px; font-size: 11px; color: #FFF; font-weight: 600; border-radius: 2px; background:${asset.publicView ? '#5cb85c':'#d9534f'}">${asset.publicView ? 'Public':'Hidden'}</span>`;
            }

            card.innerHTML = `
                <img src="${asset.src}" alt="Portfolio Project Design Image Node">
                ${badgeMarkup}
                <button class="delete-btn" style="position: absolute; top: 10px; right: 10px; border: none; background: rgba(217,83,79,0.9); color:#FFF; font-size:16px; width:26px; height:26px; border-radius:50%; cursor:pointer; line-height:24px; display: ${token ? 'block' : 'none'};" onclick="purgeAssetNode('${asset._id}', '${serviceId}')">&times;</button>
            `;
            galleryGrid.appendChild(card);
        });
    } catch (err) {
        console.error("Could not fetch service gallery profiles from system database registry:", err);
    }
}

/**
 * Encapsulates payload files inside a Multipart FormData schema stream boundary for secure engine imports
 */
/* --- Remove this comment async function handleAssetUpload(event, serviceId) {
    const file = event.target.files[0];
    if (!file) return;

    const isPublic = document.getElementById('adminPermissionVisitorView').checked;
    const token = localStorage.getItem('artnest_token');

    const formData = new FormData();
    formData.append('photo', file);
    formData.append('serviceId', serviceId);
    formData.append('publicView', isPublic);

    try {
        const response = await fetch(`${API_BASE_URL}/assets/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (response.ok) {
            fetchAndRenderServiceGallery(serviceId);
            event.target.value = '';
        } else {
            alert('Upload rejected by core security verification framework server.');
        }
    } catch (err) {
        console.error("Upload process error encountered:", err);
    }
}

/**
 * Fires dynamic parameters down to REST API endpoint nodes to clear out targeted asset items
 */
/* Remove this comment async function purgeAssetNode(assetId, serviceId) {
    if (!confirm('Permanently remove this layout configuration from the portfolio database?')) return;
    const token = localStorage.getItem('artnest_token');

    try {
        const response = await fetch(`${API_BASE_URL}/assets/${assetId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            fetchAndRenderServiceGallery(serviceId);
        } else {
            alert('Could not safely clean up selected image node asset item.');
        }
    } catch (err) {
        console.error("Deletion endpoint execution failure:", err);
    }
}

function togglePremiumForm() {
    const actionTrigger = document.getElementById('clickMoreActionTrigger');
    const expansionNode = document.getElementById('premiumFormExpansionNode');
    
    if (actionTrigger) actionTrigger.style.display = 'none';
    if (expansionNode) expansionNode.style.display = 'block';
} ---Remove this */

// ==========================================================================
// GLOBAL WEBSITE OPERATIONS, CAROUSEL ENGINE & ASSET MANAGEMENT (main.js)
// ==========================================================================

document.addEventListener("DOMContentLoaded", function() {
    
    // --- 1. GLOBAL NAVBAR DROPDOWN CLICK LOGIC ---
    const dropdownTrigger = document.querySelector('.dropdown-trigger');
    const dropdownMenu = document.querySelector('.dropdown-menu');

    if (dropdownTrigger && dropdownMenu) {
        dropdownTrigger.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
        });

        document.addEventListener('click', function() {
            dropdownMenu.classList.remove('show');
        });
    }

    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuToggle && navLinks) {
        mobileMenuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            navLinks.classList.toggle('open');
            mobileMenuToggle.classList.toggle('open');
        });

        navLinks.addEventListener('click', function(e) {
            e.stopPropagation();
        });

        document.addEventListener('click', function() {
            navLinks.classList.remove('open');
            mobileMenuToggle.classList.remove('open');
        });
    }

    // --- 2. SAFE HOME HERO CAROUSEL ENGINE ---
    const track = document.getElementById('homeHeroCarouselTrack');
    const prevBtn = document.getElementById('carouselPrevBtn');
    const nextBtn = document.getElementById('carouselNextBtn');
    const dotsContainer = document.getElementById('carouselDotsIndicatorRow');

    if (track && prevBtn && nextBtn && dotsContainer) {
        initializeHomeHeroCarouselEngine(track, prevBtn, nextBtn, dotsContainer);
    }

    // --- 3. DYNAMIC SERVICE ROUTER API COORD-SYNC ---
    const urlParams = new URLSearchParams(window.location.search);
    const serviceId = urlParams.get('id');
    if (serviceId) {
        fetchAndRenderServiceGallery(serviceId);
    }
});

function initializeHomeHeroCarouselEngine(track, prevBtn, nextBtn, dotsContainer) {
    const slides = Array.from(track.children);
    let activeIndex = 0;
    let rotationTimer = null;
    const ROTATION_INTERVAL_MS = 5000;

    slides.forEach((_, index) => {
        const dot = document.createElement('button');
        dot.className = `carousel-indicator-dot ${index === 0 ? 'is-active' : ''}`;
        dot.setAttribute('aria-label', `Slide direct index trigger node ${index + 1}`);
        dot.addEventListener('click', () => {
            jumpToTargetSlideIndex(index);
            restartAutoRotationTimer();
        });
        dotsContainer.appendChild(dot);
    });

    const dots = Array.from(dotsContainer.children);

    function jumpToTargetSlideIndex(targetIndex) {
        slides[activeIndex].classList.remove('is-active');
        if (dots.length > 0) dots[activeIndex].classList.remove('is-active');

        if (targetIndex >= slides.length) {
            activeIndex = 0;
        } else if (targetIndex < 0) {
            activeIndex = slides.length - 1;
        } else {
            activeIndex = targetIndex;
        }

        slides[activeIndex].classList.add('is-active');
        if (dots[activeIndex]) dots[activeIndex].classList.add('is-active');
    }

    nextBtn.addEventListener('click', () => {
        jumpToTargetSlideIndex(activeIndex + 1);
        restartAutoRotationTimer();
    });

    prevBtn.addEventListener('click', () => {
        jumpToTargetSlideIndex(activeIndex - 1);
        restartAutoRotationTimer();
    });

    function startAutoRotationTimer() {
        rotationTimer = setInterval(() => {
            jumpToTargetSlideIndex(activeIndex + 1);
        }, ROTATION_INTERVAL_MS);
    }

    function restartAutoRotationTimer() {
        clearInterval(rotationTimer);
        startAutoRotationTimer();
    }

    startAutoRotationTimer();
}

// ==========================================================================
// CORE API PORTFOLIO DATABASE REPOSITORIES INTERACTIVE ENGINES
// ==========================================================================

async function fetchAndRenderServiceGallery(serviceId) {
    const token = localStorage.getItem('artnest_token');
    // FIXED: ID updated seamlessly to match standardized template specs
    const galleryGrid = document.getElementById('runtimeActiveGalleryGrid');
    const premiumLockMessage = document.getElementById('premiumVaultLockMessage');
    
    if (!galleryGrid) return;

    if (!token && premiumLockMessage) {
        premiumLockMessage.style.display = 'block';
    } else if (premiumLockMessage) {
        premiumLockMessage.style.display = 'none';
    }

    try {
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const response = await fetch(`${API_BASE_URL}/assets/${serviceId}`, { credentials: 'include',headers });
        
        if (!response.ok) throw new Error("Database server unreachable or custom port disconnected.");
        const assets = await response.json();

        if (assets && assets.length > 0) {
            galleryGrid.innerHTML = ''; // Wipe fallback configurations cleanly if database entries exist
            assets.forEach(asset => {
                const card = document.createElement('div');
                card.className = 'gallery-card-item';
                
                let badgeMarkup = '';
                if (token) {
                    badgeMarkup = `<span class="visibility-status-tag" style="position: absolute; top: 10px; left: 10px; padding: 4px 8px; font-size: 11px; color: #FFF; font-weight: 600; border-radius: 2px; background:${asset.publicView ? '#5cb85c':'#d9534f'}">${asset.publicView ? 'Public':'Hidden'}</span>`;
                }

                card.innerHTML = `
                    <img src="${asset.src}" alt="Portfolio Project Design Image Node">
                    ${badgeMarkup}
                    <button class="delete-btn" style="position: absolute; top: 10px; right: 10px; border: none; background: rgba(217,83,79,0.9); color:#FFF; font-size:16px; width:26px; height:26px; border-radius:50%; cursor:pointer; line-height:24px; display: ${token ? 'block' : 'none'};" onclick="purgeAssetNode('${asset._id}', '${serviceId}')">&times;</button>
                `;
                galleryGrid.appendChild(card);
            });
        }
    } catch (err) {
        console.warn("API database fetch bypassed, running on mock service layers safely.", err);
    }
}

async function handleAssetUpload(event, serviceId) {
    const file = event.target.files[0];
    if (!file) return;

    const isPublic = document.getElementById('adminPermissionVisitorView').checked;
    const token = localStorage.getItem('artnest_token');

    const formData = new FormData();
    formData.append('photo', file);
    formData.append('serviceId', serviceId);
    formData.append('publicView', isPublic);

    try {
        const response = await fetch(`${API_BASE_URL}/assets/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'include',
            body: formData

        });

        if (response.ok) {
            window.location.reload(); // Refresh viewport safely to hydrate new additions
        } else {
            alert('Upload rejected by core security verification framework server.');
        }
    } catch (err) {
        console.error("Upload process error encountered:", err);
    }
}

async function purgeAssetNode(assetId, serviceId) {
    if (!confirm('Permanently remove this layout configuration from the portfolio database?')) return;
    const token = localStorage.getItem('artnest_token');

    try {
        const response = await fetch(`${API_BASE_URL}/assets/${assetId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            window.location.reload();
        } else {
            alert('Could not safely clean up selected image node asset item.');
        }
    } catch (err) {
        console.error("Deletion endpoint execution failure:", err);
    }
}

function togglePremiumForm() {
    const actionTrigger = document.getElementById('clickMoreActionTrigger');
    const expansionNode = document.getElementById('premiumFormExpansionNode');
    
    if (actionTrigger) actionTrigger.style.display = 'none';
    if (expansionNode) expansionNode.style.display = 'block';
}