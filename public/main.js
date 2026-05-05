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

// ============ SHARED HELPERS ============
const PAGE_SIZE = 10;

function escapeHtml(s) {
  return String(s).replace(/[&<>"\']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"\'":'&#39;'}[c]));
}

function formatDate(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: '2-digit' }).toUpperCase();
}

/**
 * Build a numbered pagination control.
 * Renders ‹ prev · 1 2 3 … 9 · next ›
 *   - keeps the current page, two neighbours, and the first/last page visible
 *   - inserts ellipses where pages are skipped
 */
function renderPagination(container, { page, pages, onChange }) {
  container.innerHTML = '';
  if (pages <= 1) return;

  const info = document.createElement('div');
  info.className = 'pagination-info';
  info.innerHTML = `Page <span class="current">${page}</span> / ${pages}`;
  container.appendChild(info);

  const controls = document.createElement('div');
  controls.className = 'pagination-controls';

  const prev = document.createElement('button');
  prev.className = 'page-btn nav';
  prev.innerHTML = '‹';
  prev.disabled = page <= 1;
  prev.onclick = () => onChange(page - 1);
  controls.appendChild(prev);

  // Compute which page numbers to show
  const window_ = new Set();
  window_.add(1); window_.add(pages);
  for (let p = page - 1; p <= page + 1; p++) {
    if (p >= 1 && p <= pages) window_.add(p);
  }
  const visible = [...window_].sort((a, b) => a - b);

  let last = 0;
  for (const p of visible) {
    if (p - last > 1) {
      const dots = document.createElement('span');
      dots.className = 'page-ellipsis';
      dots.textContent = '…';
      controls.appendChild(dots);
    }
    const b = document.createElement('button');
    b.className = 'page-btn' + (p === page ? ' active' : '');
    b.textContent = p;
    b.onclick = () => onChange(p);
    controls.appendChild(b);
    last = p;
  }

  const next = document.createElement('button');
  next.className = 'page-btn nav';
  next.innerHTML = '›';
  next.disabled = page >= pages;
  next.onclick = () => onChange(page + 1);
  controls.appendChild(next);

  container.appendChild(controls);
}

function paginate(arr, page, size) {
  const total = arr.length;
  const pages = Math.max(1, Math.ceil(total / size));
  const safePage = Math.max(1, Math.min(page, pages));
  const start = (safePage - 1) * size;
  return {
    items: arr.slice(start, start + size),
    page: safePage,
    pages,
    total,
  };
}

// ============ PROJECTS ============
const PROJECTS = [
  {
    n: '001',
    title: 'Multi-tenant <em>Notification Microservice</em>',
    desc: 'A queue-driven notification service that routes events to email, Slack, and Teams. Designed for tenant isolation, retry semantics, and predictable backpressure under load.',
    tags: ['microservices', 'queues', 'multi-tenant', 'backend'],
    status: 'live', statusLabel: '● live', year: '2025',
  },
  {
    n: '002',
    title: 'Local <em>Code Search Engine</em>',
    desc: 'A Sourcegraph-style code search built locally with tree-sitter and tokenization. Symbol-aware, fast on large repos, and works entirely offline.',
    tags: ['tree-sitter', 'search', 'indexing', 'developer-tools'],
    status: 'exp', statusLabel: '◇ research', year: '2025',
  },
  {
    n: '003',
    title: 'Enterprise <em>AI Environment Stack</em>',
    desc: 'A self-hostable bundle stitching OpenWebUI, Google ADK, Milvus, Langfuse, and Portainer into a coherent platform for internal AI workloads — observable, governable, deployable.',
    tags: ['llm-infra', 'milvus', 'observability', 'self-hosted'],
    status: 'live', statusLabel: '● live', year: '2025',
  },
  {
    n: '004',
    title: 'News, <em>TikTok-style</em>',
    desc: 'An iOS news reader that ingests RSS into a swipeable, vertical feed. Supabase backend, push for breaking stories, designed for one-thumb reading.',
    tags: ['ios', 'supabase', 'rss', 'consumer'],
    status: 'exp', statusLabel: '◇ beta', year: '2024',
  },
  {
    n: '005',
    title: 'Universal <em>Shopping Cart</em>',
    desc: 'A browser extension that unifies carts across stores into a single, comparable view. One list, one budget, fewer abandoned tabs.',
    tags: ['browser-extension', 'e-commerce', 'utility'],
    status: 'exp', statusLabel: '◇ beta', year: '2024',
  },
  {
    n: '006',
    title: '<em>mypwd</em> — Terminal Password Manager',
    desc: 'A minimal, scriptable password manager that lives in the terminal. Open-sourced on GitHub for engineers who never want to leave the keyboard.',
    tags: ['cli', 'security', 'open-source'],
    status: 'live', statusLabel: '● live', year: '2024',
  },
];

let projectsPage = 1;

