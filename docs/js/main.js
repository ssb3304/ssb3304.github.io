/* ============================================================
   Seungbeom Seo — Homepage Interactive Scripts
   EEG trace background, cursor effects, scroll animations
   ============================================================ */

(function () {
  'use strict';

  // ── Capability / preference queries ──────────────────────────
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  // ── EEG Trace Background ─────────────────────────────────────
  // A slow, clinical-style multi-channel EEG strip: the site is literally drawn
  // in the applicant's own signal type. Traces are procedurally generated (a real
  // recording can be dropped in later); occipital channels (O1/Oz) carry stronger
  // alpha, echoing eyes-open visual-perception work.
  const canvas = document.getElementById('particle-canvas');
  const ctx = canvas.getContext('2d');
  let mouse = { x: -1000, y: -1000 };
  let animFrame = null;
  let W = window.innerWidth;
  let H = window.innerHeight;
  let heroVisible = true;
  let scroll = 0;

  const CHANNELS = [
    { label: 'Fp1', alpha: 6.1, theta: 3.0, beta: 19, aAmp: 0.35, bAmp: 0.20, phase: 0.0 },
    { label: 'F3',  alpha: 6.4, theta: 3.3, beta: 21, aAmp: 0.42, bAmp: 0.18, phase: 0.8 },
    { label: 'C3',  alpha: 6.7, theta: 2.7, beta: 18, aAmp: 0.48, bAmp: 0.16, phase: 1.7 },
    { label: 'Cz',  alpha: 6.2, theta: 3.1, beta: 20, aAmp: 0.52, bAmp: 0.15, phase: 2.4 },
    { label: 'P3',  alpha: 6.9, theta: 2.9, beta: 17, aAmp: 0.64, bAmp: 0.14, phase: 3.1 },
    { label: 'Pz',  alpha: 6.5, theta: 3.2, beta: 19, aAmp: 0.72, bAmp: 0.13, phase: 3.9 },
    { label: 'O1',  alpha: 6.8, theta: 2.8, beta: 16, aAmp: 0.98, bAmp: 0.12, phase: 4.6 },
    { label: 'Oz',  alpha: 6.6, theta: 3.0, beta: 18, aAmp: 1.12, bAmp: 0.12, phase: 5.3 },
  ];

  function resizeCanvas() {
    // Scale the backing store by devicePixelRatio (capped) so particles
    // render crisply on HiDPI/Retina screens; draw in CSS-pixel coordinates.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function eegValue(x, ch) {
    const s = x * 0.013;
    let v = 0;
    v += Math.sin(s * ch.alpha + ch.phase) * ch.aAmp;        // dominant rhythm
    v += Math.sin(s * ch.theta + ch.phase * 1.7) * 0.32;     // slower theta
    v += Math.sin(s * ch.beta + ch.phase * 0.5) * ch.bAmp;   // fast beta
    v += Math.sin(s * 1.6 + ch.phase * 3.1) * 0.28;          // slow drift
    v += Math.sin(s * 41.3 + ch.phase) * 0.05;               // fine texture
    const burst = 0.55 + 0.45 * Math.sin(s * 0.21 + ch.phase); // alpha waxing/waning
    return v * burst;
  }

  function drawEEG() {
    ctx.clearRect(0, 0, W, H);
    const n = CHANNELS.length;
    const topPad = Math.max(38, H * 0.06);
    const rowH = (H - topPad * 2) / n;
    const amp = rowH * 0.34;
    const startX = 46;

    // faint ~1-second grid, scrolling with the trace
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.045)';
    ctx.lineWidth = 1;
    const gridGap = 92;
    for (let gx = -(scroll % gridGap); gx <= W; gx += gridGap) {
      ctx.beginPath();
      ctx.moveTo(gx, topPad * 0.5);
      ctx.lineTo(gx, H - topPad * 0.5);
      ctx.stroke();
    }

    ctx.font = "600 11px 'JetBrains Mono', monospace";
    ctx.textBaseline = 'middle';

    for (let i = 0; i < n; i++) {
      const ch = CHANNELS[i];
      const baseline = topPad + rowH * (i + 0.5);
      const occ = ch.label.charAt(0) === 'O';
      ctx.strokeStyle = occ ? 'rgba(96, 165, 250, 0.40)' : 'rgba(59, 130, 246, 0.20)';
      ctx.lineWidth = occ ? 1.3 : 1;
      ctx.beginPath();
      for (let x = startX; x <= W; x += 2) {
        const y = baseline - eegValue(x + scroll, ch) * amp;
        if (x === startX) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.fillStyle = occ ? 'rgba(96, 165, 250, 0.55)' : 'rgba(136, 146, 164, 0.38)';
      ctx.fillText(ch.label, 14, baseline);
    }

    // review-style time cursor at the mouse (fine pointers set mouse.x)
    if (mouse.x > 0) {
      ctx.strokeStyle = 'rgba(96, 165, 250, 0.14)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(mouse.x, topPad * 0.5);
      ctx.lineTo(mouse.x, H - topPad * 0.5);
      ctx.stroke();
    }
  }

  function animate() {
    if (!heroVisible || prefersReduced.matches) {
      animFrame = null;
      return;
    }
    scroll += 0.5;
    drawEEG();
    animFrame = requestAnimationFrame(animate);
  }

  function startEEG() {
    if (animFrame == null && heroVisible && !prefersReduced.matches) {
      animFrame = requestAnimationFrame(animate);
    }
  }

  resizeCanvas();
  drawEEG();
  if (!prefersReduced.matches) startEEG();

  // Fade the canvas out and pause once the hero scrolls away — the trace never
  // sits behind body text and costs nothing off-screen.
  const heroSection = document.getElementById('hero');
  if (heroSection && 'IntersectionObserver' in window) {
    const heroObserver = new IntersectionObserver((entries) => {
      heroVisible = entries[0].isIntersecting;
      canvas.style.opacity = heroVisible ? '1' : '0';
      if (heroVisible) {
        if (prefersReduced.matches) drawEEG();
        else startEEG();
      }
    }, { threshold: 0 });
    heroObserver.observe(heroSection);
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resizeCanvas();
      drawEEG();
    }, 200);
  });

  // React to a live OS reduced-motion toggle.
  prefersReduced.addEventListener('change', () => {
    if (prefersReduced.matches) {
      if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; }
      drawEEG();
    } else {
      startEEG();
    }
  });

  // ── Cursor Glow ──────────────────────────────────────────────
  // Fine-pointer only: on touch, synthetic hover events would otherwise leave a
  // frozen 600px blob and swarm the particles toward the last tap point.
  const cursorGlow = document.querySelector('.cursor-glow');

  if (finePointer.matches) {
    let glowShown = false;
    let glowPending = false;
    let gx = 0;
    let gy = 0;

    document.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      gx = e.clientX;
      gy = e.clientY;
      if (!glowPending) {
        glowPending = true;
        requestAnimationFrame(() => {
          cursorGlow.style.left = gx + 'px';
          cursorGlow.style.top = gy + 'px';
          if (!glowShown) {
            cursorGlow.style.opacity = '1';
            glowShown = true;
          }
          glowPending = false;
        });
      }
    });

    document.addEventListener('mouseleave', () => {
      mouse.x = -1000;
      mouse.y = -1000;
    });
  }

  // ── Magnetic Hover Effect ────────────────────────────────────
  // Fine-pointer only. Applied to small targets (contact pills), not reading
  // surfaces — a tap on touch would otherwise leave elements stuck offset.
  if (finePointer.matches) {
    const magneticElements = document.querySelectorAll('.magnetic');

    magneticElements.forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        el.style.transform = `translate(${x * 0.14}px, ${y * 0.14}px)`;
      });

      const release = () => {
        el.style.transform = 'translate(0, 0)';
        el.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
        setTimeout(() => { el.style.transition = ''; }, 400);
      };
      el.addEventListener('mouseleave', release);
      el.addEventListener('pointercancel', release);
    });
  }

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

  // Mobile drawer: open/close with focus management, scroll lock, and inert.
  const navBackdrop = document.getElementById('nav-backdrop');
  const mobileMQ = window.matchMedia('(max-width: 768px)');
  let scrollLockY = 0;

  function menuIsOpen() {
    return navLinks.classList.contains('open');
  }

  // Remove drawer links from the tab order only when it's a *closed* mobile
  // drawer; on desktop the same element is the visible horizontal nav.
  function refreshInert() {
    navLinks.inert = mobileMQ.matches && !menuIsOpen();
  }

  function openMenu() {
    navLinks.classList.add('open');
    hamburger.classList.add('active');
    hamburger.setAttribute('aria-expanded', 'true');
    if (navBackdrop) navBackdrop.classList.add('open');
    navLinks.inert = false;
    // iOS-safe scroll lock (overflow:hidden is not honored on iOS Safari)
    scrollLockY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = '-' + scrollLockY + 'px';
    document.body.style.width = '100%';
    const first = navLinks.querySelector('a');
    if (first) first.focus();
  }

  function releaseScrollLock() {
    const y = scrollLockY;
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, y);
  }

  function closeMenu(restoreFocus) {
    if (!menuIsOpen()) return;
    navLinks.classList.remove('open');
    hamburger.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
    if (navBackdrop) navBackdrop.classList.remove('open');
    releaseScrollLock();
    refreshInert();
    if (restoreFocus) hamburger.focus();
  }

  hamburger.addEventListener('click', () => {
    if (menuIsOpen()) closeMenu(true);
    else openMenu();
  });

  // Close on link click
  navAnchors.forEach(link => {
    link.addEventListener('click', () => closeMenu(false));
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menuIsOpen()) closeMenu(true);
  });

  // Close on tap/click outside the drawer
  document.addEventListener('click', (e) => {
    if (!menuIsOpen()) return;
    if (navLinks.contains(e.target) || hamburger.contains(e.target)) return;
    closeMenu(false);
  });

  // Crossing the breakpoint (e.g. rotate to landscape at desktop width) must not
  // leave a scroll-locked page with a hidden hamburger.
  mobileMQ.addEventListener('change', () => {
    if (!mobileMQ.matches && menuIsOpen()) {
      closeMenu(false);
    }
    refreshInert();
  });

  refreshInert();

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

  // ── Back to Top ──────────────────────────────────────────────
  const backToTop = document.getElementById('back-to-top');

  function updateBackToTop() {
    if (!backToTop) return;
    if (window.scrollY > window.innerHeight * 1.5) {
      backToTop.classList.add('visible');
    } else {
      backToTop.classList.remove('visible');
    }
  }

  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: prefersReduced.matches ? 'auto' : 'smooth' });
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
        updateBackToTop();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  // Initial calls
  updateScrollProgress();
  updateNavState();
  updateActiveSection();
  updateBackToTop();

  // ── Hero Entrance ────────────────────────────────────────────
  // Runs immediately (script is at end of <body>), NOT on window 'load', so the
  // hero doesn't wait for fonts + the profile image on slow connections.
  function revealHero(instant) {
    const heroReveals = document.querySelectorAll('.hero .reveal');
    heroReveals.forEach((el, i) => {
      if (instant) {
        el.classList.add('visible');
      } else {
        setTimeout(() => el.classList.add('visible'), 200 + i * 140);
      }
    });
  }

  let heroSeen = false;
  try { heroSeen = !!sessionStorage.getItem('heroSeen'); } catch (e) { /* private mode */ }

  if (prefersReduced.matches || heroSeen) {
    revealHero(true);
  } else {
    revealHero(false);
    try { sessionStorage.setItem('heroSeen', '1'); } catch (e) { /* ignore */ }
  }

})();
