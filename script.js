/* ========================================
   DOM REFERENCES
   ======================================== */
const scrollProgress = document.getElementById('scroll-progress');
const navbar = document.getElementById('navbar');
const particleCanvas = document.getElementById('particle-canvas');
const particleCtx = particleCanvas.getContext('2d');

/* ========================================
   SCROLL HANDLING
   ======================================== */
function handleScroll() {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const scrollPct = (scrollTop / docHeight) * 100;

  // Scroll progress bar
  scrollProgress.style.width = scrollPct + '%';

  // Navbar background
  navbar.classList.toggle('scrolled', scrollTop > 80);

  // Active nav link
  const sections = document.querySelectorAll('.section');
  sections.forEach((section) => {
    const rect = section.getBoundingClientRect();
    const id = section.id;

    if (rect.top < window.innerHeight * 0.5 && rect.bottom > window.innerHeight * 0.3) {
      document.querySelectorAll('.nav-links a').forEach((a) => a.classList.remove('active'));
      const activeLink = document.querySelector(`.nav-links a[data-section="${id}"]`);
      if (activeLink) activeLink.classList.add('active');
    }
  });

  // Reveal animations
  document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right').forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.85) {
      el.classList.add('revealed');
    }
  });

  // Skill bars fill on scroll
  document.querySelectorAll('.skill-fill').forEach((fill) => {
    const rect = fill.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.9) {
      fill.style.width = fill.dataset.level + '%';
    }
  });

  // Counter animation
  document.querySelectorAll('.counter').forEach((counter) => {
    const rect = counter.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.9 && !counter.dataset.counted) {
      counter.dataset.counted = 'true';
      animateCounter(counter);
    }
  });
}

/* ========================================
   COUNTER ANIMATION
   ======================================== */
function animateCounter(el) {
  const target = parseInt(el.dataset.target);
  const duration = 2000;
  const start = performance.now();

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(target * eased);
    if (progress < 1) requestAnimationFrame(update);
    else el.textContent = target + '+';
  }

  requestAnimationFrame(update);
}

/* ========================================
   CONTACT FORM
   ======================================== */
document.getElementById('contact-form').addEventListener('submit', (e) => {
  e.preventDefault();

  const btn = e.target.querySelector('.submit-btn span:first-child');
  btn.textContent = 'Message Sent!';
  setTimeout(() => {
    btn.textContent = 'Send Message';
    e.target.reset();
  }, 2000);
});

/* ========================================
   PARTICLE BACKGROUND
   ======================================== */
const particles = [];
const PARTICLE_COUNT = 60;

function resizeCanvases() {
  particleCanvas.width = window.innerWidth;
  particleCanvas.height = window.innerHeight;
}

class Particle {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = Math.random() * particleCanvas.width;
    this.y = Math.random() * particleCanvas.height;
    this.size = Math.random() * 2 + 0.5;
    this.speedX = (Math.random() - 0.5) * 0.4;
    this.speedY = (Math.random() - 0.5) * 0.4;
    this.opacity = Math.random() * 0.4 + 0.1;
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;

    if (this.x < 0 || this.x > particleCanvas.width) this.speedX *= -1;
    if (this.y < 0 || this.y > particleCanvas.height) this.speedY *= -1;
  }

  draw() {
    particleCtx.beginPath();
    particleCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    particleCtx.fillStyle = `rgba(108, 92, 231, ${this.opacity})`;
    particleCtx.fill();
  }
}

function initParticles() {
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(new Particle());
  }
}

function drawParticleConnections() {
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 120) {
        particleCtx.beginPath();
        particleCtx.moveTo(particles[i].x, particles[i].y);
        particleCtx.lineTo(particles[j].x, particles[j].y);
        particleCtx.strokeStyle = `rgba(108, 92, 231, ${0.08 * (1 - dist / 120)})`;
        particleCtx.lineWidth = 0.5;
        particleCtx.stroke();
      }
    }
  }
}

function animateParticles() {
  particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);

  particles.forEach((p) => {
    p.update();
    p.draw();
  });

  drawParticleConnections();
  requestAnimationFrame(animateParticles);
}

/* ========================================
   SMOOTH SCROLL FOR NAV LINKS
   ======================================== */
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

/* ========================================
   PARALLAX ON HERO SHAPES
   ======================================== */
function handleParallax() {
  const scrolled = window.scrollY;
  document.querySelectorAll('.shape').forEach((shape, i) => {
    const speed = 0.1 + i * 0.05;
    shape.style.transform = `translateY(${scrolled * speed}px)`;
  });
}

/* ========================================
   INITIALIZATION
   ======================================== */
function init() {
  resizeCanvases();
  initParticles();
  animateParticles();

  // Trigger initial reveal check
  handleScroll();
}

window.addEventListener('resize', resizeCanvases);
window.addEventListener('scroll', () => {
  handleScroll();
  handleParallax();
}, { passive: true });

// Start
init();
