# ArtNestDecors Website

A professional portfolio website for **ArtNestDecors**, showcasing services such as painting, interior design, wall art, sign boards, electrical automation, artifacts, and event properties.

---

## 🌐 Project Structure

ArtNestDecors/
│
├── index.html              # Home Page
├── about.html              # About Us Page
├── contact.html            # Contact Page
├── login.html              # Admin/User Login Page
│
├── services/               # Service Pages
│   ├── residential.html
│   ├── interior.html
│   ├── wallart.html
│   ├── thermoplastic.html
│   ├── signboards.html
│   ├── electrical.html
│   ├── artifacts.html
│   └── events.html
│
├── css/
│   └── style.css           # Global theme (cool & calm colors)
│
├── js/
│   ├── main.js             # Navigation, contact form, site interactions
│   ├── login.js            # Admin/User login handling (hashed later)
│   └── gallery.js          # Dynamic gallery loader
│
└── uploads/                # Admin-uploaded images for galleries


---

## 🎨 Theme

- **Cool & Calm Colors**: Gradient header, soft blue hero sections, clean typography.
- **Consistent Layout**: Left image, right description, gallery below for services.
- **Responsive Design**: Works across desktop and mobile.

---

## 🔑 Features

- **Admin Login**: Upload photos (future backend integration).
- **User Login**: View galleries only.
- **Dynamic Galleries**: Images loaded from `/uploads/` via `gallery.js`.
- **Contact Form**: Captures inquiries (backend integration pending).
- **Navigation Highlight**: Active page auto-highlight via `main.js`.

---

## 📋 Pending Work

- **Images**:
  - Replace placeholder images (`residential.jpg`, `interior.jpg`, etc.) in `/images/`.
  - Upload real project photos into `/uploads/` for galleries.
  - Update `gallery.js` arrays with actual filenames.

- **Backend Integration**:
  - Secure login with **bcrypt hashing** (Node.js, PHP, or Firebase).
  - Contact form submission (email service or database).
  - Admin dashboard for image uploads.

- **Enhancements**:
  - Add “Get in Touch” button on Home Page hero linking to `contact.html`.
  - Add “Contact Us” links under each service description.
  - Optimize images for faster loading.
  - Add favicon and meta tags for SEO.

---

## 🚀 Getting Started

1. Clone or download the project.
2. Open `index.html` in a browser.
3. Navigate through pages using the header menu.
4. Add images to `/uploads/` and update `gallery.js` to see them live.

---

## 📌 Notes

- All credentials must be hashed and verified on the backend (never stored in plain text).
- This repo currently contains **frontend only**. Backend integration is pending.


What Changed
Hero Section: Added a “Get in Touch” button linking directly to contact.html.

Service Blocks: Each now has a Contact Us link alongside “Learn More.”

Consistency: Visitors can reach the Contact page from anywhere without hunting.



📋 Pending Work (from README + updates)
Replace placeholder images (residential.jpg, interior.jpg, etc.) in /images/.

Upload real project photos into /uploads/ for galleries.

Update gallery.js arrays with actual filenames.

Backend integration for login (bcrypt hashing) and contact form submission.

Admin dashboard for image uploads.

SEO polish: favicon, meta tags, optimized images.