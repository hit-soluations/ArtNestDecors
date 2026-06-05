// gallery.js

// Function to load gallery images dynamically
function loadGallery(galleryId, images) {
  const galleryContainer = document.getElementById(galleryId);

  if (!galleryContainer) return;

  // Clear existing content
  galleryContainer.innerHTML = "";

  // Loop through images and create <img> elements
  images.forEach(src => {
    const img = document.createElement("img");
    img.src = src;
    img.alt = "Gallery Image";
    galleryContainer.appendChild(img);
  });
}

// Example usage for each service page
// Later, you can fetch these from a backend or database
document.addEventListener("DOMContentLoaded", () => {
  // Residential Painting Gallery
  if (document.getElementById("gallery-residential")) {
    loadGallery("gallery-residential", [
      "../uploads/sample1.jpg",
      "../uploads/sample2.jpg",
      "../uploads/sample3.jpg"
    ]);
  }

  // Interior Designs Gallery
  if (document.getElementById("gallery-interior")) {
    loadGallery("gallery-interior", [
      "../uploads/interior1.jpg",
      "../uploads/interior2.jpg",
      "../uploads/interior3.jpg"
    ]);
  }

  // Wall Art Gallery
  if (document.getElementById("gallery-wallart")) {
    loadGallery("gallery-wallart", [
      "../uploads/wallart1.jpg",
      "../uploads/wallart2.jpg",
      "../uploads/wallart3.jpg",
      "../uploads/wallart4.jpg"
    ]);
  }

  // Thermoplastic Gallery
  if (document.getElementById("gallery-thermoplastic")) {
    loadGallery("gallery-thermoplastic", [
      "../uploads/thermo1.jpg",
      "../uploads/thermo2.jpg",
      "../uploads/thermo3.jpg"
    ]);
  }

  // Sign Boards Gallery
  if (document.getElementById("gallery-signboards")) {
    loadGallery("gallery-signboards", [
      "../uploads/sign1.jpg",
      "../uploads/sign2.jpg",
      "../uploads/sign3.jpg"
    ]);
  }

  // Electrical Gallery
  if (document.getElementById("gallery-electrical")) {
    loadGallery("gallery-electrical", [
      "../uploads/electrical1.jpg",
      "../uploads/electrical2.jpg",
      "../uploads/electrical3.jpg"
    ]);
  }

  // Artifacts Gallery
  if (document.getElementById("gallery-artifacts")) {
    loadGallery("gallery-artifacts", [
      "../uploads/artifact1.jpg",
      "../uploads/artifact2.jpg",
      "../uploads/artifact3.jpg"
    ]);
  }

  // Events Gallery
  if (document.getElementById("gallery-events")) {
    loadGallery("gallery-events", [
      "../uploads/event1.jpg",
      "../uploads/event2.jpg",
      "../uploads/event3.jpg"
    ]);
  }
});
