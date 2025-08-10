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

  // Phones/tablets only (use OR to include Android correctly)
  const mobileLike = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  if (!mobileLike) return;

  // Sections
  const sections = document.querySelectorAll('.clickable-section');
  if (sections.length === 0) return;

  const TOL = 6; // px tolerance for Android dynamic toolbar & rounding
  const getVH = () =>
    (window.visualViewport ? Math.round(window.visualViewport.height) :
     (window.innerHeight || document.documentElement.clientHeight));

  const fullyVisible = (el) => {
    const r = el.getBoundingClientRect();
    const vh = getVH();
    const visible = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
    return visible >= (Math.round(r.height) - TOL);
  };

  const apply = (el, on) => el.classList.toggle('in-view', on);

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          // Don’t rely on ratio==1 on Android; measure directly
          apply(entry.target, fullyVisible(entry.target));
        });
      },
      {
        threshold: [0, 0.01, 0.5, 0.99, 1],
        rootMargin: '0px'
      }
    );
    sections.forEach(sec => io.observe(sec));

    // Initial pass so first fully-visible section lights immediately
    requestAnimationFrame(() => {
      sections.forEach(sec => apply(sec, fullyVisible(sec)));
    });

    // Re-check when the visual viewport changes height (Android URL bar show/hide)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => {
        sections.forEach(sec => apply(sec, fullyVisible(sec)));
      }, { passive: true });
    }
  } else {
    // Fallback
    const onScroll = () => sections.forEach(sec => apply(sec, fullyVisible(sec)));
    ['scroll','resize','orientationchange','pageshow'].forEach(ev =>
      window.addEventListener(ev, onScroll, { passive: true })
    );
    onScroll();
  }

  // Keyboard activation (Enter/Space)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const a = document.activeElement;
      if (a?.classList?.contains('clickable-section')) {
        e.preventDefault();
        a.click();
      }
    }
  });
});
