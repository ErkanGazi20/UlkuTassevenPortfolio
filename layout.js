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

 // Mobile scroll hint for clickable sections
document.addEventListener('DOMContentLoaded', () => {
  let sections = document.querySelectorAll('.clickable-section');
  if (sections.length === 0) return;

  const seen = new WeakSet();

  const apply = (el, on) => {
    if (on) {
      el.classList.add('in-view');
      if (!seen.has(el)) {
        seen.add(el);
        // no pulse; keep it calm
      }
    } else {
      el.classList.remove('in-view');
    }
  };

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          // Trigger when ~15% visible, and keep it while it stays in
          apply(entry.target, entry.isIntersecting && entry.intersectionRatio >= 0.15);
        });
      },
      {
        threshold: [0, 0.15, 0.35, 0.65, 1],
        // start a little earlier; account for mobile URL bar dynamics
        rootMargin: '0px 0px -20% 0px'
      }
    );
    sections.forEach(sec => io.observe(sec));
  } else {
    // Fallback: simple scroll check
    const inView = (el) => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const elVisible = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
      const ratio = elVisible / Math.max(1, r.height);
      return ratio >= 0.15;
    };
    const onScroll = () => sections.forEach(el => apply(el, inView(el)));
    ['scroll', 'resize', 'orientationchange', 'pageshow'].forEach(ev => window.addEventListener(ev, onScroll, { passive: true }));
    onScroll(); // initial pass
  }
});

  // Keyboard activation (Enter/Space) for section-links
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
