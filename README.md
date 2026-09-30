# Antonio Lamanna — Author Hub

Personal site hosted on GitHub Pages.

It is intentionally a static author/research hub rather than a traditional blog. The site indexes writing, selected projects, research and book work while keeping the original content on the platforms where it is published.

## Structure

- `index.html` — homepage and editorial structure
- `styles.css` — visual system
- `main.js` — renders writing, projects and research
- `data/writing.json` — generated publication index
- `data/writing-manual.json` — manually curated external publications
- `data/projects.json` — selected projects
- `data/research.json` — research initiatives
- `scripts/fetch-medium.mjs` — Medium RSS synchronisation
- `.github/workflows/update-writing.yml` — scheduled writing sync
- `.github/workflows/deploy-pages.yml` — GitHub Pages deployment

## Writing sync

Medium articles are fetched automatically from:

`https://medium.com/feed/@antoniolamanna`

The workflow runs daily and can also be started manually from GitHub Actions.

External publications such as InfoQ or other editorial outlets can be added to `data/writing-manual.json`. They are merged with Medium and sorted by publication date.

## Deployment

The repository is configured for GitHub Pages using GitHub Actions.

Public site:

https://antonio-lamanna.github.io
