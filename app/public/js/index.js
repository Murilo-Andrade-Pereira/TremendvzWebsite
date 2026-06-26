// Efeito de partículas no Canvas
const canvas = document.getElementById('sparks');
const ctx = canvas.getContext('2d');
let W, H, particles = [];

function resize() {
  W = canvas.width = canvas.offsetWidth;
  H = canvas.height = canvas.offsetHeight;
}

resize();
window.addEventListener('resize', resize);

class Particle {
  constructor() {
    this.reset();
  }
  
  reset() {
    this.x = Math.random() * W;
    this.y = H + 10;
    this.size = Math.random() * 2 + 0.5;
    this.speedY = -(Math.random() * 1.5 + 0.5);
    this.speedX = (Math.random() - 0.5) * 0.8;
    this.life = 1;
    this.decay = Math.random() * 0.008 + 0.003;
    this.hue = Math.random() > 0.5 ? '#C9A84C' : '#8B1A1A';
  }
  
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.speedX += (Math.random() - 0.5) * 0.05;
    this.life -= this.decay;
    if (this.life <= 0 || this.y < -10) this.reset();
  }
  
  draw() {
    ctx.globalAlpha = this.life * 0.7;
    ctx.fillStyle = this.hue;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

for (let i = 0; i < 120; i++) {
  particles.push(new Particle());
}

function animate() {
  ctx.clearRect(0, 0, W, H);
  particles.forEach(p => {
    p.update();
    p.draw();
  });
  ctx.globalAlpha = 1;
  requestAnimationFrame(animate);
}

animate();

// Controle da Tracklist
function selectTrack(el) {
  document.querySelectorAll('.track').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  const title = el.dataset.track;
  document.getElementById('now-playing-title').textContent = title;
  document.getElementById('now-playing').classList.add('visible');
}