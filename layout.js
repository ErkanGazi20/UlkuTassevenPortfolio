function loadLayoutPart(id, file) {
  const host = document.getElementById(id);
  if (!host) {
    console.warn(`loadLayoutPart: #${id} not found on this page`);
    return;
  }
  fetch(file)
    .then(r => { if (!r.ok) throw new Error(`${r.status} ${r.statusText}`); return r.text(); })
    .then(html => { host.innerHTML = html; })
    .catch(err => console.error('Error loading layout:', err));
}

/* ---------- Contact form: send WITHOUT opening email (Formspree) ----------

1) Create a free form at https://formspree.io/ and copy your endpoint URL.
   It looks like: https://formspree.io/f/xxxxabcd

2) Paste it in FORMSPREE_ENDPOINT below.

3) On submit we POST JSON via fetch, show success message, and reset the form.

--------------------------------------------------------------------------- */

const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xldlvzda'; // ← change this once

function wireContactFormToFormspree() {
  const form   = document.getElementById('contact-form');
  if (!form) return;

  const status = document.getElementById('form-status');
  const btn    = document.getElementById('contact-submit');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Honeypot
    const honey = document.getElementById('contact-company');
    if (honey && honey.value.trim() !== '') return;

    // Simple front-end validation
    const name    = document.getElementById('contact-name')?.value?.trim();
    const email   = document.getElementById('contact-email')?.value?.trim();
    const message = document.getElementById('contact-message')?.value?.trim();
    if (!name || !email || !message) {
      if (status) status.textContent = 'Please fill your name, email, and message.';
      return;
    }

    // Build real form data (mimics browser submit)
    const fd = new FormData(form);
    fd.append('_page', location.href);

    // UI → sending
    if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
    if (status) { status.textContent = ''; status.classList.remove('success','error'); }

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: fd,
        headers: { 'Accept': 'application/json' }
      });

      // Parse any JSON response (errors included)
      let data = {};
      try { data = await res.json(); } catch {}

      if (!res.ok) {
        const msg = (data?.errors?.length)
          ? data.errors.map(e => e.message).join(', ')
          : `Error ${res.status}`;
        throw new Error(msg);
      }

      // Success
      if (status) { status.textContent = 'Thanks! Your message has been sent.'; status.classList.add('success'); }
      form.reset();
    } catch (err) {
      console.error('Contact submit failed:', err);
      if (status) {
        status.textContent = 'Submit failed: ' + (err?.message || 'Unknown error') +
          '. If this is your first time, check Formspree verification email.';
        status.classList.add('error');
      }
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Send Message'; }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // Load header & footer
  loadLayoutPart('site-header', 'header.html');
  loadLayoutPart('site-footer', 'footer.html');

  // ---- In-view highlight for clickable cards (mobile-like devices) ----
  const mobileLike = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  if (mobileLike) {
    const cards = document.querySelectorAll('.clickable-section');
    if (cards.length) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const on = entry.isIntersecting && entry.intersectionRatio >= 0.2;
          entry.target.classList.toggle('in-view', on);
        });
      }, { root: null, rootMargin: '0px 0px -10% 0px', threshold: [0, 0.2, 0.5, 1] });
      cards.forEach((el) => io.observe(el));

      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', () => {
          cards.forEach((el) => {
            const rect = el.getBoundingClientRect();
            const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
            const visible = Math.max(0, Math.min(rect.bottom, vh) - Math.max(rect.top, 0));
            const on = visible / Math.max(1, rect.height) >= 0.2;
            el.classList.toggle('in-view', on);
          });
        }, { passive: true });
      }
    }
  }

 // Enable form sending without opening email
  wireContactFormToFormspree();

  // Accessibility: allow Enter/Space on focusable cards
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
