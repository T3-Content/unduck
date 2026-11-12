// Rebuilds public/bangs.txt from DuckDuckGo's bang list plus scripts/custom-bangs.json.
// Run with `pnpm sync-bangs`, then commit the result.
//
// Output: one `trigger\tdomain\turl` line per bang, with a newline before the first line and
// after the last one, so `\n${trigger}\t` finds any bang with a plain string search.
import { readFile, writeFile } from "node:fs/promises";

const DDG = "https://duckduckgo.com";

const response = await fetch(`${DDG}/bang.js`);
if (!response.ok) throw new Error(`bang.js: HTTP ${response.status}`);
const ddg = await response.json();
const custom = JSON.parse(await readFile(new URL("./custom-bangs.json", import.meta.url), "utf8"));

// Custom bangs go first and win over DuckDuckGo's. The rest are ordered by popularity (`r`),
// so the top of the file holds the bangs that vite.config.ts inlines into index.html.
const lines = new Map();
for (const { t, d, u } of [...custom, ...ddg.sort((a, b) => b.r - a.r)]) {
  if (lines.has(t)) continue;
  // Some DuckDuckGo bangs are relative to duckduckgo.com and have no domain.
  const url = u.trim().replace(/^\/(?!\/)/, `${DDG}/`);
  const line = [t, d || new URL(url).hostname, url].join("\t");
  if (/\s/.test(t) || line.split(/[\t\n\r]/).length !== 3) throw new Error(`Bad bang: ${JSON.stringify({ t, d, u })}`);
  lines.set(t, line);
}

await writeFile(new URL("../public/bangs.txt", import.meta.url), `\n${[...lines.values()].join("\n")}\n`);
console.log(`Wrote ${lines.size} bangs (${custom.length} custom).`);
