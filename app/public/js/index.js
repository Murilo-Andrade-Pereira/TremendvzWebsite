const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function toMedievalText(value) {
  return String(value)
    .replace(/[U\u00DA\u00D9\u00DB\u00DC]/g, 'V')
    .replace(/[u\u00FA\u00F9\u00FB\u00FC]/g, 'v');
}

function applyMedievalLetters(root = document.body) {
  if (!root) {
    return;
  }

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;

      if (!node.nodeValue.trim() || !parent) {
        return NodeFilter.FILTER_REJECT;
      }

      if (parent.closest('script, style, noscript, input, textarea, select, option, [data-keep-text]')) {
        return NodeFilter.FILTER_REJECT;
      }

      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const textNodes = [];
  let currentNode = walker.nextNode();

  while (currentNode) {
    textNodes.push(currentNode);
    currentNode = walker.nextNode();
  }

  textNodes.forEach((node) => {
    node.nodeValue = toMedievalText(node.nodeValue);
  });
}

function setupScrollProgress() {
  const updateProgress = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    document.documentElement.style.setProperty('--scroll-progress', `${Math.min(progress, 100)}%`);
  };

  updateProgress();
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress);
}

function setupSparks() {
  const canvas = document.getElementById('sparks');

  if (!canvas || prefersReducedMotion) {
    return;
  }

  const ctx = canvas.getContext('2d');
  let width = 0;
  let height = 0;
  const particles = [];

  function resize() {
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.offsetWidth;
    height = canvas.offsetHeight;
    canvas.width = Math.floor(width * scale);
    canvas.height = Math.floor(height * scale);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
  }

  class Particle {
    constructor() {
      this.reset(true);
    }

    reset(randomizeY = false) {
      this.x = Math.random() * width;
      this.y = randomizeY ? Math.random() * height : height + 10;
      this.size = Math.random() * 1.6 + 0.45;
      this.speedY = -(Math.random() * 0.9 + 0.25);
      this.speedX = (Math.random() - 0.5) * 0.35;
      this.life = 1;
      this.decay = Math.random() * 0.005 + 0.003;
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      this.life -= this.decay;

      if (this.life <= 0 || this.y < -12 || this.x < -12 || this.x > width + 12) {
        this.reset();
      }
    }

    draw() {
      ctx.globalAlpha = this.life * 0.58;
      ctx.fillStyle = '#D7AE45';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    particles.forEach((particle) => {
      particle.update();
      particle.draw();
    });

    ctx.globalAlpha = 1;
    requestAnimationFrame(animate);
  }

  resize();
  window.addEventListener('resize', resize);

  for (let index = 0; index < 70; index += 1) {
    particles.push(new Particle());
  }

  animate();
}

function selectTrack(element) {
  document.querySelectorAll('.track').forEach((track) => track.classList.remove('active'));
  element.classList.add('active');

  const nowPlaying = document.getElementById('now-playing');
  const nowPlayingTitle = document.getElementById('now-playing-title');

  if (nowPlaying && nowPlayingTitle) {
    nowPlayingTitle.textContent = toMedievalText(element.dataset.track);
    nowPlaying.classList.add('visible');
  }
}

function handleTrackKey(event, element) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    selectTrack(element);
  }
}

function setupDiscography() {
  document.querySelectorAll('[data-discography-toggle]').forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const card = toggle.closest('.discography-card');
      const tracks = card ? card.querySelector('.release-tracks') : null;
      const isExpanded = toggle.getAttribute('aria-expanded') === 'true';

      toggle.setAttribute('aria-expanded', String(!isExpanded));

      if (tracks) {
        tracks.hidden = isExpanded;
      }
    });
  });
}

setupScrollProgress();
setupSparks();
setupDiscography();
applyMedievalLetters();

window.selectTrack = selectTrack;
window.handleTrackKey = handleTrackKey;
/* ═══════════════════════════════════════════════════
   TREMENDVZ — main.js
   Módulos: cursor · sparks · scroll · typewriter
            magnetic · nav · progress · IntersectionObserver
   ═══════════════════════════════════════════════════ */

'use strict';

const GOLD = { r: 215, g: 174, b: 69 };
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ────────────────────────────────────────
   1. CUSTOM CURSOR
   ──────────────────────────────────────── */
function initCursor() {
  if (prefersReducedMotion || window.innerWidth < 640) return;

  const cursor  = document.getElementById('cursor');
  const dot     = cursor?.querySelector('.cursor-dot');
  const ring    = cursor?.querySelector('.cursor-ring');
  if (!cursor || !dot || !ring) return;

  let mx = -100, my = -100;
  let rx = -100, ry = -100;
  let raf;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
  });

  document.addEventListener('mouseleave', () => {
    mx = my = -200;
  });

  function tick() {
    // Dot follows instantly
    dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;

    // Ring lags with lerp
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;

    raf = requestAnimationFrame(tick);
  }
  tick();
}


/* ────────────────────────────────────────
   2. SPARKS CANVAS
   ──────────────────────────────────────── */
