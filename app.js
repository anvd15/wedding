/* ─── app.js ─── */

// ─── Floating Hearts ───────────────────────────────────────────────────────
const heartSymbols = ['❤️', '🩷', '💕', '💗', '💖', '💓', '♥', '🌸'];

function spawnHeart() {
  const container = document.getElementById('heartsContainer');
  const el = document.createElement('span');
  el.className = 'floating-heart';
  el.textContent = heartSymbols[Math.floor(Math.random() * heartSymbols.length)];

  const left = Math.random() * 100;
  const duration = 6 + Math.random() * 8;
  const delay = Math.random() * 2;
  const size = 0.9 + Math.random() * 1.4;

  el.style.cssText = `
    left: ${left}%;
    font-size: ${size}rem;
    animation-duration: ${duration}s;
    animation-delay: ${delay}s;
  `;

  container.appendChild(el);

  // Remove after animation
  setTimeout(() => el.remove(), (duration + delay) * 1000);
}

// Spawn hearts continuously
setInterval(spawnHeart, 700);
// Initial batch
for (let i = 0; i < 12; i++) spawnHeart();


// ─── Particle Canvas ──────────────────────────────────────────────────────
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');

let W, H, particles = [];

function resize() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

class Particle {
  constructor() { this.reset(); }

  reset() {
    this.x  = Math.random() * W;
    this.y  = Math.random() * H;
    this.r  = 0.6 + Math.random() * 1.6;
    this.vx = (Math.random() - 0.5) * 0.3;
    this.vy = -(0.15 + Math.random() * 0.35);
    this.alpha = 0;
    this.maxAlpha = 0.3 + Math.random() * 0.5;
    this.life  = 0;
    this.maxLife = 120 + Math.random() * 200;

    // Pinkish-gold palette
    const hue = [340, 350, 20, 330, 45][Math.floor(Math.random() * 5)];
    this.color = `hsl(${hue}, 85%, 75%)`;
  }

  update() {
    this.life++;
    const t = this.life / this.maxLife;
    this.alpha = t < 0.2
      ? (t / 0.2) * this.maxAlpha
      : t > 0.8
        ? ((1 - t) / 0.2) * this.maxAlpha
        : this.maxAlpha;

    this.x += this.vx;
    this.y += this.vy;

    if (this.life >= this.maxLife) this.reset();
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle   = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur  = 6;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Create particles
for (let i = 0; i < 120; i++) {
  const p = new Particle();
  p.life = Math.floor(Math.random() * p.maxLife); // stagger
  particles.push(p);
}

function animate() {
  ctx.clearRect(0, 0, W, H);
  particles.forEach(p => { p.update(); p.draw(); });
  requestAnimationFrame(animate);
}
animate();


// ─── Mouse parallax on content card ────────────────────────────────────────
const content = document.querySelector('.content');
const glowRing = document.querySelector('.glow-ring');

document.addEventListener('mousemove', (e) => {
  const cx = W / 2;
  const cy = H / 2;
  const dx = (e.clientX - cx) / cx;   // -1 to 1
  const dy = (e.clientY - cy) / cy;

  const tiltX =  dy * 8;  // degrees
  const tiltY = -dx * 8;

  content.style.transform  = `perspective(900px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
  glowRing.style.transform = `perspective(900px) rotateX(${tiltX * 0.5}deg) rotateY(${tiltY * 0.5}deg) scale(1.0)`;
});

document.addEventListener('mouseleave', () => {
  content.style.transform  = '';
  glowRing.style.transform = '';
});

// ─── Click to burst hearts ─────────────────────────────────────────────────
document.querySelector('.main-title').addEventListener('click', () => {
  for (let i = 0; i < 8; i++) spawnHeart();
});
