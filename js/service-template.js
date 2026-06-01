// ==========================================================================
// CENTRALIZED SERVICE REGISTRY DATABASE, GALLERY CACHE & HYDRATION PIPELINE
// ==========================================================================

const serviceRegistry = {
    painting: { 
        title: "Painting Services & Coatings", 
        category: "Interior & Finishes", 
        image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80", 
        desc: "Our industrial coatings and interior architectural finishes division provides precision texture treatments, environment-grade premium paints, and specialized multi-surface coatings tailored for luxury residences.",
        galleryImages: [
            "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=500&q=80",
            "https://images.unsplash.com/photo-1574359411659-15573a27f812?auto=format&fit=crop&w=500&q=80",
            "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=500&q=80"
        ]
    },
    interior: { 
        title: "Architectural Interior Designs", 
        category: "Interior & Finishes", 
        image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=600&q=80", 
        desc: "Complete layout transformations utilizing complex lighting workflows, customized spatial geometry scaling, ergonomics engineering, and choice materiality procurement parameters.",
        galleryImages: [
            "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=500&q=80",
            "https://images.unsplash.com/photo-1616486038855-31322a7f1126?auto=format&fit=crop&w=500&q=80",
            "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=500&q=80"
        ]
    },
    murals: { 
        title: "Hand-Crafted Wall Art & Murals", 
        category: "Interior & Finishes", 
        image: "https://images.unsplash.com/photo-1579783928621-7a13d66a62d1?auto=format&fit=crop&w=600&q=80", 
        desc: "Bespoke high-fidelity fine art paintings, custom dimension accent wall relief panels, and expressive murals drafted exclusively inside the studio to convert walls into signature canvas structural frameworks.",
        galleryImages: [
            "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=500&q=80",
            "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=500&q=80"
        ]
    },
    signage: { 
        title: "Thermoplastic & Epoxy Signs", 
        category: "Interior & Finishes", 
        image: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=600&q=80", 
        desc: "High-end liquid resin applications, metallic floor patterns, crystal clear protective overlays, and specialized luminous signage components fabricated using ultra-durable precision chemical engineering.",
        galleryImages: [
            "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=500&q=80"
        ]
    },
    commercial: { 
        title: "Commercial Sign Boards", 
        category: "Production & Structural", 
        image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80", 
        desc: "Scale brand sign architectures utilizing architectural metal grids, smart embedded illumination frameworks, custom typography panels, and exterior elements built to weather ambient conditions.",
        galleryImages: [
            "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=500&q=80"
        ]
    },
    automation: { 
        title: "Electrical Automation & Wiring", 
        category: "Production & Structural", 
        image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80", 
        desc: "High-grade automation nodes integration, invisible wiring infrastructures, custom panel arrangements, and smart home relay logic layouts built explicitly for unified control configurations.",
        galleryImages: []
    },
    waterfeatures: { 
        title: "Artificial Rocks Waterfalls", 
        category: "Production & Structural", 
        image: "https://images.unsplash.com/photo-1558449028-b53a39d100fc?auto=format&fit=crop&w=600&q=80", 
        desc: "Precision hydro-engineering structural nodes connecting custom carved stone assemblies, closed-loop living natural waterfall matrices, and exotic artifact installation accents to create serene spaces.",
        galleryImages: [
            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=500&q=80"
        ]
    },
    thematic: { 
        title: "Thematic Event Properties", 
        category: "Production & Structural", 
        image: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=600&q=80", 
        desc: "High-fidelity ephemeral set modeling, temporary premium interior installations, mechanical prop builds, and thematic display layout modules engineered for fast-deployment exhibition structures.",
        galleryImages: []
    }
};

let currentServiceId = null;
let isAdminSession = false;
let csrfToken = null;

// Standardized listener hook replacement over old window.onload block
document.addEventListener("DOMContentLoaded", () => {
    initializeServicePageHydration();
    setupDropdownDirectoryInterceptors();
    initializeServiceItems();
});

function initializeServicePageHydration() {
    const urlParams = new URLSearchParams(window.location.search);
    const currentId = urlParams.get('id');
    currentServiceId = currentId;

    if (!currentId || !serviceRegistry[currentId]) {
        const workspace = document.getElementById('contentWorkspace');
        const errorView = document.getElementById('errorScreen');
        if (workspace) workspace.style.display = 'none';
        if (errorView) errorView.style.display = 'block';
        return;
    }

    const activeData = serviceRegistry[currentId];
    const heroImg = document.getElementById('serviceHeroImage');
    const categorySpan = document.getElementById('serviceCategory');
    const titleHeader = document.getElementById('serviceTitle');
    const descPara = document.getElementById('serviceDescription');

    if (heroImg) { heroImg.src = activeData.image; heroImg.alt = activeData.title; }
    if (categorySpan) categorySpan.innerText = activeData.category;
    if (titleHeader) titleHeader.innerText = activeData.title;
    if (descPara) descPara.innerText = activeData.desc;
    document.title = `${activeData.title} | ArtNestDecors`;
}

function initializeServiceItems() {
    const adminNode = document.getElementById('premiumFormExpansionNode');
    const lockMessage = document.getElementById('premiumVaultLockMessage');

    if (adminNode) adminNode.style.display = 'none';
    if (lockMessage) lockMessage.style.display = 'none';

    loadServiceItems(currentServiceId)
        .then(() => {
            if (!localStorage.getItem('artnest_token')) {
                throw new Error('No admin token available.');
            }
            return fetch('/api/csrf-token');
        })
        .then(async (res) => {
            if (!res.ok) throw new Error('Not authenticated.');
            const data = await res.json();
            csrfToken = data.csrfToken;
            isAdminSession = true;
            if (adminNode) adminNode.style.display = 'block';
            if (lockMessage) lockMessage.style.display = 'none';
            if (currentServiceId) {
                await loadServiceItems(currentServiceId);
            }
        })
        .catch(() => {
            if (lockMessage) lockMessage.style.display = 'block';
        });
}

