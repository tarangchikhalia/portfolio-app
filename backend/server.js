// server.js — Tarang portfolio backend
//
// Reads markdown blog posts from ./posts, parses YAML frontmatter,
// and exposes a small JSON API consumed by the static frontend.
//
// Posts directory layout:
//   posts/
//     2026-04-12-on-building-things.md
//     2026-03-28-vector-databases-in-prod.md
//     ...
//
// Each markdown file MUST have YAML frontmatter:
//   ---
//   title: "On building things that outlive their author"
//   date: 2026-04-12
//   tags: [systems, philosophy, engineering]
//   excerpt: "Optional short summary. If omitted, the first paragraph is used."
//   ---
//
//   Body in markdown...
//

import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { marked } from 'marked';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const POSTS_DIR    = path.join(__dirname, 'posts');
const PROJECTS_FILE = path.join(__dirname, 'projects.json');
const PUBLIC_DIR   = path.join(__dirname, '..', 'public');
const PORT         = process.env.PORT || 3000;

// ---------- markdown configuration ----------
marked.setOptions({
  gfm: true,
  breaks: false,
  headerIds: false,
  mangle: false,
});

// ---------- post loading ----------
let POSTS_CACHE = [];

/**
 * Read every .md file in POSTS_DIR, parse frontmatter + body,
 * compute derived fields (slug, readTime, html), and return a sorted list.
 */
function loadPosts() {
  if (!fs.existsSync(POSTS_DIR)) {
    console.warn(`[posts] directory missing: ${POSTS_DIR}`);
    return [];
  }

  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
  const posts = [];

  for (const file of files) {
    const fullPath = path.join(POSTS_DIR, file);
    const raw = fs.readFileSync(fullPath, 'utf8');

    let parsed;
    try {
      parsed = matter(raw);
    } catch (err) {
      console.error(`[posts] failed to parse ${file}: ${err.message}`);
      continue;
    }

    const { data, content } = parsed;

    if (!data.title || !data.date) {
      console.warn(`[posts] skipping ${file}: missing required frontmatter (title, date)`);
      continue;
    }

    // Slug: filename minus extension, minus optional date prefix.
    const slug = file
      .replace(/\.md$/, '')
      .replace(/^\d{4}-\d{2}-\d{2}-/, '');

    const wordCount = content.split(/\s+/).filter(Boolean).length;
    const readTime  = `${Math.max(1, Math.round(wordCount / 200))} min`;

    // Excerpt: explicit frontmatter wins, otherwise derive from first paragraph.
    let excerpt = data.excerpt;
    if (!excerpt) {
      const firstPara = content
        .split(/\n\s*\n/)
        .map(p => p.trim())
        .find(p => p && !p.startsWith('#') && !p.startsWith('```'));
      excerpt = firstPara
        ? firstPara.replace(/[*_`>]/g, '').slice(0, 220) +
          (firstPara.length > 220 ? '…' : '')
        : '';
    }

    const tags = Array.isArray(data.tags)
      ? data.tags.map(t => String(t).toLowerCase())
      : (typeof data.tags === 'string'
          ? data.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
          : []);

    posts.push({
      slug,
      title: data.title,
      date: typeof data.date === 'string'
        ? data.date
        : data.date.toISOString().slice(0, 10),
      tags,
      readTime,
      excerpt,
      html: marked.parse(content),
    });
  }

  // Newest first.
  posts.sort((a, b) => b.date.localeCompare(a.date));
  return posts;
}

function refreshCache() {
  POSTS_CACHE = loadPosts();
  console.log(`[posts] loaded ${POSTS_CACHE.length} post(s)`);
}

refreshCache();

// ---------- app ----------
const app = express();

// Tiny request log — useful in dev, harmless in prod.
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// ---------- API ----------

/**
 * GET /api/posts
 *   ?page=1   (default 1)
 *   ?limit=10 (default 10, max 50)
 *   ?tag=foo  (optional — filter to posts with this tag)
 *
 * Response shape:
 *   {
 *     items:    [ { slug, title, date, tags, readTime, excerpt }, ... ],
 *     page:     1,
 *     limit:    10,
 *     total:    37,
 *     pages:    4,
 *     hasNext:  true,
 *     hasPrev:  false,
 *   }
 *
 * Note: `html` is NOT returned in the list view — only on the single-post route.
 */
app.get('/api/posts', (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page,  10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const tag   = req.query.tag ? String(req.query.tag).toLowerCase() : null;

  const filtered = tag && tag !== 'all'
    ? POSTS_CACHE.filter(p => p.tags.includes(tag))
    : POSTS_CACHE;

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  const items = filtered.slice(start, start + limit).map(stripHtml);

  res.json({
    items,
    page,
    limit,
    total,
    pages,
    hasNext: page < pages,
    hasPrev: page > 1,
  });
});

/**
 * GET /api/posts/:slug
 * Returns the full post object, including rendered HTML.
 */
app.get('/api/posts/:slug', (req, res) => {
  const post = POSTS_CACHE.find(p => p.slug === req.params.slug);
  if (!post) {
    return res.status(404).json({ error: 'post not found' });
  }
  res.json(post);
});

/**
 * GET /api/projects
 * Returns the full projects list from projects.json.
 */
app.get('/api/projects', (_req, res) => {
  try {
    const raw = fs.readFileSync(PROJECTS_FILE, 'utf8');
    const projects = JSON.parse(raw);
    res.json({ items: projects });
  } catch (err) {
    console.error('[projects] failed to load:', err.message);
    res.status(500).json({ error: 'could not load projects' });
  }
});

/**
 * GET /api/tags
 * Returns every tag with its post count, sorted by count desc.
 */
app.get('/api/tags', (_req, res) => {
  const counts = new Map();
  for (const p of POSTS_CACHE) {
    for (const t of p.tags) {
      counts.set(t, (counts.get(t) || 0) + 1);
    }
  }
  const tags = [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  res.json({ tags, total: POSTS_CACHE.length });
});

/**
 * POST /api/reload
 * Re-scan the posts directory without restarting the server.
 * Protected by a shared secret if RELOAD_TOKEN env var is set; otherwise open
 * (suitable for local dev — set the env var in any deployed environment).
 */
app.post('/api/reload', (req, res) => {
  const expected = process.env.RELOAD_TOKEN;
  if (expected) {
    const got = req.headers['x-reload-token'];
    if (got !== expected) return res.status(401).json({ error: 'unauthorized' });
  }
  refreshCache();
  res.json({ ok: true, count: POSTS_CACHE.length });
});

// ---------- static frontend ----------
const isDev = process.env.NODE_ENV !== 'production';
app.use(express.static(PUBLIC_DIR, {
  extensions: ['html'],
  maxAge: isDev ? 0 : '1h',
}));

// SPA-ish fallback for any non-API route.
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// ---------- helpers ----------
function stripHtml(post) {
  // List endpoint omits the rendered HTML body to keep payloads small.
  const { html, ...rest } = post;
  return rest;
}

// ---------- boot ----------
app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
  console.log(`[server] posts dir: ${POSTS_DIR}`);
  console.log(`[server] static dir: ${PUBLIC_DIR}`);
});
