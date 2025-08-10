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
  const sections = document.querySelectorAll('.clickable-section');
  if (!('IntersectionObserver' in window) || sections.length === 0) return;

  const seen = new WeakSet();
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const el = entry.target;
      if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
        el.classList.add('in-view');
        if (!seen.has(el)) {
          seen.add(el);
          el.classList.add('pulse-once');
          setTimeout(() => el.classList.remove('pulse-once'), 700);
        }
      } else {
        el.classList.remove('in-view');
      }
    });
  }, { threshold: [0, 0.5, 1] });

  sections.forEach(sec => io.observe(sec));

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
