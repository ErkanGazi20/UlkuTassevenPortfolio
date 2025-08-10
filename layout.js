function loadLayoutPart(id, file) {
  const host = document.getElementById(id);
  if (!host) {
    console.warn(`loadLayoutPart: #${id} not found on this page`);
    return;
  }
  fetch(file)
    .then(r => {
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      return r.text();
    })
    .then(html => { host.innerHTML = html; })
    .catch(err => console.error('Error loading layout:', err));
}

document.addEventListener('DOMContentLoaded', () => {
  // Load header & footer
  loadLayoutPart('site-header', 'header.html');
  loadLayoutPart('site-footer', 'footer.html');

  // Only enable scroll-highlighting on devices without hover (phones/tablets)
  const mobileLike = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  if (!mobileLike) return;

  // Scroll hint for clickable sections (treat as "100% in view" with small tolerance)
  const sections = document.querySelectorAll('.clickable-section');
  if (sections.length === 0) return;

  const TOL = 2; // CSS px tolerance (covers Android URL bar / rounding)
  const apply = (el, on) => el.classList.toggle('in-view', on);

  const fullyVisible = (el) => {
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const visible = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
    return visible >= (r.height - TOL);
  };

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          // Don’t trust ratio==1 on Android; measure directly
          apply(entry.target, fullyVisible(entry.target));
        });
      },
      {
        // Make sure we get callbacks entering/leaving; exact value doesn’t matter now
        threshold: [0, 0.01, 0.99, 1],
        rootMargin: '0px'
      }
    );
    sections.forEach(sec => io.observe(sec));

    // Initial pass
    requestAnimationFrame(() => {
      sections.forEach(sec => apply(sec, fullyVisible(sec)));
    });
  } else {
    // Fallback for very old browsers
    const onScroll = () => sections.forEach(sec => apply(sec, fullyVisible(sec)));
    ['scroll','resize','orientationchange','pageshow'].forEach(ev =>
      window.addEventListener(ev, onScroll, { passive: true })
    );
    onScroll();
  }

  // Keyboard activation (Enter/Space)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const target = document.activeElement;
      if (target?.classList?.contains('clickable-section')) {
        e.preventDefault();
        target.click();
      }
    }
  });
});
