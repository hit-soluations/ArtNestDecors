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
        title: "Artifacts, Rocks & Waterfalls", 
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

// Standardized listener hook replacement over old window.onload block
document.addEventListener("DOMContentLoaded", () => {
    initializeServicePageHydration();
    setupDropdownDirectoryInterceptors();
});

function initializeServicePageHydration() {
    const urlParams = new URLSearchParams(window.location.search);
    const currentId = urlParams.get('id');

    if (!currentId || !serviceRegistry[currentId]) {
        const workspace = document.getElementById('contentWorkspace');
        const errorView = document.getElementById('errorScreen');
        if (workspace) workspace.style.display = 'none';
        if (errorView) errorView.style.display = 'block';
        return;
    }

    const activeData = serviceRegistry[currentId];
    
    // Smoothly hydrate basic text elements down onto DOM target containers
    const heroImg = document.getElementById('serviceHeroImage');
    const categorySpan = document.getElementById('serviceCategory');
    const titleHeader = document.getElementById('serviceTitle');
    const descPara = document.getElementById('serviceDescription');

    if (heroImg) { heroImg.src = activeData.image; heroImg.alt = activeData.title; }
    if (categorySpan) categorySpan.innerText = activeData.category;
    if (titleHeader) titleHeader.innerText = activeData.title;
    if (descPara) descPara.innerText = activeData.desc;
    
    document.title = `${activeData.title} | ArtNestDecors`;

    // Checks local registry cache arrays if database profiles are missing
    renderFallbackMockGalleryGrid(activeData.galleryImages, activeData.title);
}

function renderFallbackMockGalleryGrid(imagesArray, serviceTitle) {
    const headingNode = document.getElementById('gallerySectionHeading');
    // FIXED: Element ID targeted accurately to match main.js runtime specifications
    const targetGridNode = document.getElementById('runtimeActiveGalleryGrid');
    
    if (!targetGridNode) return;
    if (headingNode) headingNode.innerText = `${serviceTitle} - Project Portfolio Gallery`;
    
    // Only hydrate mock static arrays if your live API database is empty/disconnected
    if (targetGridNode.children.length === 0) {
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
}

function setupDropdownDirectoryInterceptors() {
    document.querySelectorAll('.dropdown-menu a').forEach(link => {
        link.addEventListener('click', function(e) {
            const targetUrl = this.getAttribute('href');
            
            // Fixed relative directory stacking links when clicked inside subfolder layers
            if (window.location.pathname.includes('/services/')) {
                e.preventDefault();
                const cleanQuery = targetUrl.substring(targetUrl.indexOf('?'));
                window.location.search = cleanQuery; // Updates query parameter directly without duplicating folders
            }
        });
    });
}

window.addEventListener('popstate', () => {
    window.location.reload();
});

function setupDropdownDirectoryInterceptors() {
    document.querySelectorAll('.dropdown-menu a').forEach(link => {
        link.addEventListener('click', function(e) {
            const targetUrl = this.getAttribute('href');
            
            // Check if the link contains a service query string parameter
            if (targetUrl.includes('?id=')) {
                e.preventDefault();
                const serviceId = new URLSearchParams(targetUrl.substring(targetUrl.indexOf('?'))).get('id');
                
                // If we are currently inside the services subfolder, reload using the direct query parameter
                if (window.location.pathname.includes('/services/')) {
                    window.location.search = `?id=${serviceId}`;
                } else {
                    // If we are on the root pages (index.html or about.html), path route cleanly down
                    window.location.href = `services/service-template.html?id=${serviceId}`;
                }
            }
        });
    });
}