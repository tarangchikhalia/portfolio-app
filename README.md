# Portfolio — `tarang.dev`

A personal portfolio with a small Node backend that serves a markdown-driven blog.

```
portfolio-app/
├── backend/
│   ├── server.js          # Express server + JSON API
│   ├── package.json
│   └── posts/             # ← Markdown blog posts live here
│       └── YYYY-MM-DD-slug.md
└── public/
    └── index.html         # Static frontend (served by the backend)
```

## Running

```bash
cd backend
npm install
npm start                  # http://localhost:3000
# or, with auto-reload on file changes:
npm run dev
```

Open `http://localhost:3000` and the frontend is served. The API is at `/api/*`.

## Adding a blog post

Drop a new markdown file into `backend/posts/`. The filename convention is
`YYYY-MM-DD-slug.md` — the date prefix is stripped, and the rest becomes the
URL-safe slug.

Every post **must** have YAML frontmatter:

```markdown
---
title: "On building things that outlive their author"
date: 2026-04-12
tags: [systems, philosophy, engineering]
excerpt: "Optional short summary. If omitted, the first paragraph is used."
---

Body in standard markdown. Headings, code blocks, lists, links — all supported.
```

After dropping a file, either:
- restart the server, or
- POST to `/api/reload` (the reload endpoint re-scans the posts directory).

If `RELOAD_TOKEN` is set in the environment, `/api/reload` requires the same
value in an `X-Reload-Token` header. Useful for production.

## API reference

| Method | Path                  | Purpose                                                  |
| ------ | --------------------- | -------------------------------------------------------- |
| GET    | `/api/posts`          | Paginated list. `?page=1&limit=10&tag=systems`           |
| GET    | `/api/posts/:slug`    | Full post including rendered HTML body                   |
| GET    | `/api/tags`           | Every tag with post counts                               |
| POST   | `/api/reload`         | Re-scan `posts/` without restarting (token-gated in prod)|

Pagination response shape:

```json
{
  "items":   [ ... ],
  "page":    1,
  "limit":   10,
  "total":   37,
  "pages":   4,
  "hasNext": true,
  "hasPrev": false
}
```

## Notes

- **No write API.** Posts are added by dropping markdown files — the frontend
  has no compose UI by design.
- **Pagination** on both Projects and Signals shows 10 items per page.
- **Posts are cached** at startup for fast responses. Use `/api/reload` to
  refresh after adding files in a running process.
- **Markdown:** GFM enabled (tables, strikethrough, fenced code blocks).
- **Themes** (light/dark) are persisted in `localStorage` on the client.
