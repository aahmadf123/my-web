/* ========================================
   GAMIFICATION STATE
   ======================================== */
const state = {
  xp: 0,
  level: 1,
  xpToNext: 100,
  totalXp: 0,
  combo: 0,
  comboTimer: null,
  sectionsVisited: new Set(),
  achievements: [],
  skillLevels: {},
  clickCount: 0,
};

const ACHIEVEMENTS = {
  firstScroll: { title: 'First Steps', desc: 'You started scrolling!', unlocked: false },
  explorer: { title: 'Explorer', desc: 'Visited all sections', unlocked: false },
  clicker: { title: 'Click Master', desc: 'Clicked 10 interactive elements', unlocked: false },
  skillMaxer: { title: 'Skill Maxer', desc: 'Maxed out a skill to Lv. 5', unlocked: false },
  comboKing: { title: 'Combo King', desc: 'Reached a 5x combo!', unlocked: false },
  levelUp: { title: 'Level Up!', desc: 'Reached Level 2', unlocked: false },
};

/* ========================================
   DOM REFERENCES
   ======================================== */
const xpFill = document.getElementById('xp-fill');
const xpText = document.getElementById('xp-text');
const levelNum = document.getElementById('level-num');
const footerXp = document.getElementById('footer-xp');
const comboCounter = document.getElementById('combo-counter');
const comboNum = document.getElementById('combo-num');
const scrollProgress = document.getElementById('scroll-progress');
const navbar = document.getElementById('navbar');
const achievementToast = document.getElementById('achievement-toast');
const achievementTitle = document.getElementById('achievement-title');
const achievementDesc = document.getElementById('achievement-desc');
const cursorCanvas = document.getElementById('cursor-canvas');
const particleCanvas = document.getElementById('particle-canvas');
const cursorCtx = cursorCanvas.getContext('2d');
const particleCtx = particleCanvas.getContext('2d');

/* ========================================
   XP & LEVELING SYSTEM
   ======================================== */
function addXP(amount) {
  const comboMultiplier = 1 + state.combo * 0.1;
  const gained = Math.floor(amount * comboMultiplier);
  state.xp += gained;
  state.totalXp += gained;

  // Level up check
  while (state.xp >= state.xpToNext) {
    state.xp -= state.xpToNext;
    state.level++;
    state.xpToNext = Math.floor(state.xpToNext * 1.5);
    levelNum.textContent = state.level;
    levelNum.parentElement.style.animation = 'none';
    void levelNum.parentElement.offsetWidth;
    levelNum.parentElement.style.animation = 'badgePulse 0.5s ease 3';

    if (state.level === 2) unlockAchievement('levelUp');
  }

  // Update UI
  const pct = (state.xp / state.xpToNext) * 100;
  xpFill.style.width = pct + '%';
  xpText.textContent = `${state.xp} / ${state.xpToNext} XP`;
  footerXp.textContent = state.totalXp;
}

/* ========================================
   COMBO SYSTEM
   ======================================== */
function incrementCombo() {
  state.combo++;
  comboNum.textContent = state.combo;
  comboCounter.classList.remove('hidden');
  comboCounter.classList.add('show', 'bump');
  setTimeout(() => comboCounter.classList.remove('bump'), 300);

  if (state.combo >= 5) unlockAchievement('comboKing');

  clearTimeout(state.comboTimer);
  state.comboTimer = setTimeout(() => {
    state.combo = 0;
    comboCounter.classList.remove('show');
    comboCounter.classList.add('hidden');
  }, 3000);
}

/* ========================================
   ACHIEVEMENTS
   ======================================== */
function unlockAchievement(key) {
  if (ACHIEVEMENTS[key].unlocked) return;
  ACHIEVEMENTS[key].unlocked = true;
  state.achievements.push(key);

  achievementTitle.textContent = ACHIEVEMENTS[key].title;
  achievementDesc.textContent = ACHIEVEMENTS[key].desc;
  achievementToast.classList.remove('hidden');

  requestAnimationFrame(() => {
    achievementToast.classList.add('show');
  });

  setTimeout(() => {
    achievementToast.classList.remove('show');
    setTimeout(() => achievementToast.classList.add('hidden'), 500);
  }, 3500);

  addXP(50);
}

/* ========================================
   SCROLL HANDLING
   ======================================== */
