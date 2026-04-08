/* ============================================================
   Seungbeom Seo — Homepage Interactive Scripts
   Neural particle system, cursor effects, scroll animations
   ============================================================ */

(function () {
  'use strict';

  // ── Particle System (Neural Network Background) ──────────────
  const canvas = document.getElementById('particle-canvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let mouse = { x: -1000, y: -1000 };
  let animFrame;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  class Particle {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 2 + 0.5;
      this.speedX = (Math.random() - 0.5) * 0.4;
      this.speedY = (Math.random() - 0.5) * 0.4;
      this.opacity = Math.random() * 0.5 + 0.1;
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;

      // Mouse attraction
      const dx = mouse.x - this.x;
      const dy = mouse.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 200) {
        const force = (200 - dist) / 200 * 0.015;
        this.speedX += dx * force * 0.01;
        this.speedY += dy * force * 0.01;
      }

      // Dampen speed
      this.speedX *= 0.999;
      this.speedY *= 0.999;

      // Wrap around
      if (this.x < -10) this.x = canvas.width + 10;
      if (this.x > canvas.width + 10) this.x = -10;
      if (this.y < -10) this.y = canvas.height + 10;
      if (this.y > canvas.height + 10) this.y = -10;
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(59, 130, 246, ${this.opacity})`;
      ctx.fill();
    }
  }

  function initParticles() {
    const count = Math.min(Math.floor((canvas.width * canvas.height) / 12000), 120);
    particles = [];
    for (let i = 0; i < count; i++) {
      particles.push(new Particle());
    }
  }

  function drawConnections() {
    const maxDist = 150;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxDist) {
          const opacity = (1 - dist / maxDist) * 0.15;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(59, 130, 246, ${opacity})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    // Draw connections to mouse
    for (let i = 0; i < particles.length; i++) {
      const dx = mouse.x - particles[i].x;
      const dy = mouse.y - particles[i].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 200) {
        const opacity = (1 - dist / 200) * 0.3;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.strokeStyle = `rgba(96, 165, 250, ${opacity})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }
  }

  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    drawConnections();
    animFrame = requestAnimationFrame(animateParticles);
  }

  resizeCanvas();
  initParticles();
  animateParticles();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resizeCanvas();
      initParticles();
    }, 200);
  });

  // ── Cursor Glow ──────────────────────────────────────────────
  const cursorGlow = document.querySelector('.cursor-glow');

  document.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;

    cursorGlow.style.left = e.clientX + 'px';
    cursorGlow.style.top = e.clientY + 'px';
  });

  document.addEventListener('mouseleave', () => {
    mouse.x = -1000;
    mouse.y = -1000;
  });

  // ── Magnetic Hover Effect ────────────────────────────────────
  const magneticElements = document.querySelectorAll('.magnetic');

  magneticElements.forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      el.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
    });

    el.addEventListener('mouseleave', () => {
      el.style.transform = 'translate(0, 0)';
      el.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
      setTimeout(() => {
        el.style.transition = '';
      }, 400);
    });
  });

  // ── Scroll Progress Bar ──────────────────────────────────────
  const scrollProgress = document.querySelector('.scroll-progress');

  function updateScrollProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    scrollProgress.style.width = progress + '%';
  }

  // ── Navigation ───────────────────────────────────────────────
  const nav = document.getElementById('nav');
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('nav-links');
  const navAnchors = navLinks.querySelectorAll('a');

  // Scroll state for nav
  function updateNavState() {
    if (window.scrollY > 50) {
      nav.classList.add('nav--scrolled');
    } else {
      nav.classList.remove('nav--scrolled');
    }
  }

  // Hamburger toggle
  hamburger.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    hamburger.classList.toggle('active');
    hamburger.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Close mobile menu on link click
  navAnchors.forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      hamburger.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  // Active section highlighting
  const sections = document.querySelectorAll('section[id]');

  function updateActiveSection() {
    const scrollPos = window.scrollY + window.innerHeight / 3;
    let currentId = '';

    sections.forEach(section => {
      if (section.offsetTop <= scrollPos) {
        currentId = section.id;
      }
    });

    navAnchors.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === '#' + currentId);
    });
  }

  // ── Scroll Reveal ────────────────────────────────────────────
  const revealElements = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));

  // ── Unified Scroll Handler ───────────────────────────────────
  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateScrollProgress();
        updateNavState();
        updateActiveSection();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  // Initial calls
  updateScrollProgress();
  updateNavState();
  updateActiveSection();

  // ── Hero Text Animation ──────────────────────────────────────
  // Animate hero elements on load with stagger
  window.addEventListener('load', () => {
    const heroReveals = document.querySelectorAll('.hero .reveal');
    heroReveals.forEach((el, i) => {
      setTimeout(() => {
        el.classList.add('visible');
      }, 300 + i * 150);
    });
  });

  // ── Typing Effect for Subtitle ───────────────────────────────
  const subtitle = document.querySelector('.hero__subtitle');
  if (subtitle) {
    const text = subtitle.textContent;
    subtitle.textContent = '';
    subtitle.style.borderRight = '2px solid var(--accent-bright)';
    subtitle.style.display = 'inline-block';

    let charIndex = 0;
    function typeChar() {
      if (charIndex < text.length) {
        subtitle.textContent += text[charIndex];
        charIndex++;
        setTimeout(typeChar, 50 + Math.random() * 30);
      } else {
        // Blink cursor then remove
        setTimeout(() => {
          subtitle.style.borderRight = 'none';
        }, 2000);
      }
    }

    // Start typing after hero reveals begin
    setTimeout(typeChar, 1200);
  }

})();
