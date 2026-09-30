const GITHUB_USERNAME = "antonio-lamanna";

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

function renderWriting(items) {
  const grid = $("#writing-grid");
  grid.innerHTML = "";

  if (!Array.isArray(items) || items.length === 0) {
    setStatus("writing-status", "Articles will appear here automatically as soon as they are published.");
    return;
  }

  setStatus("writing-status", null);

  items.slice(0, 9).forEach((item) => {
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
    grid.appendChild(card);
  });
}

function renderProjects(items) {
  const grid = $("#projects-grid");
  grid.innerHTML = "";

  if (!Array.isArray(items) || items.length === 0) {
    setStatus("projects-status", "No selected projects yet.");
    return;
  }

  setStatus("projects-status", null);

  items.forEach((item) => {
    const tags = (item.tags || [])
      .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
      .join("");

    const target = item.site || item.repo || "#";
    const action = item.site ? "Open project →" : item.repo ? "View on GitHub →" : "";
    const kicker = item.status || "Project";

    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <a href="${escapeHtml(target)}" ${target === "#" ? "" : 'target="_blank" rel="noopener"'}>
        <div class="card-media"></div>
        <div class="card-body">
          <span class="card-kicker">${escapeHtml(kicker)}</span>
          <h3 class="card-title">${escapeHtml(item.name)}</h3>
          <p class="card-desc">${escapeHtml(item.description || "")}</p>
          <div class="tags">${tags}</div>
          <div class="card-meta">
            <span>Selected project</span>
            <span>${escapeHtml(action)}</span>
          </div>
        </div>
      </a>`;
    grid.appendChild(card);
  });
}

function renderResearch(items) {
  const grid = $("#research-grid");
  grid.innerHTML = "";

  if (!Array.isArray(items) || items.length === 0) {
    setStatus("research-status", "Research notes will appear here.");
    return;
  }

  setStatus("research-status", null);

  items.forEach((item) => {
    const target = item.url || "#";
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <a href="${escapeHtml(target)}" ${target === "#" ? "" : 'target="_blank" rel="noopener"'}>
        <div class="card-body">
          <span class="card-kicker">Research</span>
          <h3 class="card-title">${escapeHtml(item.name)}</h3>
          <p class="card-desc">${escapeHtml(item.description || "")}</p>
          <div class="card-meta">
            <span>Ongoing</span>
            <span>${item.url ? "Open →" : ""}</span>
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

  try {
    renderProjects(await loadJson("data/projects.json"));
  } catch (error) {
    console.error(error);
    setStatus("projects-status", "Projects could not be loaded right now.");
  }

  try {
    renderWriting(await loadJson("data/writing.json"));
  } catch (error) {
    console.error(error);
    setStatus("writing-status", "Writing could not be loaded right now.");
  }

  try {
    renderResearch(await loadJson("data/research.json"));
  } catch (error) {
    console.error(error);
    setStatus("research-status", "Research could not be loaded right now.");
  }
});