async function loadServiceItems(serviceId) {
    const galleryGrid = document.getElementById('runtimeActiveGalleryGrid');
    const headingNode = document.getElementById('gallerySectionHeading');
    const lockMessage = document.getElementById('premiumVaultLockMessage');

    if (!galleryGrid || !serviceId) return [];

    galleryGrid.innerHTML = '';
    if (headingNode) headingNode.innerText = `${serviceRegistry[serviceId].title} - Project Portfolio Gallery`;

    try {
        const response = await fetch(`/api/items/${serviceId}`);
        if (!response.ok) throw new Error('Failed to load service items');
        const items = await response.json();

        if (items.length > 0) {
            renderServiceItems(items, serviceRegistry[serviceId].title);
            if (lockMessage) lockMessage.style.display = 'none';
            return items;
        }

        if (lockMessage && !isAdminSession) {
            lockMessage.style.display = 'block';
        }
    } catch (err) {
        console.warn('Service item fetch failed:', err);
    }

    const activeData = serviceRegistry[serviceId];
    renderFallbackMockGalleryGrid(activeData.galleryImages, activeData.title);
    return [];
}

async function fetchAndRenderServiceGallery(serviceId) {
    return loadServiceItems(serviceId);
}

function renderServiceItems(items, serviceTitle) {
    const targetGridNode = document.getElementById('runtimeActiveGalleryGrid');
    if (!targetGridNode) return;

    targetGridNode.innerHTML = items.map(item => {
        const adminControls = isAdminSession ? `\n            <button class="gallery-delete-btn" onclick="removeServiceItem(${item.id})">Remove</button>\n        ` : '';

        return `
            <div class="gallery-card-item">
                <img src="${item.image_path}" alt="${serviceTitle} Portfolio Item">
                ${adminControls}
            </div>
        `;
    }).join('');
}

function renderFallbackMockGalleryGrid(imagesArray, serviceTitle) {
    const headingNode = document.getElementById('gallerySectionHeading');
    const targetGridNode = document.getElementById('runtimeActiveGalleryGrid');

    if (!targetGridNode) return;
    if (headingNode) headingNode.innerText = `${serviceTitle} - Project Portfolio Gallery`;

    if (!imagesArray || imagesArray.length === 0) {
        targetGridNode.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 40px 0; font-style: italic;">No showcase photos have been uploaded to this production division yet.</p>`;
        return;
    }

    imagesArray.forEach((imageUrl) => {
        const structuralCard = document.createElement('div');
        structuralCard.className = 'gallery-card-item';
        structuralCard.innerHTML = `<img src="${imageUrl}" alt="${serviceTitle} Finished Architecture Element Preview">`;
        targetGridNode.appendChild(structuralCard);
    });
}

async function handleAssetUpload(event, serviceId) {
    const file = event.target.files[0];
    const statusNode = document.getElementById('assetUploadMessage');

    if (!file || !serviceId) {
        if (statusNode) statusNode.textContent = 'No file selected or no service chosen.';
        return;
    }

    if (!isAdminSession || !csrfToken) {
        if (statusNode) statusNode.textContent = 'Login required to upload assets.';
        return;
    }

    const formData = new FormData();
    formData.append('image', file);
    formData.append('service', serviceId);
    formData.append('_csrf', csrfToken);
    formData.append('publicView', document.getElementById('adminPermissionVisitorView')?.checked ? 'true' : 'false');

    try {
        const response = await fetch('/api/items/upload', {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Upload failed.');
        }

        if (statusNode) {
            statusNode.textContent = 'Image uploaded successfully.';
            statusNode.style.color = '#2b7a0b';
        }
        event.target.value = '';
        await loadServiceItems(serviceId);
    } catch (err) {
        if (statusNode) {
            statusNode.textContent = err.message || 'Upload failed.';
            statusNode.style.color = '#c0392b';
        }
        console.error('Failed to upload item:', err);
    }
}

async function removeServiceItem(itemId) {
    if (!confirm('Are you sure you want to remove this image from the gallery?')) return;
    if (!csrfToken) return;

    try {
        const response = await fetch(`/api/items/${itemId}`, {
            method: 'DELETE',
            headers: {
                'X-CSRF-Token': csrfToken
            }
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Delete failed.');
        }

        await loadServiceItems(currentServiceId);
    } catch (err) {
        alert(err.message || 'Unable to delete item.');
        console.error('Remove item error:', err);
    }
}

function setupDropdownDirectoryInterceptors() {
    document.querySelectorAll('.dropdown-menu a').forEach(link => {
        link.addEventListener('click', function(e) {
            const targetUrl = this.getAttribute('href');
            if (!targetUrl || !targetUrl.includes('?id=')) return;

            e.preventDefault();
            const serviceId = new URLSearchParams(targetUrl.substring(targetUrl.indexOf('?'))).get('id');
            if (window.location.pathname.includes('/services/')) {
                window.location.search = `?id=${serviceId}`;
            } else {
                window.location.href = `services/service-template.html?id=${serviceId}`;
            }
        });
    });
}
