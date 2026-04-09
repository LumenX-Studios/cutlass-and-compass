/* Shared custom cursor (desktop) */
(function initCustomCursor() {
  const canUseCustomCursor = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!canUseCustomCursor) return;

  const dot = document.getElementById('js-cursor-dot');
  const ring = document.getElementById('js-cursor-ring');
  if (!dot || !ring) return;

  document.documentElement.classList.add('has-custom-cursor');

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;
  let rafCursor = null;

  function runCursor() {
    // Higher interpolation factor = faster ring follow speed.
    ringX += (mouseX - ringX) * 0.28;
    ringY += (mouseY - ringY) * 0.28;
    dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
    ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
    rafCursor = requestAnimationFrame(runCursor);
  }

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.opacity = '1';
    ring.style.opacity = '1';
    if (!rafCursor) rafCursor = requestAnimationFrame(runCursor);
  }, { passive: true });

  window.addEventListener('mouseout', () => {
    dot.style.opacity = '0';
    ring.style.opacity = '0';
  });

  document.querySelectorAll('a, button, [role="button"], input, textarea, select').forEach((el) => {
    el.addEventListener('mouseenter', () => ring.classList.add('is-hover'));
    el.addEventListener('mouseleave', () => ring.classList.remove('is-hover'));
  });
})();
