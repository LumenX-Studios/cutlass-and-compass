/* ── Hero entrance ───────────────────────────────────── */
// Ensure refresh always starts from the top (prevents browser scroll restoration).
try {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
} catch (e) {}

/* ── Lenis smooth scroll ─────────────────────────────── */
let lenis = null;
if (window.Lenis) {
  lenis = new window.Lenis({
    duration: 1.1,
    smoothWheel: true,
    smoothTouch: false
  });

  function lenisRaf(time) {
    lenis.raf(time);
    requestAnimationFrame(lenisRaf);
  }
  requestAnimationFrame(lenisRaf);
}

window.addEventListener('load', () => {
  // Force a top-of-page reset after reload.
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

  // If `axe.png` isn't next to the HTML, try a common fallback path.
  const axeImg = document.querySelector('img.about-axe');
  if (axeImg) {
    axeImg.onerror = () => { axeImg.src = 'assets/axe.png'; };
  }

  document.getElementById('veil').classList.add('gone');
  function at(fn, ms) { setTimeout(fn, ms); }
  at(() => document.getElementById('js-seal').classList.add('on'),     220);
  at(() => document.getElementById('js-vrule').classList.add('on'),    720);
  at(() => document.getElementById('js-wordmark').classList.add('on'), 920);
  at(() => document.getElementById('js-tagrow').classList.add('on'),  1200);
  at(() => document.getElementById('js-cue').classList.add('on'),     2400);
});

/* ── Smooth scroll (JS) ────────────────────────────────── */
function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

function smoothScrollToY(targetY, durationMs) {
  if (lenis) {
    lenis.scrollTo(targetY, {
      duration: Math.max(0.35, (durationMs ?? 700) / 1000),
      immediate: false
    });
    return;
  }

  if (prefersReducedMotion()) {
    window.scrollTo({ top: targetY, behavior: 'auto' });
    return;
  }

  const startY = window.scrollY || window.pageYOffset;
  const distance = targetY - startY;
  const duration = Math.max(250, durationMs ?? 700);
  const start = performance.now();

  function step(now) {
    const elapsed = now - start;
    const t = Math.min(1, elapsed / duration);
    const eased = easeOutCubic(t);
    window.scrollTo(0, startY + distance * eased);
    if (t < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

function smoothScrollToEl(el, offsetY = 0, durationMs = 800) {
  if (!el) return;
  const y = el.getBoundingClientRect().top + (window.scrollY || 0) + offsetY;
  smoothScrollToY(y, durationMs);
}

// Make the "Scroll" cue trigger a gentle smooth scroll.
const scrollCue = document.getElementById('js-cue');
const aboutSectionForScroll = document.querySelector('section.about');
if (scrollCue && aboutSectionForScroll) {
  scrollCue.style.cursor = 'pointer';
  scrollCue.addEventListener('click', () => smoothScrollToEl(aboutSectionForScroll, 0, 800));
}

/* ── Scroll-scrub video ──────────────────────────────── */
const video = document.getElementById('js-scroll-video');
const zone  = document.querySelector('.intro-zone');
const bar   = document.getElementById('js-video-bar');
const cue   = document.getElementById('js-cue');

let targetTime  = 0;
let currentLerp = 0;
let rafId       = null;

// Preload only metadata; seeking during scroll is the expensive part.
video.preload = 'metadata';

let lastSeekMs  = 0;
let scrollRafId = null;

// Setting `video.currentTime` during scroll forces decoding/seeking and can lag.
// This throttles those seeks while keeping the effect smooth.
const LERP             = 0.06;
const MAX_STEP        = 0.015; // max time adjustment per seek
const THRESHOLD       = 0.01;  // stop lerping when close enough
const SEEK_INTERVAL_MS = 60;   // set currentTime at most ~16x/sec

function lerp(a, b, t) { return a + (b - a) * t; }

function tick(now) {
  rafId = null;
  if (!video.duration) return;
  const diff = targetTime - currentLerp;
  if (Math.abs(diff) < THRESHOLD) { currentLerp = targetTime; return; }
  currentLerp = lerp(currentLerp, targetTime, LERP);
  if (now - lastSeekMs >= SEEK_INTERVAL_MS) {
    const videoGap = currentLerp - video.currentTime;
    const clamped  = Math.sign(videoGap) * Math.min(Math.abs(videoGap), MAX_STEP);
    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + clamped));
    lastSeekMs = now;
  }
  rafId = requestAnimationFrame(tick);
}

function ensureTick() {
  if (!rafId) rafId = requestAnimationFrame(tick);
}

function scrub() {
  const rect        = zone.getBoundingClientRect();
  const scrolled    = -rect.top;
  const videoScroll = rect.height - window.innerHeight - window.innerHeight;
  const progress    = Math.max(0, Math.min(1, (scrolled - window.innerHeight) / videoScroll));
  if (video.duration) targetTime = progress * video.duration;
  bar.style.width = (progress * 100).toFixed(1) + '%';
  if (scrolled > 40) cue.classList.add('out');
  else cue.classList.remove('out');
  ensureTick();
}

function onScrollRaf() {
  // Run `scrub()` at most once per animation frame.
  if (scrollRafId) return;
  scrollRafId = requestAnimationFrame(() => {
    scrollRafId = null;
    scrub();
  });
}

window.addEventListener('scroll', onScrollRaf, { passive: true });
window.addEventListener('resize', onScrollRaf, { passive: true });
video.addEventListener('loadedmetadata', () => { video.pause(); scrub(); });
scrub();

/* ── Scroll reveal ───────────────────────────────────── */
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('on'); obs.unobserve(e.target); }
  });
}, { threshold: 0.16 });
document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

/* ── About word-by-word reveal (scroll-driven) ───────── */
function splitWords(el) {
  const words = el.innerText.trim().split(/\s+/);
  el.innerHTML = words.map(w => `<span class="word">${w}</span>`).join(' ');
}
document.querySelectorAll('.about-lead, .about-follow').forEach(splitWords);

const aboutZone = document.getElementById('js-about-zone');
const allWords = Array.from(document.querySelectorAll('.about-body .word'));

function revealWords() {
  if (!aboutZone) return;
  const rect = aboutZone.getBoundingClientRect();
  const scrolled = -rect.top;
  const scrollable = Math.max(1, rect.height - window.innerHeight);
  const progress = Math.max(0, Math.min(1, scrolled / scrollable));
  const easedProgress = Math.pow(progress, 1.2);
  // Lower speed factor + easing gives a more gradual reveal.
  const revealCount = Math.floor(easedProgress * allWords.length * 1.08);
  allWords.forEach((w, i) => {
    if (i < revealCount) w.classList.add('visible');
    else w.classList.remove('visible');
  });
}

window.addEventListener('scroll', revealWords, { passive: true });
window.addEventListener('resize', revealWords, { passive: true });
revealWords();