function initSparks() {
  const canvas = document.getElementById('sparks');
  if (!canvas || prefersReducedMotion) return;

  const ctx = canvas.getContext('2d');
  let W, H, particles = [], raf;

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  function Particle() {
    this.reset();
  }

  Particle.prototype.reset = function() {
    this.x    = Math.random() * W;
    this.y    = H + 10;
    this.vy   = -(Math.random() * 0.6 + 0.2);
    this.vx   = (Math.random() - 0.5) * 0.3;
    this.size = Math.random() * 1.8 + 0.4;
    this.life = 0;
    this.maxLife = Math.random() * 240 + 120;
    this.alpha = 0;
  };

  Particle.prototype.update = function() {
    this.x += this.vx;
    this.y += this.vy;
    this.life++;
    const progress = this.life / this.maxLife;
    this.alpha = progress < 0.15
      ? progress / 0.15
      : progress > 0.7
        ? 1 - (progress - 0.7) / 0.3
        : 1;
    if (this.life >= this.maxLife || this.y < -10) this.reset();
  };

  Particle.prototype.draw = function() {
    ctx.save();
    ctx.globalAlpha = this.alpha * 0.45;
    ctx.fillStyle = `rgb(${GOLD.r},${GOLD.g},${GOLD.b})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  // Spawn spread across bottom
  const COUNT = 60;
  for (let i = 0; i < COUNT; i++) {
    const p = new Particle();
    p.y = Math.random() * H;
    p.life = Math.random() * p.maxLife;
    particles.push(p);
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    raf = requestAnimationFrame(loop);
  }
  loop();
}


/* ────────────────────────────────────────
   3. TYPEWRITER EFFECT
   ──────────────────────────────────────── */
function initTypewriter() {
  const el = document.querySelector('.typewriter');
  if (!el) return;

  const text   = el.dataset.text || '';
  const cursor = document.querySelector('.typewriter-cursor');
  let   i      = 0;

  if (prefersReducedMotion) {
    el.textContent = text;
    return;
  }

  function type() {
    if (i <= text.length) {
      el.textContent = text.slice(0, i);
      i++;
      setTimeout(type, i === 1 ? 900 : 55 + Math.random() * 30);
    } else {
      // Pause, then cursor stops blinking (text complete)
      if (cursor) cursor.style.opacity = '0.3';
    }
  }
  // Delay to sync with fade-up animation
  setTimeout(type, 900);
}


/* ────────────────────────────────────────
   4. SCROLL PROGRESS BAR
   ──────────────────────────────────────── */
function initScrollProgress() {
  const nav = document.getElementById('site-nav');
  const bar = document.getElementById('nav-progress');
  if (!nav || !bar) return;

  function update() {
    const scrollTop = window.scrollY;
    const docH      = document.documentElement.scrollHeight - window.innerHeight;
    const pct       = docH > 0 ? (scrollTop / docH) * 100 : 0;
    bar.style.setProperty('--progress', pct + '%');

    if (scrollTop > 20) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', update, { passive: true });
  update();
}


/* ────────────────────────────────────────
   5. ACTIVE NAV LINK (scroll spy)
   ──────────────────────────────────────── */
function initActiveNav() {
  // Simple: mark home active when at top
  const links = document.querySelectorAll('.nav-links a, .drawer-links a');
  const path  = window.location.pathname;

  links.forEach(link => {
    const href = link.getAttribute('href');
    if (href === path || (path === '/' && href === '/')) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });
}


/* ────────────────────────────────────────
   6. MOBILE NAV TOGGLE
   ──────────────────────────────────────── */
function initMobileNav() {
  const toggle = document.getElementById('nav-toggle');
  const drawer = document.getElementById('nav-drawer');
  if (!toggle || !drawer) return;

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    drawer.setAttribute('aria-hidden', String(expanded));
  });

  // Close on link click
  drawer.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      toggle.setAttribute('aria-expanded', 'false');
      drawer.setAttribute('aria-hidden', 'true');
    });
  });

  // Close on outside click
  document.addEventListener('click', e => {
    if (!toggle.contains(e.target) && !drawer.contains(e.target)) {
      toggle.setAttribute('aria-expanded', 'false');
      drawer.setAttribute('aria-hidden', 'true');
    }
  });
}


/* ────────────────────────────────────────
   7. INTERSECTION OBSERVER — REVEAL
   ──────────────────────────────────────── */
function initReveal() {
  const targets = document.querySelectorAll('.reveal-up, .reveal-scale');
  if (!targets.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  targets.forEach(el => observer.observe(el));
}


/* ────────────────────────────────────────
   8. MAGNETIC BUTTONS
   ──────────────────────────────────────── */
function initMagnetic() {
  if (prefersReducedMotion || window.innerWidth < 640) return;

  document.querySelectorAll('[data-magnetic]').forEach(btn => {
    const STRENGTH = 0.3;

    btn.addEventListener('mousemove', e => {
      const rect = btn.getBoundingClientRect();
      const cx   = rect.left + rect.width / 2;
      const cy   = rect.top  + rect.height / 2;
      const dx   = (e.clientX - cx) * STRENGTH;
      const dy   = (e.clientY - cy) * STRENGTH;
      btn.style.transform = `translate(${dx}px, ${dy}px)`;
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
}


/* ────────────────────────────────────────
   9. CARD HOVER — spotlight glow
   ──────────────────────────────────────── */
function initCardSpotlight() {
  if (prefersReducedMotion) return;

  document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x    = e.clientX - rect.left;
      const y    = e.clientY - rect.top;
      card.style.setProperty('--mx', x + 'px');
      card.style.setProperty('--my', y + 'px');
    });
  });
}


/* ────────────────────────────────────────
   INIT
   ──────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initCursor();
  initSparks();
  initTypewriter();
  initScrollProgress();
  initActiveNav();
  initMobileNav();
  initReveal();
  initMagnetic();
  initCardSpotlight();
});