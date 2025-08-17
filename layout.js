/* =============== PARTIALS LOADER (robust with fallbacks) =============== */
function fetchFirst(paths) {
  let i = 0;
  function tryNext() {
    if (i >= paths.length) {
      return Promise.reject(new Error('All fetch attempts failed for: ' + paths.join(' , ')));
    }
    const url = paths[i++];
    return fetch(url).then(r => {
      if (!r.ok) throw new Error(r.status + ' ' + r.statusText);
      return r.text();
    }).catch(() => tryNext());
  }
  return tryNext();
}

function loadLayoutPart(id, file, isTR) {
  const host = document.getElementById(id);
  if (!host) return Promise.resolve(null);

  // current folder path, e.g. "/tr/" or "/"
  const folder = location.pathname.replace(/[^/]*$/, ''); 

  const candidates = [
    folder + file,                             // same folder as the page
    (isTR ? '/tr/' : '/') + file,             // absolute language folder (or root)
    '/' + file,                                // site root
    '../' + file                               // one level up (helps when served from deeper paths)
  ];

  return fetchFirst(candidates)
    .then(html => { host.innerHTML = html; return host; })
    .catch(err => { console.error('Error loading', file, '->', err.message); return null; });
}

/* =============== LANGUAGE SWITCH (EN <-> TR) =============== */
function getLanguageSwitchHref() {
  // Are we under a "tr" folder anywhere in the path?
  const inTR = /\/tr\//.test(location.pathname);

  // Current file name; default to index.html
  const file = (location.pathname.split('/').pop() || 'index.html').replace(/^$/, 'index.html');

  if (inTR) {
    // TR -> EN (always go one level up)
    switch (file) {
      case 'index.html':                  return '../index.html';
      case 'eunitra-yaklasimi.html':      return '../theEunitraWay.html';
      case 'nasil-yardimci-oluyoruz.html':return '../howWeHelp.html';
      case 'bilgi-merkezi.html':          return '../knowledgeHub.html';
      case 'iletisim.html':               return '../contact.html';
      default:                            return '../index.html';
    }
  } else {
    // EN -> TR (go into tr/)
    switch (file) {
      case 'index.html':             return 'tr/index.html';
      case 'theEunitraWay.html':     return 'tr/eunitra-yaklasimi.html';
      case 'howWeHelp.html':         return 'tr/nasil-yardimci-oluyoruz.html';
      case 'knowledgeHub.html':      return 'tr/bilgi-merkezi.html';
      case 'contact.html':           return 'tr/iletisim.html';
      default:                       return 'tr/index.html';
    }
  }
}

function setLanguageSwitcher() {
  const el = document.getElementById('lang-switch');
  if (el) el.href = getLanguageSwitchHref();
}

/* =============== FORMSPREE (send without mail app) =============== */
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xldlvzda';

function wireContactFormToFormspree() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  if (!form.action || !/formspree\.io\/f\//.test(form.action)) {
    form.action = FORMSPREE_ENDPOINT;
  }

  const status = document.getElementById('form-status');
  const btn    = document.getElementById('contact-submit');
  const honey  = document.getElementById('contact-company');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (honey && honey.value.trim() !== '') return;

    const name    = document.getElementById('contact-name')?.value?.trim();
    const email   = document.getElementById('contact-email')?.value?.trim();
    const message = document.getElementById('contact-message')?.value?.trim();
    if (!name || !email || !message) {
      if (status) { status.textContent = 'Please fill your name, email, and message.'; status.classList.remove('success'); status.classList.add('error'); }
      return;
    }

    const fd = new FormData(form);
    fd.append('_page', location.href);

    if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
    if (status) { status.textContent = ''; status.classList.remove('success','error'); }

    try {
      const res = await fetch(form.action, { method: 'POST', body: fd, headers: { 'Accept': 'application/json' } });
      let data = {}; try { data = await res.json(); } catch {}

      if (!res.ok) {
        const msg = (data?.errors?.length) ? data.errors.map(e => e.message).join(', ') : `Error ${res.status}`;
        throw new Error(msg);
      }

      if (status) { status.textContent = 'Thanks! Your message has been sent.'; status.classList.remove('error'); status.classList.add('success'); }
      form.reset();
    } catch (err) {
      console.error('Contact submit failed:', err);
      if (status) {
        status.textContent = 'Submit failed: ' + (err?.message || 'Unknown error') + '. If this is your first time, check Formspree verification email.';
        status.classList.remove('success'); status.classList.add('error');
      }
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Send Message'; }
    }
  });
}

/* =============== MOBILE “IN-VIEW” HIGHLIGHT =============== */
function wireInViewHighlights() {
  const mobileLike = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  if (!mobileLike) return;

  const cards = document.querySelectorAll('.clickable-section');
  if (!cards.length) return;

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

/* =============== ACCESSIBILITY (keyboard activate cards) =============== */
function wireCardKeyboardActivation() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const a = document.activeElement;
      if (a?.classList?.contains('clickable-section')) {
        e.preventDefault();
        a.click();
      }
    }
  });
}

/* =============== BOOTSTRAP =============== */
document.addEventListener('DOMContentLoaded', function () {
  const isTR = document.documentElement.lang === 'tr' || /\/tr\//.test(location.pathname);
  const headerLoad = loadLayoutPart('site-header', isTR ? 'header-tr.html' : 'header.html', isTR);
  const footerLoad = loadLayoutPart('site-footer', isTR ? 'footer-tr.html' : 'footer.html', isTR);

  Promise.all([headerLoad, footerLoad]).then(() => setLanguageSwitcher());

  wireInViewHighlights();
  wireContactFormToFormspree();
  wireCardKeyboardActivation();
});

