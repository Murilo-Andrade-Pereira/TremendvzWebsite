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
