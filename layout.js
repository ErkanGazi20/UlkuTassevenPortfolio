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

  // Scroll hint for clickable sections
  const sections = document.querySelectorAll('.clickable-section');
  if (sections.length === 0) return;

  const apply = (el, on) => el.classList.toggle('in-view', on);

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const on = entry.isIntersecting && entry.intersectionRatio >= 0.2;
        apply(entry.target, on);
      });
    }, {
      threshold: [0, 0.2, 0.5, 1],
      rootMargin: '0px 0px -20% 0px'
    });

    sections.forEach(sec => io.observe(sec));

    // Initial pass so first visible section highlights immediately
    requestAnimationFrame(() => {
      sections.forEach(sec => {
        const r = sec.getBoundingClientRect();
        const vh = window.innerHeight || document.documentElement.clientHeight;
        const visible = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
        const on = (visible / Math.max(1, r.height)) >= 0.2;
        apply(sec, on);
      });
    });
  } else {
    // Fallback for very old browsers
    const inView = (el) => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const visible = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
      return (visible / Math.max(1, r.height)) >= 0.2;
    };
    const onScroll = () => sections.forEach(el => apply(el, inView(el)));
    ['scroll','resize','orientationchange','pageshow'].forEach(ev =>
      window.addEventListener(ev, onScroll, { passive: true })
    );
    onScroll();
  }

  // Keyboard activation (Enter/Space)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const target = document.activeElement;
      if (target && target.classList && target.classList.contains('clickable-section')) {
        e.preventDefault();
        target.click();
      }
    }
  });
});
