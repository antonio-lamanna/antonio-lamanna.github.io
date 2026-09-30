import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const FEED_URL = process.env.MEDIUM_FEED_URL || "https://medium.com/feed/@antoniolamanna";
const OUT_PATH = new URL("../data/writing.json", import.meta.url);
const MANUAL_PATH = new URL("../data/writing-manual.json", import.meta.url);
const MAX_MEDIUM_ITEMS = 20;

function block(source, tag) {
  const escaped = tag.replace(":", "\\:");
  const re = new RegExp(`<${escaped}[^>]*>([\\s\\S]*?)</${escaped}>`, "i");
  const match = source.match(re);
  return match ? match[1] : "";
}

function allBlocks(source, tag) {
  const escaped = tag.replace(":", "\\:");
  const re = new RegExp(`<${escaped}[^>]*>([\\s\\S]*?)</${escaped}>`, "gi");
  return [...source.matchAll(re)].map((match) => match[1]);
}

function unwrapCdata(value = "") {
  const match = value.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
  return (match ? match[1] : value).trim();
}

function decodeEntities(value = "") {
  return value
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function stripHtml(html = "") {
  return decodeEntities(
    html
      .replace(/<figure[\s\S]*?<\/figure>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function firstImage(html = "") {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

function excerpt(text, max = 190) {
  if (!text) return "";
  if (text.length <= max) return text;
  return text.slice(0, max - 1).replace(/\s+\S*$/, "") + "…";
}

function normalizeUrl(url = "") {
  try {
    const parsed = new URL(url);
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return url;
  }
}

async function loadManual() {
  try {
    const content = await readFile(MANUAL_PATH, "utf8");
    const items = JSON.parse(content);
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

async function fetchMedium() {
  console.log(`Fetching Medium RSS: ${FEED_URL}`);
  const response = await fetch(FEED_URL, {
    headers: { "User-Agent": "antonio-lamanna-writing-sync/1.0" }
  });

  if (!response.ok) {
    console.warn(`Medium feed returned ${response.status}; keeping manual writing only.`);
    return [];
  }

  const xml = await response.text();

  return allBlocks(xml, "item").slice(0, MAX_MEDIUM_ITEMS).map((item) => {
    const content = unwrapCdata(block(item, "content:encoded"));
    return {
      title: decodeEntities(unwrapCdata(block(item, "title"))),
      source: "Medium",
      url: normalizeUrl(unwrapCdata(block(item, "link"))),
      date: unwrapCdata(block(item, "pubDate")),
      image: firstImage(content),
      excerpt: excerpt(stripHtml(content)),
      tags: allBlocks(item, "category")
        .map((tag) => decodeEntities(unwrapCdata(tag)))
        .slice(0, 4)
    };
  });
}

async function main() {
  const [manual, medium] = await Promise.all([loadManual(), fetchMedium()]);
  const byUrl = new Map();

  [...manual, ...medium].forEach((item) => {
    if (!item?.url || !item?.title) return;
    byUrl.set(normalizeUrl(item.url), { ...item, url: normalizeUrl(item.url) });
  });

  const merged = [...byUrl.values()].sort((a, b) => {
    const aDate = new Date(a.date || 0).getTime();
    const bDate = new Date(b.date || 0).getTime();
    return bDate - aDate;
  });

  await mkdir(dirname(fileURLToPath(OUT_PATH)), { recursive: true });
  await writeFile(OUT_PATH, JSON.stringify(merged, null, 2) + "\n", "utf8");
  console.log(`Wrote ${merged.length} items to data/writing.json`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
