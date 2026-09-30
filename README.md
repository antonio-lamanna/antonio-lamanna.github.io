# Antonio Lamanna — Author Hub

Personal site hosted on GitHub Pages.

The site is a lightweight index of public repositories, long-form writing, published books and papers.

## Content model

- **Repositories** — loaded live from the public GitHub API
- **Writing** — synced automatically from Medium RSS
- **Books** — curated manually in `data/books.json`
- **Papers** — synced automatically from arXiv
- **About** — concise professional positioning

## Structure

- `index.html` — homepage
- `styles.css` — visual system
- `main.js` — theme, repository loading and content rendering
- `data/writing.json` — generated publication index
- `data/writing-manual.json` — curated external articles
- `data/books.json` — published books only
- `data/arxiv.json` — generated arXiv paper index
- `scripts/fetch-medium.mjs` — Medium RSS synchronisation
- `scripts/fetch-arxiv.mjs` — arXiv synchronisation
- `.github/workflows/update-writing.yml` — scheduled Medium sync
- `.github/workflows/update-arxiv.yml` — scheduled arXiv sync
- `.github/workflows/deploy-pages.yml` — GitHub Pages deployment

## Automation

### Medium

The site reads:

`https://medium.com/feed/@antoniolamanna`

The GitHub Action runs daily and commits updates to `data/writing.json`.

### arXiv

The arXiv Action queries the public arXiv API for papers whose author list contains exactly:

`Antonio Lamanna`

It runs daily and commits updates to `data/arxiv.json`.

### GitHub repositories

Public repositories are loaded live in the browser from the GitHub REST API. Private repositories never appear.

## Site

https://antonio-lamanna.github.io
