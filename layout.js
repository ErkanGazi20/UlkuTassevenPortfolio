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

  // Scroll hint for clickable sections (require ~100% visibility)
  const sections = document.querySelectorAll('.clickable-section');
  if (sections.length === 0) return;

  const apply = (el, on) => el.classList.toggle('in-view', on);

  // Helper for initial pass / fallback (allow tiny tolerance for mobile UI bars)
  const fullyVisible = (el) => {
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    return r.top >= 0 && r.bottom <= (vh + 1);
  };

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const fully = entry.isIntersecting && entry.intersectionRatio >= 0.999;
          apply(entry.target, fully);
        });
      },
      {
        threshold: [1],      // fire when 100% visible
        rootMargin: '0px'    // true 100%, no margins
      }
    );

    sections.forEach(sec => io.observe(sec));

    // Initial pass so the first fully-visible section highlights immediately
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
      if (target && target.classList && target.classList.contains('clickable-section')) {
        e.preventDefault();
        target.click();
      }
    }
  });
});
