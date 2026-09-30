import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const AUTHOR = process.env.ARXIV_AUTHOR || "Antonio Lamanna";
const OUT_PATH = new URL("../data/arxiv.json", import.meta.url);
const API_URL = new URL("https://export.arxiv.org/api/query");

API_URL.searchParams.set("search_query", `au:"${AUTHOR}"`);
API_URL.searchParams.set("start", "0");
API_URL.searchParams.set("max_results", "50");
API_URL.searchParams.set("sortBy", "submittedDate");
API_URL.searchParams.set("sortOrder", "descending");

function allBlocks(source, tag) {
  const escaped = tag.replace(":", "\\:");
  const re = new RegExp(`<${escaped}[^>]*>([\\s\\S]*?)</${escaped}>`, "gi");
  return [...source.matchAll(re)].map((match) => match[1]);
}

function block(source, tag) {
  return allBlocks(source, tag)[0] || "";
}

function text(value = "") {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function categoryTerms(entry = "") {
  const re = /<category[^>]+term=["']([^"']+)["'][^>]*\/?\s*>/gi;
  return [...entry.matchAll(re)].map((m) => m[1]);
}

function authorNames(entry = "") {
  return allBlocks(entry, "author")
    .map((author) => text(block(author, "name")))
    .filter(Boolean);
}

function shorten(value = "", max = 260) {
  if (value.length <= max) return value;
  return value.slice(0, max - 1).replace(/\s+\S*$/, "") + "…";
}

async function main() {
  console.log(`Fetching arXiv for author: ${AUTHOR}`);

  const response = await fetch(API_URL, {
    headers: {
      "User-Agent": "antonio-lamanna.github.io/1.0 (personal publication index)"
    }
  });

  if (!response.ok) {
    throw new Error(`arXiv request failed: ${response.status}`);
  }

  const xml = await response.text();

  const papers = allBlocks(xml, "entry")
    .filter((entry) => authorNames(entry).some((name) => name.toLowerCase() === AUTHOR.toLowerCase()))
    .map((entry) => {
      const id = text(block(entry, "id"));
      const absUrl = id.replace(/^http:/, "https:").replace("export.arxiv.org", "arxiv.org");

      return {
        title: text(block(entry, "title")),
        url: absUrl,
        date: text(block(entry, "published")),
        summary: shorten(text(block(entry, "summary"))),
        categories: categoryTerms(entry).slice(0, 5)
      };
    });

  await mkdir(dirname(fileURLToPath(OUT_PATH)), { recursive: true });
  await writeFile(OUT_PATH, JSON.stringify(papers, null, 2) + "\n", "utf8");

  console.log(`Wrote ${papers.length} arXiv paper(s) to data/arxiv.json`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
