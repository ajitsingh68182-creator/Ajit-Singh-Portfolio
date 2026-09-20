/**
 * AJIT KUMAR SINGH — UI/UX DESIGNER PORTFOLIO
 * Main Controller Script
 * 5-Stage Scroll Hero · Case Study Modal · Custom Cursor · Audio Synthesis
 */

(function () {
  'use strict';

  // Helper selectors
  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

  /* ==========================================================================
     01. LOADING SCREEN (1.6s HUD Experience)
     ========================================================================== */
  const loader = $('#loader');
  const loaderBar = $('#loaderBar');
  const loaderPct = $('#loaderPct');

  function initLoader() {
    let progress = 0;
    const duration = 1500; // ms
    const interval = 25;
    const increment = 100 / (duration / interval);

    const timer = setInterval(() => {
      progress += increment;
      const current = Math.min(Math.round(progress), 100);

      if (loaderBar) loaderBar.style.width = `${current}%`;
      if (loaderPct) loaderPct.textContent = `${current < 10 ? '0' + current : current}%`;

      if (progress >= 100) {
        clearInterval(timer);
        setTimeout(() => {
          document.body.classList.remove('is-loading');
          if (loader) loader.classList.add('is-hidden');
          // Trigger initial hero video play
          const heroVideo = $('#heroVideo');
          if (heroVideo) {
            heroVideo.play().catch(() => {/* auto-play policy fallback */});
          }
          // Start background soundtrack (GTA 6 Theme · 70% volume)
          setupAutoplayTrigger();
        }, 200);
      }
    }, interval);
  }

  /* ==========================================================================
     02. 5-STAGE HERO SCROLL STORYTELLING & MOBILE OPTIMIZATION
     ========================================================================== */
  const heroTrack = $('.hero-scroll-track');
  const heroVideo = $('#heroVideo');
  const heroProgressFill = $('#heroProgressFill');
  const stageNumber = $('#stageNumber');
  const stageDots = $$('.stage-dot-btn');
  const stages = [
    $('#heroStage1'),
    $('#heroStage2'),
    $('#heroStage3'),
    $('#heroStage4'),
    $('#heroStage5')
  ];

  let isTicking = false;

  function setHeroStage(index, smoothScroll = false) {
    if (index < 0) index = 0;
    if (index >= stages.length) index = stages.length - 1;

    // Update active stage
    stages.forEach((stage, idx) => {
      if (stage) {
        if (idx === index) stage.classList.add('active');
        else stage.classList.remove('active');
      }
    });

    // Update Stage display number
    if (stageNumber) {
      stageNumber.textContent = `0${index + 1}`;
    }

    // Update active dot
    stageDots.forEach((dot, idx) => {
      if (idx === index) dot.classList.add('active');
      else dot.classList.remove('active');
    });

    // Update scrub fill
    if (heroProgressFill) {
      heroProgressFill.style.width = `${Math.max(10, ((index + 1) / 5) * 100)}%`;
    }

    // Smooth scroll into hero track position if requested
    if (smoothScroll && heroTrack) {
      const trackHeight = heroTrack.offsetHeight - window.innerHeight;
      if (trackHeight > 0) {
        const targetY = heroTrack.offsetTop + (index / 4) * trackHeight;
        window.scrollTo({ top: targetY, behavior: 'smooth' });
      }
    }
  }

  // Bind click/tap on stage dots
  stageDots.forEach(dot => {
    dot.addEventListener('click', (e) => {
      e.stopPropagation();
      const stageIdx = parseInt(dot.getAttribute('data-stage'), 10);
      if (!isNaN(stageIdx)) setHeroStage(stageIdx, true);
    });
  });

  function updateHeroScroll() {
    if (!heroTrack) return;

    const isMobile = window.innerWidth <= 768 || ('ontouchstart' in window);
    const trackRect = heroTrack.getBoundingClientRect();
    const trackHeight = heroTrack.offsetHeight - window.innerHeight;
    
    if (trackHeight <= 0) return;

    // Calculate progress between 0 and 1
    let scrollFraction = -trackRect.top / trackHeight;
    scrollFraction = Math.max(0, Math.min(1, scrollFraction));

    // Update bottom scrub fill bar
    if (heroProgressFill) {
      heroProgressFill.style.width = `${Math.max(10, scrollFraction * 100)}%`;
    }

    // Determine current stage (0 to 4)
    let activeStageIndex = Math.floor(scrollFraction * 5);
    if (activeStageIndex >= 5) activeStageIndex = 4;

    // Update Stage display number
    if (stageNumber) {
      stageNumber.textContent = `0${activeStageIndex + 1}`;
    }

    // Update active dot in stage dots selector
    stageDots.forEach((dot, idx) => {
      if (idx === activeStageIndex) dot.classList.add('active');
      else dot.classList.remove('active');
    });

    // Toggle active class on stage elements
    stages.forEach((stage, idx) => {
      if (stage) {
        if (idx === activeStageIndex) {
          stage.classList.add('active');
        } else {
          stage.classList.remove('active');
        }
      }
    });

    // On mobile / touch devices: DO NOT scrub currentTime to prevent severe GPU/scroll lag!
    // Video loops naturally and smoothly. Desktop with mouse wheel gets smooth scrubbing.
    if (!isMobile && heroVideo && heroVideo.duration && !isNaN(heroVideo.duration)) {
      const targetTime = scrollFraction * heroVideo.duration;
      if (Math.abs(heroVideo.currentTime - targetTime) > 0.3) {
        heroVideo.currentTime = targetTime;
      }
      const scale = 1.05 + scrollFraction * 0.08;
      heroVideo.style.transform = `scale(${scale})`;
    }

    isTicking = false;
  }

  window.addEventListener('scroll', () => {
    if (!isTicking) {
      requestAnimationFrame(updateHeroScroll);
      isTicking = true;
    }
  }, { passive: true });

  // Touch swipe support on hero stage for mobile
  const heroStageEl = $('.hero-sticky-stage');
  let touchStartX = 0;
  let touchStartY = 0;

  if (heroStageEl) {
    heroStageEl.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches[0]) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    heroStageEl.addEventListener('touchend', (e) => {
      if (!e.changedTouches || !e.changedTouches[0]) return;
      const deltaX = e.changedTouches[0].clientX - touchStartX;
      const deltaY = e.changedTouches[0].clientY - touchStartY;

      // Horizontal swipe to cycle stages on mobile
      if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY)) {
        let currentIdx = 0;
        stages.forEach((st, idx) => {
          if (st && st.classList.contains('active')) currentIdx = idx;
        });

        if (deltaX < 0 && currentIdx < 4) {
          // Swipe left -> Next stage
          setHeroStage(currentIdx + 1, true);
        } else if (deltaX > 0 && currentIdx > 0) {
          // Swipe right -> Previous stage
          setHeroStage(currentIdx - 1, true);
        }
      }
    }, { passive: true });
  }

  /* ==========================================================================
     03. NAVBAR SCROLL EFFECT & SCROLL-SPY
     ========================================================================== */
  const navbar = $('#navbar');
  const navLinks = $$('.nav-link');
  const sections = $$('section[id]');

  function handleNavScroll() {
    const scrollY = window.scrollY;

    // Navbar background blur & shadow toggle
    if (navbar) {
      if (scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }

    // Scroll-spy active link highlighting
    let currentSectionId = '';
    const scrollMid = scrollY + window.innerHeight * 0.35;

    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      if (scrollMid >= top && scrollMid < top + height) {
        currentSectionId = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      if (link.getAttribute('data-section') === currentSectionId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  window.addEventListener('scroll', handleNavScroll, { passive: true });

  /* ==========================================================================
     04. MOBILE NAVIGATION DRAWER
     ========================================================================== */
  const menuToggle = $('#menuToggle');
  const mobileDrawer = $('#mobileDrawer');
  const drawerBackdrop = $('#drawerBackdrop');
  const mobileLinks = $$('.mobile-link');

  function openDrawer() {
    if (!mobileDrawer) return;
    mobileDrawer.classList.add('is-open');
    mobileDrawer.setAttribute('aria-hidden', 'false');
    if (menuToggle) menuToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    if (!mobileDrawer) return;
    mobileDrawer.classList.remove('is-open');
    mobileDrawer.setAttribute('aria-hidden', 'true');
    if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      const isOpen = mobileDrawer && mobileDrawer.classList.contains('is-open');
      if (isOpen) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });
  }

  if (drawerBackdrop) {
    drawerBackdrop.addEventListener('click', closeDrawer);
  }

  const drawerCloseBtn = $('#drawerCloseBtn');
  if (drawerCloseBtn) {
    drawerCloseBtn.addEventListener('click', closeDrawer);
  }

  mobileLinks.forEach(link => {
    link.addEventListener('click', closeDrawer);
  });

  /* ==========================================================================
     05. INTERSECTION OBSERVER (SCROLL REVEAL)
     ========================================================================== */
  const revealElements = $$('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));

  /* ==========================================================================
     06. CUSTOM CURSOR (DESKTOP)
     ========================================================================== */
  const cursor = $('#customCursor');
  let mouseX = -100;
  let mouseY = -100;
  let cursorX = -100;
  let cursorY = -100;

  if (cursor && window.matchMedia('(pointer: fine)').matches) {
    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    function renderCursor() {
      // Smooth lerp
      cursorX += (mouseX - cursorX) * 0.22;
      cursorY += (mouseY - cursorY) * 0.22;

      cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) translate(-50%, -50%)`;
      requestAnimationFrame(renderCursor);
    }
    requestAnimationFrame(renderCursor);

    // Hover interactions
    const interactiveElements = $$('a, button, input, textarea, .competency-card, .process-step-item');
    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('is-hovering'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-hovering'));
    });

    // Project cards cursor expansion
    const projectCards = $$('.project-cinematic-card');
    projectCards.forEach(card => {
      card.addEventListener('mouseenter', () => cursor.classList.add('is-project'));
      card.addEventListener('mouseleave', () => cursor.classList.remove('is-project'));
    });
  }

  /* ==========================================================================
     07. GTA 6 OFFICIAL MAIN THEME SOUNDTRACK (VOLUME: 70%)
     ========================================================================== */
  const bgMusic = $('#bgMusic');
  const audioToggle = $('#audioToggle');
  const soundtrackToggleBtn = $('#soundtrackToggleBtn');
  const MUSIC_VOLUME = 0.70; // Strict 70% volume requested

  let isMusicPlaying = false;

  function updateAudioUI(isPlaying) {
    isMusicPlaying = isPlaying;
    if (audioToggle) {
      if (isPlaying) {
        audioToggle.classList.remove('muted');
        audioToggle.classList.add('is-playing');
        audioToggle.setAttribute('title', 'Pause GTA 6 Main Theme (Volume 70%)');
      } else {
        audioToggle.classList.add('muted');
        audioToggle.classList.remove('is-playing');
        audioToggle.setAttribute('title', 'Play GTA 6 Main Theme (Volume 70%)');
      }
    }
    if (soundtrackToggleBtn) {
      if (isPlaying) {
        soundtrackToggleBtn.classList.add('is-playing');
      } else {
        soundtrackToggleBtn.classList.remove('is-playing');
      }
    }
  }

  function playMusic() {
    if (!bgMusic) return Promise.reject(new Error('No audio element'));
    bgMusic.volume = MUSIC_VOLUME;
    return bgMusic.play().then(() => {
      updateAudioUI(true);
    }).catch(err => {
      updateAudioUI(false);
      throw err;
    });
  }

  function pauseMusic() {
    if (!bgMusic) return;
    bgMusic.pause();
    updateAudioUI(false);
  }

  function toggleMusic() {
    if (!bgMusic) return;
    if (bgMusic.paused) {
      playMusic();
    } else {
      pauseMusic();
    }
  }

  // Bind toggle buttons
  if (audioToggle) audioToggle.addEventListener('click', toggleMusic);
  if (soundtrackToggleBtn) soundtrackToggleBtn.addEventListener('click', toggleMusic);

  // Set initial volume immediately
  if (bgMusic) {
    bgMusic.volume = MUSIC_VOLUME;
  }

  // Attempt autoplay immediately, with fallback on first user gesture
  function setupAutoplayTrigger() {
    playMusic().catch(() => {
      const onFirstInteraction = () => {
        playMusic().then(() => {
          window.removeEventListener('pointerdown', onFirstInteraction);
          window.removeEventListener('keydown', onFirstInteraction);
          window.removeEventListener('scroll', onFirstInteraction);
        }).catch(() => {});
      };

      window.addEventListener('pointerdown', onFirstInteraction, { once: true, passive: true });
      window.addEventListener('keydown', onFirstInteraction, { once: true, passive: true });
      window.addEventListener('scroll', onFirstInteraction, { once: true, passive: true });
    });
  }

  /* ==========================================================================
     08. CASE STUDY DATA SYSTEM (100% STRICT TRUTH FROM RESUME)
     ========================================================================== */
  const projectsData = {
    savor: {
      id: 'savor',
      num: 'PROJECT 01',
      title: 'SAVOR',
      tagline: 'FRIDGE-FIRST MEAL DISCOVERY',
      category: 'RECIPE DISCOVERY APP',
      image: 'assets/savor.png',
      prev: 'dwell',
      prevName: 'DWELL',
      next: 'paysphere',
      nextName: 'PAYSPHERE',
      meta: [
        { label: 'PROJECT TYPE', value: 'Mobile Application (iOS / Android)' },
        { label: 'DESIGN ROLE', value: 'UI/UX Designer · Interaction Designer' },
        { label: 'CORE PROMISE', value: 'Fridge-First Ingredient Matching' },
        { label: 'TOOLS USED', value: 'Figma · Prototyping · Design Thinking' }
      ],
      lead: 'Traditional recipe apps rely on keyword searches and manual ingredient entry, creating friction between the ingredients users already have and deciding what to cook. Savor solves this with a “fridge-first” meal discovery experience that turns available ingredients into personalized recipe suggestions.',
      tabs: {
        overview: `
          <h3>Executive Summary</h3>
          <p>Savor is a culinary discovery mobile app engineered to solve everyday kitchen decision fatigue. Rather than forcing users to plan meals from scratch or buy extensive grocery lists, Savor allows users to scan or log ingredients already in their pantry and refrigerator to generate instant, delicious culinary matches.</p>
          <div class="cs-card-highlight">
            <strong>Brand Mission</strong>
            “See. Match. Create. Simply. — Simplify your ingredients, reduce your food waste.”
          </div>
          <p>Key design deliverables included end-to-end information architecture, user flows, wireframing, high-fidelity UI design, and interactive mobile prototypes.</p>
        `,
        problem: `
          <h3>The Problem & Friction</h3>
          <p>Through foundational user research and empathy mapping, the core friction was identified:</p>
          <ul>
            <li><strong>Keyword Dependency:</strong> Most existing recipe applications force users into open-ended search queries (e.g., "Pasta dishes"), which presupposes that users already know what they want to cook.</li>
            <li><strong>Manual Ingredient Overhead:</strong> Entering 10–15 individual pantry items by typing creates immense cognitive load and high abandonment rates.</li>
            <li><strong>Food Waste Friction:</strong> Users frequently let perishable items spoil because they lack actionable recipes for the exact subset of items currently in their fridge.</li>
          </ul>
        `,
        solution: `
          <h3>The Approach & Experience</h3>
          <p>Savor flips traditional recipe discovery upside down with a <em>“fridge-first”</em> mental model:</p>
          <ul>
            <li><strong>Ingredient Scanner:</strong> A tactile camera scan mode that identifies available ingredients in seconds.</li>
            <li><strong>Intelligent Pantry Assumptions:</strong> The system automatically assumes household staples (olive oil, salt, black pepper, garlic) so users don't waste time logging basic seasonings.</li>
            <li><strong>Instant Meal Matching:</strong> One-tap “Create a Recipe!” button delivers curated suggestions sorted by match percentage and preparation time.</li>
          </ul>
        `,
        architecture: `
          <h3>Information Architecture & Navigation Flow</h3>
          <p>The screen hierarchy is designed around 4 primary anchors on the mobile tab bar:</p>
          <ul>
            <li><strong>Make / Home:</strong> Personalized greeting, ingredient scanner callout, manual entry shortcut, and popular categories (Quick Dinners, Pasta Nights, Breakfast).</li>
            <li><strong>Recipe Discovery:</strong> Dynamic recipe feed filtered strictly by available detected items.</li>
            <li><strong>Saved:</strong> Bookmarked meals and custom recipe collections.</li>
            <li><strong>Profile:</strong> Dietary restrictions, allergy settings, and pantry preferences.</li>
          </ul>
        `,
        design: `
          <h3>Visual Design & Interface System</h3>
          <p>The visual interface utilizes a clean, warm culinary aesthetic:</p>
          <ul>
            <li><strong>Color Palette:</strong> Deep charcoal typography against clean porcelain surfaces, with soft lilac and violet accents (<code>#8a5cf6</code>) to highlight primary CTAs.</li>
            <li><strong>Tactile Ingredient Badges:</strong> Photo-realistic and clear visual chips (Cherry Tomatoes, Fresh Basil, Pasta, Black Olives, Red Bell Pepper) providing immediate recognition.</li>
            <li><strong>Microcopy:</strong> Friendly, empowering prompts like <em>"What's cooking today?"</em> and <em>"Found these ingredients."</em></li>
          </ul>
        `,
        learnings: `
          <h3>Key Learnings & Takeaways</h3>
          <p>Designing Savor reinforced the vital UX principle of <strong>reducing input friction</strong>. When designing utility mobile apps, minimizing text inputs in favor of visual detection and smart defaults drastically improves task completion and user delight.</p>
        `
      }
    },

    paysphere: {
      id: 'paysphere',
      num: 'PROJECT 02',
      title: 'PAYSPHERE',
      tagline: 'ONE WORLD. ONE PAYMENT.',
      category: 'PAYMENT APP / FINTECH',
      image: 'assets/paysphere.png',
      prev: 'savor',
      prevName: 'SAVOR',
      next: 'synergy',
      nextName: 'SYNERGY FLOW',
      meta: [
        { label: 'PROJECT TYPE', value: 'Fintech Mobile Application' },
        { label: 'DESIGN ROLE', value: 'UI/UX Designer · Product Designer' },
        { label: 'BRAND PROMISE', value: 'One World. One Payment.' },
        { label: 'CORE PILLARS', value: 'Trust · Speed · Accessibility' }
      ],
      lead: 'PaySphere is an all-in-one digital wallet and Unified Payments Interface (UPI) fintech platform designed under the brand promise: “One World. One Payment.” Built around trust, speed, and cross-platform accessibility, it streamlines daily financial obligations into a clean, modern interface.',
      tabs: {
        overview: `
          <h3>Executive Summary</h3>
          <p>PaySphere re-imagines digital payments by combining wallet balances, UPI bank transfers, QR scanning, and bill payments into a single cohesive interface. The objective was to eliminate visual noise and anxiety typically associated with fintech interfaces, replacing clutter with clarity and reassurance.</p>
          <div class="cs-card-highlight">
            <strong>Brand Promise</strong>
            “Scan. Pay. Go. One World. One Payment. — Global Payment Sphere.”
          </div>
          <p>Deliverables included comprehensive information architecture, wireframing, high-contrast visual interface design, and end-to-end interactive mobile prototypes.</p>
        `,
        problem: `
          <h3>The Problem & Financial Anxiety</h3>
          <p>Modern fintech applications frequently overwhelm users with predatory promotional banners, hidden wallet balances, and fragmented transfer pathways:</p>
          <ul>
            <li><strong>Cluttered Dashboards:</strong> Users struggled to quickly find essential payment actions amidst aggressive marketing and loan ads.</li>
            <li><strong>Transaction Latency:</strong> Multi-step confirmation flows slowed down time-sensitive payments at merchant counters.</li>
            <li><strong>Lack of Visual Hierarchy:</strong> Inconsistent typography and low-contrast transaction feeds caused hesitation and confusion.</li>
          </ul>
        `,
        solution: `
          <h3>The Approach & User Experience</h3>
          <p>PaySphere was designed around three non-negotiable UX pillars:</p>
          <ul>
            <li><strong>1. Trust:</strong> Prominent balance visibility, verified UPI logos, and instant transaction feedback with clear receipts.</li>
            <li><strong>2. Speed:</strong> The 4 critical primary actions (<em>Send, Request, Scan, Recharge</em>) are placed within the immediate thumb-reach zone.</li>
            <li><strong>3. Cross-Platform Accessibility:</strong> Clean typography, legible currency values, and large touch targets (minimum 48px) suitable for diverse user age groups.</li>
          </ul>
        `,
        architecture: `
          <h3>Information Architecture</h3>
          <p>The interface structure is divided into three distinct cognitive zones:</p>
          <ul>
            <li><strong>Balance & Action Hub:</strong> High-contrast blue wallet card displaying total balance, masked account toggle, and instant action pills.</li>
            <li><strong>Frequent Contacts:</strong> Color-coded avatar circles for one-tap payments to recurring contacts (friends, family, frequent merchants).</li>
            <li><strong>Live Transaction Stream:</strong> Clean chronological ledger showing merchant name, date, and positive/negative cash flow with distinct status indicators.</li>
          </ul>
        `,
        design: `
          <h3>Visual Design & UI System</h3>
          <p>The visual system balances professional security with modern digital minimalism:</p>
          <ul>
            <li><strong>Fintech Blue & Crisp White:</strong> Primary cobalt blue (<code>#1e50ff</code>) to communicate banking security, paired with neutral stone cards and crisp dark typography.</li>
            <li><strong>Tactile Spatial Elevation:</strong> Subtle ambient drop shadows and curved pill containers that organize financial actions into distinct cards.</li>
            <li><strong>Verified Metadata:</strong> Clear inclusion of standard Indian UPI protocols and bank linking credentials.</li>
          </ul>
        `,
        learnings: `
          <h3>Key Learnings</h3>
          <p>In fintech design, <strong>clarity equals trust</strong>. Removing unnecessary gamification and focusing purely on frictionless, rapid money transfer creates an interface that users feel safe relying on for their daily financial lives.</p>
        `
      }
    },

    synergy: {
      id: 'synergy',
      num: 'PROJECT 03',
      title: 'SYNERGY FLOW',
      tagline: 'UNIFY YOUR BUSINESS. ACCELERATE YOUR GROWTH.',
      category: 'SAAS / DASHBOARD WEBSITE',
      image: 'assets/synergy-flow.png',
      prev: 'paysphere',
      prevName: 'PAYSPHERE',
      next: 'dwell',
      nextName: 'DWELL',
      meta: [
        { label: 'PROJECT TYPE', value: 'Enterprise SaaS & Business Intelligence' },
        { label: 'DESIGN ROLE', value: 'Product Designer · UI Designer' },
        { label: 'TAGLINE', value: 'Unify Your Business. Accelerate Your Growth.' },
        { label: 'PLATFORM', value: 'Responsive Web / Desktop Command Center' }
      ],
      lead: 'Synergy Flow is an enterprise-grade SaaS operations and business intelligence platform built to connect team collaboration, automated workflows, and executive analytics into a single command center.',
      tabs: {
        overview: `
          <h3>Executive Summary</h3>
          <p>Synergy Flow unifies fragmented enterprise operations. By consolidating revenue analytics, project tracking, team collaboration tools, and automated reporting into an intuitive modular interface, it gives leadership teams total visibility into their organization.</p>
          <div class="cs-card-highlight">
            <strong>Core Value Proposition</strong>
            “The all-in-one platform for team collaboration, data insights, and workflow automation.”
          </div>
          <p>Key highlights include dashboard UX, modular information architecture, accessible data presentation, intuitive navigation, and responsive component design.</p>
        `,
        problem: `
          <h3>The Problem & SaaS Fragmentation</h3>
          <p>Enterprise teams commonly experience tool fatigue from using separate software for messaging, analytics, project boards, and client reporting:</p>
          <ul>
            <li><strong>Context Switching:</strong> Employees lose valuable hours daily hopping between isolated software dashboards.</li>
            <li><strong>Data Invisibility:</strong> Executives cannot easily view quarterly revenue trends alongside active project milestones.</li>
            <li><strong>High Cognitive Load:</strong> Traditional enterprise software is cluttered, dense, and visually overwhelming.</li>
          </ul>
        `,
        solution: `
          <h3>The Approach & Command Center UX</h3>
          <p>Synergy Flow organizes business complexity into clean, consumable visual modules:</p>
          <ul>
            <li><strong>Performance Telemetry:</strong> Clean quarterly revenue performance charts paired with growth trajectory tags.</li>
            <li><strong>Active Projects Overview:</strong> Progress bars with assignee avatar stacks for instant team accountability.</li>
            <li><strong>Real-Time KPI Cards:</strong> Color-coded status icons (positive checkmarks vs. attention alerts) for revenue, average volume, progression rate, and deliverables.</li>
          </ul>
        `,
        architecture: `
          <h3>Information Architecture</h3>
          <p>A persistent, streamlined top navigation bar provides immediate access to core workspaces:</p>
          <ul>
            <li><strong>Dashboard:</strong> High-level overview of revenue, KPIs, and project health.</li>
            <li><strong>Analytics:</strong> Deep-dive data queries, cohort analysis, and trend reporting.</li>
            <li><strong>Team:</strong> Collaboration spaces, permission management, and member activity.</li>
            <li><strong>Integrations:</strong> Seamless connectors to third-party enterprise tools.</li>
            <li><strong>Settings:</strong> Organization security, encryption, and profile configuration.</li>
          </ul>
        `,
        design: `
          <h3>UI Design System & Data Presentation</h3>
          <p>The visual design utilizes a clean enterprise blue-and-white theme:</p>
          <ul>
            <li><strong>Signature Helix Logo:</strong> Custom geometric ribbon emblem signifying continuous flow and collaboration.</li>
            <li><strong>Data Legibility:</strong> High-contrast typography with clear hierarchy (<code>$26,492.90</code> revenue with <code>+49.2%</code> green trajectory indicator).</li>
            <li><strong>Card Modularity:</strong> Standardized border radii, subtle card separators, and consistent action buttons.</li>
          </ul>
        `,
        learnings: `
          <h3>Key Learnings</h3>
          <p>High information density does not need to feel crowded. By utilizing generous whitespace, consistent card containers, and purposeful color accents, complex data can be made readily accessible to executives and team leads alike.</p>
        `
      }
    },

    dwell: {
      id: 'dwell',
      num: 'PROJECT 04',
      title: 'DWELL',
      tagline: 'DWELL. CURE. UNWIND. LIVING SPACES REDEFINED.',
      category: 'FURNITURE E-COMMERCE WEBSITE',
      image: 'assets/dwell.png',
      prev: 'synergy',
      prevName: 'SYNERGY FLOW',
      next: 'savor',
      nextName: 'SAVOR',
      meta: [
        { label: 'PROJECT TYPE', value: 'D2C Furniture E-Commerce Platform' },
        { label: 'DESIGN ROLE', value: 'UI/UX Designer · Visual Designer' },
        { label: 'TAGLINE', value: 'Dwell. Cure. Unwind. Living Spaces Redefined.' },
        { label: 'CORE INNOVATION', value: 'Curated Rooms & Spatial AR Showroom' }
      ],
      lead: 'DWELL is a contemporary direct-to-consumer (D2C) furniture brand and e-commerce platform dedicated to modern living spaces. The website transforms traditional furniture shopping from static catalog browsing into an interactive, spatial interior design experience.',
      tabs: {
        overview: `
          <h3>Executive Summary</h3>
          <p>DWELL bridges the gap between furniture browsing and interior styling. Rather than showing isolated chairs and tables on plain white backgrounds, DWELL presents furniture in curated architectural spaces, empowering shoppers to visualize complete living environments and preview pieces directly in their homes using augmented reality.</p>
          <div class="cs-card-highlight">
            <strong>Brand Promise</strong>
            “Your Curated Room, Instantly. — Scan. Identify. Style. Simplify.”
          </div>
          <p>Highlights include e-commerce UX, product discovery, spatial AR experience, responsive navigation, and conversion-focused design.</p>
        `,
        problem: `
          <h3>The Problem & E-Commerce Friction</h3>
          <p>Online furniture shopping suffers from high return rates and customer uncertainty:</p>
          <ul>
            <li><strong>Scale & Proportion Anxiety:</strong> Shoppers struggle to determine whether a sofa or coffee table will fit harmoniously in their physical space.</li>
            <li><strong>Styling Disconnect:</strong> Traditional websites sell individual products without showing how complementary items (armchairs, rugs, lamps, decor) coordinate.</li>
            <li><strong>Static Catalogs:</strong> Rigid product grids fail to inspire the aspirational lifestyle feel that luxury furniture shoppers desire.</li>
          </ul>
        `,
        solution: `
          <h3>The Approach & Spatial Shopping Experience</h3>
          <p>DWELL reimagines furniture discovery through contextual curation:</p>
          <ul>
            <li><strong>Curated Room Instantly:</strong> Full room scenes where every visible piece is tagged and purchaseable with a single tap.</li>
            <li><strong>AR Showroom Integration:</strong> <em>“Try AR Now”</em> button enables live mobile camera spatial visualization of furniture inside the customer's actual room.</li>
            <li><strong>Visual Category Grid:</strong> Clean minimalist icon cards for Sofas, Armchairs, Dining Sets, and Decor.</li>
          </ul>
        `,
        architecture: `
          <h3>Information Architecture</h3>
          <p>The platform is organized for seamless browsing and high conversion:</p>
          <ul>
            <li><strong>Global Header:</strong> Shop All, Sofas, Armchairs, Dining, AR Showroom, Search, and Cart.</li>
            <li><strong>Hero Stage:</strong> Large editorial lifestyle photography showcasing living spaces in natural warm lighting.</li>
            <li><strong>Instant Room Carousel:</strong> Horizontal product cards with transparent pricing (Velvet Armchair, Viper Sofa Set, Ceramic Floor Vase, Teak Coffee Table).</li>
            <li><strong>Interactive Category Matrix:</strong> Soft pastel category cards that guide users into targeted collections.</li>
          </ul>
        `,
        design: `
          <h3>Visual Design & Editorial Atmosphere</h3>
          <p>The design system evokes modern warmth and luxury interior magazines:</p>
          <ul>
            <li><strong>Warm Earth Palette:</strong> Off-white travertine backgrounds, charcoal typography, and subtle lilac sparkle accents.</li>
            <li><strong>Aspirational Photography:</strong> Preserving full, uncompressed interior photography of mid-century and modern living rooms.</li>
            <li><strong>Clear Pricing & CTA Hierarchy:</strong> Clean sans-serif pricing badges and dark pill action buttons (<em>"Explore the Collection"</em>, <em>"Try AR Now"</em>).</li>
          </ul>
        `,
        learnings: `
          <h3>Key Learnings</h3>
          <p>Contextual e-commerce drives significantly higher user engagement. When products are presented as part of a complete aesthetic vision with AR reassurance, customers feel confident making high-consideration home decor investments.</p>
        `
      }
    }
  };

  /* ==========================================================================
     09. CASE STUDY MODAL CONTROLLER
     ========================================================================== */
  const caseStudyModal = $('#caseStudyModal');
  const modalBackdrop = $('#modalBackdrop');
  const modalCloseBtn = $('#modalCloseBtn');
  const modalProjectKicker = $('#modalProjectKicker');
  const modalCategoryBadge = $('#modalCategoryBadge');
  const modalProjectTitle = $('#modalProjectTitle');
  const modalProjectTagline = $('#modalProjectTagline');
  const modalProjectDesc = $('#modalProjectDesc');
  const modalProjectImage = $('#modalProjectImage');
  const modalMetaGrid = $('#modalMetaGrid');
  const modalOverviewBody = $('#modalOverviewBody');
  const modalProblemBody = $('#modalProblemBody');
  const modalSolutionBody = $('#modalSolutionBody');
  const modalArchitectureBody = $('#modalArchitectureBody');
  const modalDesignBody = $('#modalDesignBody');
  const modalLearningsBody = $('#modalLearningsBody');
  const modalPrevProject = $('#modalPrevProject');
  const modalNextProject = $('#modalNextProject');
  const prevProjectName = $('#prevProjectName');
  const nextProjectName = $('#nextProjectName');
  const csTabs = $$('.cs-tab');
  const csPanels = $$('.cs-panel');
  const modalScrollBody = $('#modalScrollBody');

  let currentOpenProjectId = null;

  function openCaseStudy(projectId) {
    const data = projectsData[projectId];
    if (!data || !caseStudyModal) return;

    currentOpenProjectId = projectId;

    // Populate Headers & Lead
    if (modalProjectKicker) modalProjectKicker.textContent = `${data.num} // ${data.title}`;
    if (modalCategoryBadge) modalCategoryBadge.textContent = data.category;
    if (modalProjectTitle) modalProjectTitle.textContent = data.title;
    if (modalProjectTagline) modalProjectTagline.textContent = data.tagline;
    if (modalProjectDesc) modalProjectDesc.textContent = data.lead;

    // Image
    if (modalProjectImage) {
      modalProjectImage.src = data.image;
      modalProjectImage.alt = `${data.title} Case Study Visuals`;
    }

    // Meta Grid
    if (modalMetaGrid) {
      modalMetaGrid.innerHTML = data.meta.map(item => `
        <div class="cs-meta-cell">
          <label>${item.label}</label>
          <span>${item.value}</span>
        </div>
      `).join('');
    }

    // Populate Tab Bodies
    if (modalOverviewBody) modalOverviewBody.innerHTML = data.tabs.overview;
    if (modalProblemBody) modalProblemBody.innerHTML = data.tabs.problem;
    if (modalSolutionBody) modalSolutionBody.innerHTML = data.tabs.solution;
    if (modalArchitectureBody) modalArchitectureBody.innerHTML = data.tabs.architecture;
    if (modalDesignBody) modalDesignBody.innerHTML = data.tabs.design;
    if (modalLearningsBody) modalLearningsBody.innerHTML = data.tabs.learnings;

    // Reset Tabs to first tab
    csTabs.forEach((tab, index) => {
      if (index === 0) {
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
      } else {
        tab.classList.remove('active');
        tab.setAttribute('aria-selected', 'false');
      }
    });

    csPanels.forEach((panel, index) => {
      if (index === 0) {
        panel.classList.add('active');
      } else {
        panel.classList.remove('active');
      }
    });

    // Update bottom switcher
    if (prevProjectName) prevProjectName.textContent = data.prevName;
    if (nextProjectName) nextProjectName.textContent = data.nextName;

    // Scroll to top of modal
    if (modalScrollBody) modalScrollBody.scrollTop = 0;

    // Open
    caseStudyModal.classList.add('is-open');
    caseStudyModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeCaseStudy() {
    if (!caseStudyModal) return;
    caseStudyModal.classList.remove('is-open');
    caseStudyModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    currentOpenProjectId = null;
  }

  // Bind project card clicks
  $$('.project-cinematic-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const projectId = card.getAttribute('data-project');
      if (projectId) openCaseStudy(projectId);
    });

    // Keyboard accessibility (Enter or Space)
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const projectId = card.getAttribute('data-project');
        if (projectId) openCaseStudy(projectId);
      }
    });
  });

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeCaseStudy);
  if (modalBackdrop) modalBackdrop.addEventListener('click', closeCaseStudy);

  // Switch between projects inside modal
  if (modalPrevProject) {
    modalPrevProject.addEventListener('click', () => {
      if (currentOpenProjectId && projectsData[currentOpenProjectId]) {
        openCaseStudy(projectsData[currentOpenProjectId].prev);
      }
    });
  }

  if (modalNextProject) {
    modalNextProject.addEventListener('click', () => {
      if (currentOpenProjectId && projectsData[currentOpenProjectId]) {
        openCaseStudy(projectsData[currentOpenProjectId].next);
      }
    });
  }

  // Tab switching
  csTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetPanelId = tab.getAttribute('data-tab');
      
      csTabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      csPanels.forEach(p => {
        if (p.id === targetPanelId) {
          p.classList.add('active');
        } else {
          p.classList.remove('active');
        }
      });
    });
  });

  /* ==========================================================================
     10. LIGHTBOX IMAGE ZOOM
     ========================================================================== */
  const lightboxModal = $('#lightboxModal');
  const lightboxImage = $('#lightboxImage');
  const lightboxClose = $('#lightboxClose');
  const lightboxBackdrop = $('#lightboxBackdrop');
  const modalZoomTrigger = $('#modalZoomTrigger');
  const csMockupFrame = $('#csMockupFrame');

  function openLightbox(src) {
    if (!lightboxModal || !lightboxImage) return;
    lightboxImage.src = src;
    lightboxModal.classList.add('is-open');
    lightboxModal.setAttribute('aria-hidden', 'false');
  }

  function closeLightbox() {
    if (!lightboxModal) return;
    lightboxModal.classList.remove('is-open');
    lightboxModal.setAttribute('aria-hidden', 'true');
  }

  if (modalZoomTrigger && modalProjectImage) {
    modalZoomTrigger.addEventListener('click', () => openLightbox(modalProjectImage.src));
  }

  if (csMockupFrame && modalProjectImage) {
    csMockupFrame.addEventListener('click', () => openLightbox(modalProjectImage.src));
  }

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxBackdrop) lightboxBackdrop.addEventListener('click', closeLightbox);

  // Global ESC key listener
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (lightboxModal && lightboxModal.classList.contains('is-open')) {
        closeLightbox();
      } else if (caseStudyModal && caseStudyModal.classList.contains('is-open')) {
        closeCaseStudy();
      } else if (mobileDrawer && mobileDrawer.classList.contains('is-open')) {
        closeDrawer();
      }
    }
  });

  /* ==========================================================================
     11. ONE-CLICK CLIPBOARD COPY (EMAIL & PHONE)
     ========================================================================== */
  const copyButtons = $$('.copy-btn');

  copyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const textToCopy = btn.getAttribute('data-copy');
      if (!textToCopy) return;

      navigator.clipboard.writeText(textToCopy).then(() => {
        const statusSpan = btn.querySelector('.copy-status');
        const originalText = statusSpan ? statusSpan.textContent : 'COPY';

        if (statusSpan) {
          statusSpan.textContent = 'COPIED!';
          statusSpan.style.color = 'var(--neon-pink)';
        }
        btn.style.borderColor = 'var(--neon-pink)';

        setTimeout(() => {
          if (statusSpan) {
            statusSpan.textContent = originalText;
            statusSpan.style.color = '';
          }
          btn.style.borderColor = '';
        }, 2200);
      }).catch(err => {
        console.error('Clipboard copy failed:', err);
      });
    });
  });

  /* ==========================================================================
     12. FOOTER LIVE LOCAL TIME (DEORIA, IST UTC+5:30)
     ========================================================================== */
  const localClock = $('#localClock');

  function updateLocalClock() {
    if (!localClock) return;
    try {
      const options = {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      };
      const now = new Date();
      localClock.textContent = now.toLocaleTimeString('en-US', options);
    } catch (e) {
      const d = new Date();
      localClock.textContent = d.toLocaleTimeString();
    }
  }

  setInterval(updateLocalClock, 1000);
  updateLocalClock();

  /* ==========================================================================
     13. INITIALIZE ON WINDOW LOAD
     ========================================================================== */
  window.addEventListener('load', () => {
    initLoader();
    updateHeroScroll();
    handleNavScroll();
  });

})();
