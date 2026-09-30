const GITHUB_USERNAME = "antonio-lamanna";
const MAX_REPOS = 24;

const $ = (selector) => document.querySelector(selector);

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]
  ));
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function setStatus(id, message) {
  const node = document.getElementById(id);
  if (!node) return;
  if (!message) {
    node.classList.add("hidden");
    return;
  }
  node.classList.remove("hidden");
  node.textContent = message;
}

async function loadJson(path) {
  const response = await fetch(path, { cache: "no-cache" });
  if (!response.ok) throw new Error(`${path}: ${response.status}`);
  return response.json();
}

function initTheme() {
  const root = document.documentElement;
  const stored = localStorage.getItem("theme");
  const preferred = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  const initial = stored || preferred;

  function apply(theme) {
    root.setAttribute("data-theme", theme);
    const icon = $(".theme-icon");
    if (icon) icon.textContent = theme === "dark" ? "◑" : "◐";
  }

  apply(initial);

  $("#theme-toggle")?.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    localStorage.setItem("theme", next);
    apply(next);
  });
}

async function loadRepositories() {
  const grid = $("#repos-grid");

  try {
    const response = await fetch(
      `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&sort=updated`,
      { headers: { Accept: "application/vnd.github+json" } }
    );

    if (!response.ok) throw new Error(`GitHub API ${response.status}`);

    const repos = (await response.json())
      .filter((repo) => !repo.private && !repo.archived)
      .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))
      .slice(0, MAX_REPOS);

    if (!repos.length) {
      setStatus("repos-status", "No public repositories yet.");
      return;
    }

    setStatus("repos-status", null);
    grid.innerHTML = "";

    repos.forEach((repo) => {
      const topics = (repo.topics || []).slice(0, 4)
        .map((topic) => `<span class="repo-topic">${escapeHtml(topic)}</span>`)
        .join("");

      const card = document.createElement("article");
      card.className = "repo-card";

      card.innerHTML = `
        <div class="repo-top">
          <a class="repo-name" href="${repo.html_url}" target="_blank" rel="noopener">${escapeHtml(repo.name)}</a>
          <span class="repo-visibility">Public</span>
        </div>
        <p class="repo-desc">${escapeHtml(repo.description || "Public GitHub repository.")}</p>
        <div class="repo-topics">${topics}</div>
        <div class="repo-meta">
          ${repo.language ? `<span><i class="language-dot"></i>${escapeHtml(repo.language)}</span>` : ""}
          <span>★ ${repo.stargazers_count}</span>
          <span>⑂ ${repo.forks_count}</span>
          <span>Updated ${formatDate(repo.pushed_at)}</span>
        </div>`;

      grid.appendChild(card);
    });
  } catch (error) {
    console.error(error);
    setStatus("repos-status", "Repositories could not be loaded right now.");
  }
}

function renderWriting(items) {
  const grid = $("#writing-grid");
  grid.innerHTML = "";

  const existingMore = $("#writing-load-more");
  if (existingMore) existingMore.remove();

  if (!Array.isArray(items) || items.length === 0) {
    setStatus("writing-status", "Articles will appear here automatically as soon as they are published.");
    return;
  }

  setStatus("writing-status", null);

  const sorted = [...items].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  const batchSize = 6;
  let visible = batchSize;

  function articleCard(item) {
    const tags = (item.tags || []).slice(0, 3)
      .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
      .join("");

    const media = item.image
      ? `<div class="card-media"><img loading="lazy" src="${escapeHtml(item.image)}" alt="" /></div>`
      : `<div class="card-media"></div>`;

    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener">
        ${media}
        <div class="card-body">
          <span class="card-kicker">${escapeHtml(item.source || "Article")}</span>
          <h3 class="card-title">${escapeHtml(item.title)}</h3>
          <p class="card-desc">${escapeHtml(item.excerpt || "")}</p>
          <div class="tags">${tags}</div>
          <div class="card-meta">
            <span>${formatDate(item.date)}</span>
            <span>Read →</span>
          </div>
        </div>
      </a>`;
    return card;
  }

  function draw() {
    grid.innerHTML = "";
    sorted.slice(0, visible).forEach((item) => grid.appendChild(articleCard(item)));

    let more = $("#writing-load-more");
    if (sorted.length > visible) {
      if (!more) {
        more = document.createElement("div");
        more.id = "writing-load-more";
        more.className = "load-more-wrap";
        more.innerHTML = '<button class="btn btn-ghost load-more-btn" type="button">Load more</button>';
        grid.insertAdjacentElement("afterend", more);
        more.querySelector("button").addEventListener("click", () => {
          visible += batchSize;
          draw();
        });
      }
    } else if (more) {
      more.remove();
    }
  }

  draw();
}

function renderBooks(items) {
  const section = $("#books");
  const grid = $("#books-grid");

  if (!Array.isArray(items) || items.length === 0) {
    section?.classList.add("hidden-section");
    document.querySelector('a[href="#books"]')?.closest("li")?.remove();
    return;
  }

  section?.classList.remove("hidden-section");
  grid.innerHTML = "";

  items.forEach((item) => {
    const cover = item.cover
      ? `<div class="book-media"><img loading="lazy" src="${escapeHtml(item.cover)}" alt="Cover of ${escapeHtml(item.title)}" /></div>`
      : "";

    const card = document.createElement("article");
    card.className = "card book-item";
    card.innerHTML = `
      <a href="${escapeHtml(item.url || "#")}" ${item.url ? 'target="_blank" rel="noopener"' : ""}>
        ${cover}
        <div class="card-body">
          <span class="card-kicker">Book</span>
          <h3 class="card-title">${escapeHtml(item.title)}</h3>
          <p class="card-desc">${escapeHtml(item.description || "")}</p>
          <div class="card-meta">
            <span>${escapeHtml(item.publisher || "")}</span>
            <span>${item.url ? "View →" : ""}</span>
          </div>
        </div>
      </a>`;
    grid.appendChild(card);
  });
}

function renderPapers(items) {
  const grid = $("#papers-grid");
  grid.innerHTML = "";

  if (!Array.isArray(items) || items.length === 0) {
    setStatus("papers-status", "Papers will appear here automatically when indexed on arXiv.");
    return;
  }

  setStatus("papers-status", null);

  items.forEach((item) => {
    const tags = (item.categories || []).slice(0, 4)
      .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
      .join("");

    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener">
        <div class="card-body">
          <span class="card-kicker">arXiv</span>
          <h3 class="card-title">${escapeHtml(item.title)}</h3>
          <p class="card-desc">${escapeHtml(item.summary || "")}</p>
          <div class="tags">${tags}</div>
          <div class="card-meta">
            <span>${formatDate(item.date)}</span>
            <span>View paper →</span>
          </div>
        </div>
      </a>`;
    grid.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  initTheme();

  const avatar = $("#avatar");
  if (avatar) avatar.src = `https://github.com/${GITHUB_USERNAME}.png?size=248`;

  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  loadRepositories();

  try {
    renderBooks(await loadJson("data/books.json"));
  } catch (error) {
    console.error(error);
    $("#books")?.classList.add("hidden-section");
  }

  try {
    renderWriting(await loadJson("data/writing.json"));
  } catch (error) {
    console.error(error);
    setStatus("writing-status", "Writing could not be loaded right now.");
  }

  try {
    renderPapers(await loadJson("data/arxiv.json"));
  } catch (error) {
    console.error(error);
    setStatus("papers-status", "Papers could not be loaded right now.");
  }
});
