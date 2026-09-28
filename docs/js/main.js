/* ============================================================
   Seungbeom Seo — Homepage Interactive Scripts
   Neural particle system, cursor effects, scroll animations
   ============================================================ */

(function () {
  'use strict';

  // ── Capability / preference queries ──────────────────────────
  // prefers-reduced-motion is intentionally ignored (owner's request): animations
  // always play. Stubbed to always-false so every motion gate below stays on.
  // To restore accessible behavior, use: window.matchMedia('(prefers-reduced-motion: reduce)').
  const prefersReduced = { matches: false, addEventListener: function () {} };
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  // ── Particle System (Neural Network Background) ──────────────
  // getContext('2d') can return null under real conditions (canvas memory
  // pressure on iOS Safari, blocked acceleration, canvas-blocking extensions).
  // Everything below must degrade to "no background" — never a blank page.
  const canvas = document.getElementById('particle-canvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  // Particle colors come from CSS tokens (--particle-rgb / --particle-link-rgb)
  // so the canvas follows the active theme; re-read on every theme switch.
  let particleRGB = '59, 130, 246';
  let particleLinkRGB = '96, 165, 250';
  function refreshParticlePalette() {
    const cs = getComputedStyle(document.documentElement);
    const dot = cs.getPropertyValue('--particle-rgb').trim();
    const link = cs.getPropertyValue('--particle-link-rgb').trim();
    if (dot) particleRGB = dot;
    if (link) particleLinkRGB = link;
  }
  refreshParticlePalette();
  let particles = [];
  let mouse = { x: -1000, y: -1000 };
  let animFrame = null;
  let W = window.innerWidth;
  let H = window.innerHeight;

  function resizeCanvas() {
    if (!ctx) return;
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

  class Particle {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * W;
      this.y = Math.random() * H;
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
      if (this.x < -10) this.x = W + 10;
      if (this.x > W + 10) this.x = -10;
      if (this.y < -10) this.y = H + 10;
      if (this.y > H + 10) this.y = -10;
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${particleRGB}, ${this.opacity})`;
      ctx.fill();
    }
  }

  function initParticles() {
    // Fewer particles on touch/low-power devices (coarse pointer).
    const density = finePointer.matches ? 12000 : 22000;
    const cap = finePointer.matches ? 120 : 55;
    const count = Math.min(Math.floor((W * H) / density), cap);
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
          ctx.strokeStyle = `rgba(${particleRGB}, ${opacity})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    // Draw connections to mouse (fine pointers only; mouse stays off-screen on touch)
    for (let i = 0; i < particles.length; i++) {
      const dx = mouse.x - particles[i].x;
      const dy = mouse.y - particles[i].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 200) {
        const opacity = (1 - dist / 200) * 0.3;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.strokeStyle = `rgba(${particleLinkRGB}, ${opacity})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }
  }

  function renderStaticFrame() {
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => p.draw());
    drawConnections();
  }

  function animateParticles() {
    if (prefersReduced.matches) {
      animFrame = null;
      return;
    }
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    drawConnections();
    animFrame = requestAnimationFrame(animateParticles);
  }

  function startParticles() {
    if (ctx && animFrame == null && !prefersReduced.matches) {
      animFrame = requestAnimationFrame(animateParticles);
    }
  }

  if (ctx) {
    resizeCanvas();
    initParticles();
    if (prefersReduced.matches) {
      renderStaticFrame();
    } else {
      startParticles();
    }
  }

  // The field spans the whole page (behind the transparent sections). Pause only
  // while the tab is hidden — saves battery with no visible change.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; }
    } else if (!prefersReduced.matches) {
      startParticles();
    }
  });

  let resizeTimer;
  let lastWidth = window.innerWidth;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const w = window.innerWidth;
      resizeCanvas();
      // Only re-seed particles when the width changes — height-only changes are
      // usually the mobile URL bar collapsing and shouldn't teleport the field.
      if (w !== lastWidth) {
        initParticles();
        lastWidth = w;
      }
      if (prefersReduced.matches) renderStaticFrame();
    }, 200);
  });

  // React to a live OS reduced-motion toggle.
  prefersReduced.addEventListener('change', () => {
    if (prefersReduced.matches) {
      if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; }
      renderStaticFrame();
    } else {
      startParticles();
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
      if (cursorGlow && !glowPending) {
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
      // Fade the glow out instead of leaving a frozen blob at the exit edge;
      // the next mousemove fades it back in (CSS transitions opacity).
      if (cursorGlow) {
        cursorGlow.style.opacity = '0';
        glowShown = false;
      }
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
    if (!scrollProgress) return;
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    scrollProgress.style.width = progress + '%';
  }

  // ── Navigation ───────────────────────────────────────────────
  const nav = document.getElementById('nav');
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('nav-links');
  const navAnchors = navLinks ? navLinks.querySelectorAll('a') : [];
  const themeToggle = document.getElementById('theme-toggle');

  // Scroll state for nav
  function updateNavState() {
    if (!nav) return;
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
    return !!navLinks && navLinks.classList.contains('open');
  }

  // Remove drawer links from the tab order only when it's a *closed* mobile
  // drawer; on desktop the same element is the visible horizontal nav.
  function refreshInert() {
    if (navLinks) navLinks.inert = mobileMQ.matches && !menuIsOpen();
  }

  function openMenu() {
    navLinks.classList.add('open');
    if (nav) nav.classList.add('nav--menu-open');
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
    // Instant, not smooth — html{scroll-behavior:smooth} would otherwise animate
    // a jump-to-top-then-back when the drawer closes. Two-arg scrollTo (never
    // the options object: 'instant' throws on pre-2022 Safari) with the CSS
    // smooth behavior temporarily suppressed via inline style.
    const rootStyle = document.documentElement.style;
    const prevBehavior = rootStyle.scrollBehavior;
    rootStyle.scrollBehavior = 'auto';
    window.scrollTo(0, y);
    rootStyle.scrollBehavior = prevBehavior;
  }

  function closeMenu(restoreFocus) {
    if (!menuIsOpen()) return;
    navLinks.classList.remove('open');
    if (nav) nav.classList.remove('nav--menu-open');
    hamburger.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
    if (navBackdrop) navBackdrop.classList.remove('open');
    releaseScrollLock();
    refreshInert();
    if (restoreFocus) hamburger.focus();
  }

  if (hamburger && navLinks) {
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

    // Close on tap/click outside the drawer (the theme toggle sits in the bar
    // above the open drawer and should switch themes without closing it)
    document.addEventListener('click', (e) => {
      if (!menuIsOpen()) return;
      if (navLinks.contains(e.target) || hamburger.contains(e.target)) return;
      if (themeToggle && themeToggle.contains(e.target)) return;
      closeMenu(false);
    });

    // Crossing the breakpoint (e.g. rotate to landscape at desktop width) must not
    // leave a scroll-locked page with a hidden hamburger.
    const onBreakpointChange = () => {
      if (!mobileMQ.matches && menuIsOpen()) {
        closeMenu(false);
      }
      refreshInert();
    };
    // addEventListener on MediaQueryList is missing on Safari ≤13 — a throw here
    // would kill all the init below it, so feature-detect with the old API.
    if (typeof mobileMQ.addEventListener === 'function') {
      mobileMQ.addEventListener('change', onBreakpointChange);
    } else if (typeof mobileMQ.addListener === 'function') {
      mobileMQ.addListener(onBreakpointChange);
    }

    refreshInert();
  }

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

  // ── Theme Toggle ─────────────────────────────────────────────
  // The <head> bootstrap already applied a saved light preference before
  // first paint. This wires the button, keeps the aria-label and the mobile
  // browser chrome color (<meta name="theme-color">) in sync, persists the
  // choice, and re-reads the particle palette so the canvas follows the CSS.
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const themeStatus = document.getElementById('theme-status');
  // Must match --bg-primary of each theme in style.css and the head bootstrap
  const THEME_META_COLOR = { dark: '#0a0e17', light: '#f4f6fa' };
  let themeSwitchTimer = null;

  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }

  function syncThemeUI(theme) {
    if (themeMeta) themeMeta.setAttribute('content', THEME_META_COLOR[theme]);
    if (themeToggle) {
      themeToggle.setAttribute('aria-label',
        theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
    }
  }

  // persist === false when mirroring a change made in another tab
  function applyTheme(theme, persist) {
    const root = document.documentElement;
    // Brief global color transition so the switch crossfades instead of snapping.
    root.classList.add('theme-switching');
    clearTimeout(themeSwitchTimer);
    themeSwitchTimer = setTimeout(() => root.classList.remove('theme-switching'), 400);

    if (theme === 'light') root.setAttribute('data-theme', 'light');
    else root.removeAttribute('data-theme');
    syncThemeUI(theme);
    refreshParticlePalette();
    // The rAF loop picks the palette up next frame; a parked canvas needs a repaint.
    if (ctx && animFrame == null) renderStaticFrame();
    // Most screen readers do not re-read a focused button whose name changed.
    if (themeStatus) themeStatus.textContent = theme === 'light' ? 'Light theme on' : 'Dark theme on';
    if (persist !== false) {
      try { localStorage.setItem('theme', theme); } catch (e) { /* private mode */ }
    }
  }

  // Another tab (or a bfcache restore) may have changed the stored choice.
  function syncThemeFromStorage() {
    let stored = null;
    try { stored = localStorage.getItem('theme'); } catch (e) { return; }
    const want = stored === 'light' ? 'light' : 'dark';
    if (want !== currentTheme()) applyTheme(want, false);
  }

  syncThemeUI(currentTheme());
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      applyTheme(currentTheme() === 'light' ? 'dark' : 'light');
    });
  }
  window.addEventListener('storage', (e) => {
    if (e.key === 'theme' || e.key === null) syncThemeFromStorage();
  });
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) syncThemeFromStorage();
  });

  // ── Scroll Reveal ────────────────────────────────────────────
  // Hero reveals are choreographed by revealHero(); exclude them here so the
  // generic observer doesn't fire first and cancel the stagger.
  const revealElements = Array.prototype.filter.call(
    document.querySelectorAll('.reveal'),
    (el) => !el.closest('.hero')
  );

  if ('IntersectionObserver' in window) {
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
  } else {
    // No IntersectionObserver support: reveal everything so nothing stays hidden.
    revealElements.forEach(el => el.classList.add('visible'));
  }

  // ── Unified Scroll Handler ───────────────────────────────────
  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        ticking = false;
        // The drawer's body scroll lock clamps scrollY to 0; recomputing here
        // would visibly zero the progress bar and clear the active nav link
        // while the menu is open. State is refreshed on close via scrollTo.
        if (menuIsOpen()) return;
        updateScrollProgress();
        updateNavState();
        updateActiveSection();
        updateBackToTop();
      });
      ticking = true;
    }
  }, { passive: true });

  // Initial calls
  updateScrollProgress();
  updateNavState();
  updateActiveSection();
  updateBackToTop();

  // Same-session revisits (reload, back-navigation) get an instant hero, so the
  // typing intro is skipped for them too — computed here because both the typing
  // block and the hero entrance below key off it.
  let heroSeen = false;
  try { heroSeen = !!sessionStorage.getItem('heroSeen'); } catch (e) { /* private mode */ }

  // ── Typing Effect (hero subtitle) ────────────────────────────
  // Types the research thesis out character by character. Set up before the hero
  // entrance so the subtitle is already cleared when it fades in (no flash of the
  // full line). Skipped under reduced-motion and on same-session revisits (the
  // subtitle then simply keeps its static text). While typing, the full sentence
  // stays in the accessibility tree via aria-label and the box height is
  // reserved so nothing below it jumps; both are undone once typing completes.
  // try/catch: a failure in this decorative block must never stop the hero
  // entrance below from running.
  const subtitle = document.querySelector('.hero__subtitle');
  if (subtitle && !heroSeen && !prefersReduced.matches) {
    try {
      const fullText = subtitle.textContent.trim();
      subtitle.setAttribute('aria-label', fullText);
      subtitle.style.minHeight = subtitle.offsetHeight + 'px';
      const typedSpan = document.createElement('span');
      typedSpan.setAttribute('aria-hidden', 'true');
      subtitle.textContent = '';
      subtitle.appendChild(typedSpan);
      subtitle.classList.add('typing');

      setTimeout(function () {
        let i = 0;
        (function step() {
          if (i < fullText.length) {
            typedSpan.textContent += fullText.charAt(i++);
            setTimeout(step, 34 + Math.random() * 26);
          } else {
            // Typing done: hand the real text back to the accessibility tree.
            typedSpan.removeAttribute('aria-hidden');
            subtitle.removeAttribute('aria-label');
            setTimeout(() => subtitle.classList.remove('typing'), 1600);
          }
        })();
      }, 700);
    } catch (e) {
      // Restore a readable subtitle no matter what went wrong mid-setup.
      subtitle.textContent = subtitle.getAttribute('aria-label') || subtitle.textContent;
      subtitle.removeAttribute('aria-label');
      subtitle.classList.remove('typing');
    }
  }

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

  if (prefersReduced.matches || heroSeen) {
    revealHero(true);
  } else {
    revealHero(false);
    try { sessionStorage.setItem('heroSeen', '1'); } catch (e) { /* ignore */ }
  }

})();