let hasScrolled = false;

function handleScroll() {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const scrollPct = (scrollTop / docHeight) * 100;

  // Scroll progress bar
  scrollProgress.style.width = scrollPct + '%';

  // Navbar background
  navbar.classList.toggle('scrolled', scrollTop > 80);

  // First scroll achievement
  if (!hasScrolled && scrollTop > 50) {
    hasScrolled = true;
    unlockAchievement('firstScroll');
  }

  // Active nav link
  const sections = document.querySelectorAll('.section');
  sections.forEach((section) => {
    const rect = section.getBoundingClientRect();
    const id = section.id;

    if (rect.top < window.innerHeight * 0.5 && rect.bottom > window.innerHeight * 0.3) {
      document.querySelectorAll('.nav-links a').forEach((a) => a.classList.remove('active'));
      const activeLink = document.querySelector(`.nav-links a[data-section="${id}"]`);
      if (activeLink) activeLink.classList.add('active');

      // Section visit XP
      if (!state.sectionsVisited.has(id)) {
        state.sectionsVisited.add(id);
        const sectionXp = parseInt(section.dataset.xp) || 10;
        addXP(sectionXp);

        if (state.sectionsVisited.size === sections.length) {
          unlockAchievement('explorer');
        }
      }
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
   CLICKABLE ELEMENTS
   ======================================== */
document.querySelectorAll('.clickable-card').forEach((card) => {
  card.addEventListener('click', (e) => {
    state.clickCount++;
    incrementCombo();

    const xp = parseInt(card.dataset.xp) || 5;
    addXP(xp);

    // Float XP text
    const floater = document.createElement('div');
    floater.className = 'xp-float';
    floater.textContent = `+${xp} XP`;
    card.style.position = 'relative';
    card.appendChild(floater);
    setTimeout(() => floater.remove(), 1000);

    // Skill level-up
    if (card.dataset.skill) {
      const skill = card.dataset.skill;
      state.skillLevels[skill] = (state.skillLevels[skill] || 1) + 1;
      const lvSpan = card.querySelector('.skill-level span');
      if (lvSpan) {
        lvSpan.textContent = state.skillLevels[skill];
        card.classList.add('leveled-up');
      }
      if (state.skillLevels[skill] >= 5) {
        unlockAchievement('skillMaxer');
      }
    }

    if (state.clickCount >= 10) unlockAchievement('clicker');
  });
});

/* ========================================
   CONTACT FORM
   ======================================== */
document.getElementById('contact-form').addEventListener('submit', (e) => {
  e.preventDefault();
  addXP(25);
  incrementCombo();

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
  cursorCanvas.width = particleCanvas.width = window.innerWidth;
  cursorCanvas.height = particleCanvas.height = window.innerHeight;
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
   CURSOR TRAIL
   ======================================== */
const trail = [];
const TRAIL_LENGTH = 20;
let mouse = { x: 0, y: 0 };

function handleMouseMove(e) {
  mouse.x = e.clientX;
  mouse.y = e.clientY;

  trail.push({ x: e.clientX, y: e.clientY, life: 1 });
  if (trail.length > TRAIL_LENGTH) trail.shift();
}

function animateCursorTrail() {
  cursorCtx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);

  for (let i = 0; i < trail.length; i++) {
    const point = trail[i];
    point.life -= 0.03;

    if (point.life <= 0) continue;

    const size = point.life * 6;
    const alpha = point.life * 0.5;

    cursorCtx.beginPath();
    cursorCtx.arc(point.x, point.y, size, 0, Math.PI * 2);
    cursorCtx.fillStyle = `rgba(162, 155, 254, ${alpha})`;
    cursorCtx.fill();
  }

  // Remove dead points
  while (trail.length > 0 && trail[0].life <= 0) {
    trail.shift();
  }

  requestAnimationFrame(animateCursorTrail);
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
  animateCursorTrail();

  // Mark hero as visited immediately
  state.sectionsVisited.add('hero');

  // Trigger initial reveal check
  handleScroll();
}

window.addEventListener('resize', resizeCanvases);
window.addEventListener('scroll', () => {
  handleScroll();
  handleParallax();
}, { passive: true });
window.addEventListener('mousemove', handleMouseMove, { passive: true });

// Start
init();
