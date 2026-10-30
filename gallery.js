/* ═══════════════════════════════════════════════
   gallery.js — Photo slideshow logic
═══════════════════════════════════════════════ */

const PHOTOS = [
  "DSC_1220.jpg",
  "DSC_1246.jpg",
  "DSC_1332.jpg",
  "DSC_1415.jpg",
  "DSC_1552.jpg",
  "DSC_1677.jpg",
  "DSC_1738.jpg",
  "DSC_1924.jpg",
  "DSC_2119.jpg",
  "DSC_2268.jpg"
].map(f => `19%20ch%E1%BB%A5p%20thuy%20-an/resized/${f}`);

// ── Elements ────────────────────────────────────
const grid       = document.getElementById('galleryGrid');
const lightbox   = document.getElementById('lightbox');
const lbImg      = document.getElementById('lbImg');
const lbLoader   = document.getElementById('lbLoader');
const lbCaption  = document.getElementById('lbCaption');
const lbCounter  = document.getElementById('lbCounter');
const lbStrip    = document.getElementById('lbStrip');
const lbClose    = document.getElementById('lbClose');
const lbPrev     = document.getElementById('lbPrev');
const lbNext     = document.getElementById('lbNext');
const photoCount = document.getElementById('photoCount');

photoCount.textContent = PHOTOS.length;

let current = 0;
let isAnimating = false;

// ── Build Grid ───────────────────────────────────
PHOTOS.forEach((src, i) => {
  const card = document.createElement('div');
  card.className = 'grid-card';
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', `Xem ảnh ${i + 1}`);

  const img = document.createElement('img');
  img.className = 'card-img';
  img.src = src;
  img.alt = `Ảnh ${i + 1}`;
  img.loading = 'lazy';
  img.decoding = 'async';

  const overlay = document.createElement('div');
  overlay.className = 'card-overlay';

  const zoom = document.createElement('div');
  zoom.className = 'zoom-icon';
  zoom.textContent = '⤢';

  const num = document.createElement('span');
  num.className = 'card-num';
  num.textContent = `${i + 1} / ${PHOTOS.length}`;

  card.appendChild(img);
  card.appendChild(overlay);
  card.appendChild(zoom);
  card.appendChild(num);

  card.addEventListener('click', () => openLightbox(i));
  card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openLightbox(i); });

  grid.appendChild(card);
});

// ── Build Thumbnail Strip ─────────────────────────
PHOTOS.forEach((src, i) => {
  const thumb = document.createElement('img');
  thumb.className = 'lb-thumb';
  thumb.src = src;
  thumb.alt = `Ảnh ${i + 1}`;
  thumb.loading = 'lazy';
  thumb.addEventListener('click', () => goTo(i));
  lbStrip.appendChild(thumb);
});

// ── Intersection Observer (stagger entrance) ──────
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, idx) => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const i = parseInt(el.dataset.index, 10);
      setTimeout(() => el.classList.add('visible'), i * 55);
      observer.unobserve(el);
    }
  });
}, { threshold: 0.05 });

document.querySelectorAll('.grid-card').forEach((card, i) => {
  card.dataset.index = i;
  observer.observe(card);
});

// ── Lightbox Core ────────────────────────────────
function openLightbox(index) {
  current = index;
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
  loadImage(current, null);
  updateUI();

  // Add keyboard hint if not present
  if (!lightbox.querySelector('.kb-hint')) {
    const hint = document.createElement('p');
    hint.className = 'kb-hint';
    hint.textContent = '← → arrow keys · Esc to close';
    lightbox.appendChild(hint);
  }
}

function closeLightbox() {
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
}

function loadImage(index, direction) {
  // Show loader
  lbLoader.classList.add('active');
  lbImg.classList.remove('loaded', 'slide-enter-right', 'slide-enter-left');

  const newSrc = PHOTOS[index];

  const tempImg = new Image();
  tempImg.onload = () => {
    lbImg.src = newSrc;
    lbLoader.classList.remove('active');
    lbImg.classList.add('loaded');
    if (direction === 'next') {
      lbImg.classList.add('slide-enter-right');
    } else if (direction === 'prev') {
      lbImg.classList.add('slide-enter-left');
    }
    isAnimating = false;
  };
  tempImg.onerror = () => {
    lbLoader.classList.remove('active');
    isAnimating = false;
  };
  tempImg.src = newSrc;
}

function updateUI() {
  // Caption & counter
  lbCaption.textContent  = `Ảnh ${current + 1}`;
  lbCounter.textContent  = `${current + 1} / ${PHOTOS.length}`;

  // Thumbnails active state
  const thumbs = lbStrip.querySelectorAll('.lb-thumb');
  thumbs.forEach((t, i) => t.classList.toggle('active', i === current));

  // Scroll active thumb into view
  const activeThumb = lbStrip.children[current];
  if (activeThumb) {
    activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }
}

function goTo(index, direction) {
  if (isAnimating) return;
  isAnimating = true;
  current = ((index % PHOTOS.length) + PHOTOS.length) % PHOTOS.length;
  loadImage(current, direction);
  updateUI();
}

function goNext() { goTo(current + 1, 'next'); }
function goPrev() { goTo(current - 1, 'prev'); }

// ── Events ───────────────────────────────────────
lbClose.addEventListener('click', closeLightbox);
lbNext.addEventListener('click', goNext);
lbPrev.addEventListener('click', goPrev);

// Click backdrop to close
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});

// Keyboard
document.addEventListener('keydown', (e) => {
  if (!lightbox.classList.contains('open')) return;
  switch (e.key) {
    case 'ArrowRight': case 'ArrowDown': goNext(); break;
    case 'ArrowLeft':  case 'ArrowUp':   goPrev(); break;
    case 'Escape': closeLightbox(); break;
  }
});

// Touch / swipe support
let touchStartX = 0;
lightbox.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
lightbox.addEventListener('touchend',   (e) => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) > 50) dx < 0 ? goNext() : goPrev();
});

// Mouse-wheel to navigate
lightbox.addEventListener('wheel', (e) => {
  e.preventDefault();
  e.deltaY > 0 ? goNext() : goPrev();
}, { passive: false });