function renderProjects() {
  const list = document.getElementById('projectsList');
  const { items, page, pages } = paginate(PROJECTS, projectsPage, PAGE_SIZE);
  projectsPage = page;

  list.innerHTML = items.map(p => `
    <div class="project">
      <div class="project-num">${p.n}</div>
      <div class="project-body">
        <div class="project-title">${p.title}</div>
        <div class="project-desc">${escapeHtml(p.desc)}</div>
        <div class="project-tags">
          ${p.tags.map(t => `<span class="project-tag">${escapeHtml(t)}</span>`).join('')}
        </div>
      </div>
      <div class="project-meta">
        <span class="status ${p.status}">${p.statusLabel}</span>
        <span class="year">${p.year}</span>
      </div>
      <div class="project-arrow">↗</div>
    </div>
  `).join('');

  renderPagination(document.getElementById('projectsPagination'), {
    page, pages,
    onChange: (newPage) => {
      projectsPage = newPage;
      renderProjects();
      document.getElementById('projects').scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
  });
}

renderProjects();

// ============ BLOG (API-DRIVEN) ============
let activeTag = 'all';
let blogPage = 1;
let availableTags = [];

const blogList       = document.getElementById('blogList');
const blogEmpty      = document.getElementById('blogEmpty');
const blogPagination = document.getElementById('blogPagination');
const tagBar         = document.getElementById('tagBar');

async function fetchTags() {
  try {
    const r = await fetch('/api/tags');
    if (!r.ok) throw new Error('failed to load tags');
    const data = await r.json();
    availableTags = data.tags || [];
    renderTagBar();
  } catch (err) {
    console.error('[blog] tag load failed:', err);
    availableTags = [];
    renderTagBar();
  }
}

function renderTagBar() {
  tagBar.innerHTML = '<span class="filter-label">Filter:</span>';
  const tags = ['all', ...availableTags.map(t => t.name)];
  tags.forEach(tag => {
    const btn = document.createElement('button');
    btn.className = 'tag-filter' + (activeTag === tag ? ' active' : '');
    btn.textContent = tag;
    btn.onclick = () => {
      if (activeTag === tag) return;
      activeTag = tag;
      blogPage = 1;
      renderTagBar();
      fetchPosts();
    };
    tagBar.appendChild(btn);
  });
}

async function fetchPosts() {
  blogList.innerHTML = '<div class="blog-status">Loading signals…</div>';
  blogEmpty.classList.remove('show');
  blogPagination.innerHTML = '';

  const params = new URLSearchParams({
    page:  String(blogPage),
    limit: String(PAGE_SIZE),
  });
  if (activeTag && activeTag !== 'all') params.set('tag', activeTag);

  try {
    const r = await fetch('/api/posts?' + params.toString());
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const data = await r.json();
    renderPosts(data);
  } catch (err) {
    console.error('[blog] post load failed:', err);
    blogList.innerHTML = `<div class="blog-status error">Could not load signals. Is the backend running?</div>`;
  }
}

function renderPosts(data) {
  const { items, page, pages, total } = data;

  if (!items || items.length === 0) {
    blogList.innerHTML = '';
    blogEmpty.classList.add('show');
    return;
  }

  blogList.innerHTML = '';
  items.forEach(post => {
    const el = document.createElement('article');
    el.className = 'post';
    el.innerHTML = `
      <div class="post-meta">
        <span>${formatDate(post.date)}</span>
        <span class="read">${escapeHtml(post.readTime || '')}</span>
      </div>
      <h3 class="post-title">${escapeHtml(post.title)}</h3>
      <p class="post-excerpt">${escapeHtml(post.excerpt || '')}</p>
      <div class="post-tags">
        ${(post.tags || []).map(t => `<span class="post-tag" data-tag="${escapeHtml(t)}">${escapeHtml(t)}</span>`).join('')}
      </div>
    `;
    el.querySelectorAll('.post-tag').forEach(tEl => {
      tEl.onclick = (e) => {
        e.stopPropagation();
        if (activeTag === tEl.dataset.tag) return;
        activeTag = tEl.dataset.tag;
        blogPage = 1;
        renderTagBar();
        fetchPosts();
        document.getElementById('blog').scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
    });
    el.querySelector('.post-title').onclick = () => openReader(post.slug);
    el.onclick = () => openReader(post.slug);
    blogList.appendChild(el);
  });

  renderPagination(blogPagination, {
    page, pages,
    onChange: (newPage) => {
      blogPage = newPage;
      fetchPosts();
      document.getElementById('blog').scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
  });
}

async function openReader(slug) {
  const reader     = document.getElementById('reader');
  const readerMeta = document.getElementById('readerMeta');
  const readerTitle= document.getElementById('readerTitle');
  const readerBody = document.getElementById('readerBody');

  readerMeta.textContent  = 'LOADING…';
  readerTitle.textContent = '';
  readerBody.innerHTML    = '';
  reader.classList.add('open');
  document.body.style.overflow = 'hidden';

  try {
    const r = await fetch('/api/posts/' + encodeURIComponent(slug));
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const post = await r.json();
    readerMeta.textContent  = `${formatDate(post.date)} · ${post.readTime} · ${(post.tags||[]).map(t => '#'+t).join(' ')}`;
    readerTitle.textContent = post.title;
    readerBody.innerHTML    = post.html;
  } catch (err) {
    console.error('[reader]', err);
    readerMeta.textContent = 'ERROR';
    readerBody.innerHTML   = '<p>Could not load this post.</p>';
  }
}

function closeReader() {
  document.getElementById('reader').classList.remove('open');
  document.body.style.overflow = '';
}

document.getElementById('readerClose').onclick = closeReader;
document.getElementById('reader').onclick = (e) => {
  if (e.target.id === 'reader') closeReader();
};
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeReader();
});

// Initial load
fetchTags().then(fetchPosts);
