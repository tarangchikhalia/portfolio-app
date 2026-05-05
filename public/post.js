// ============ THEME TOGGLE ============
const THEME_KEY = 'tarang_portfolio_theme';

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const label = document.getElementById('themeLabel');
  if (label) label.textContent = theme === 'dark' ? 'DARK' : 'LIGHT';
}

function initTheme() {
  let saved;
  try { saved = localStorage.getItem(THEME_KEY); } catch (e) { /* ignore */ }
  const initial = saved === 'light' || saved === 'dark' ? saved : 'dark';
  applyTheme(initial);
}

document.getElementById('themeToggle').addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* ignore */ }
});

initTheme();

// ============ POST LOADER ============
function formatDate(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: '2-digit' }).toUpperCase();
}

async function loadPost() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');

  const loading = document.getElementById('postLoading');
  const error   = document.getElementById('postError');
  const content = document.getElementById('postContent');

  if (!slug) {
    loading.style.display = 'none';
    error.textContent = 'No post specified.';
    error.style.display = 'block';
    return;
  }

  try {
    const r = await fetch('/api/posts/' + encodeURIComponent(slug));
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const post = await r.json();

    document.title = post.title + ' · Tarang Chikhalia';

    document.getElementById('postMeta').textContent =
      `${formatDate(post.date)} · ${post.readTime} · ${(post.tags || []).map(t => '#' + t).join(' ')}`;
    document.getElementById('postTitle').textContent = post.title;
    document.getElementById('postBody').innerHTML = post.html;

    loading.style.display = 'none';
    content.style.display = 'block';
  } catch (err) {
    console.error('[post]', err);
    loading.style.display = 'none';
    error.style.display = 'block';
  }
}

loadPost();
