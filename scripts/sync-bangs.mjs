// Rebuilds public/bangs-v2.txt from DuckDuckGo's bang list plus scripts/custom-bangs.json.
// Run with `pnpm sync-bangs`, then commit the result.
//
// Output: one `trigger\ttemplate` line per bang, with a newline before the first line and
// after the last one, so `\n${trigger}\t` finds any bang with a plain string search.
// `template` omits `https://` (prefixing `http://` with `:`) and replaces `{{{s}}}` with `>`.
import { readFile, writeFile } from "node:fs/promises";

const DDG = "https://duckduckgo.com";

const response = await fetch(`${DDG}/bang.js`);
if (!response.ok) throw new Error(`bang.js: HTTP ${response.status}`);
const ddg = await response.json();
const custom = JSON.parse(await readFile(new URL("./custom-bangs.json", import.meta.url), "utf8"));

// Custom bangs go first and win over DuckDuckGo's. The rest are ordered by popularity (`r`),
// so the top of the file holds the bangs that vite.config.ts inlines into index.html.
const lines = new Map();
for (const { t, u } of [...custom, ...ddg.sort((a, b) => b.r - a.r)]) {
  if (lines.has(t)) continue;
  // Some DuckDuckGo bangs are relative to duckduckgo.com and have no domain.
  const url = u.trim().replace(/^\/(?!\/)/, `${DDG}/`);
  if (!/^https?:\/\//i.test(url)) throw new Error(`Unsupported scheme: ${JSON.stringify({ t, u })}`);
  // Validate URL shape before compacting (still accepts `{{{s}}}` in hostnames).
  const parsed = new URL(url);
  if (parsed.username || parsed.password) {
    throw new Error(`Credentials not allowed: ${JSON.stringify({ t, u })}`);
  }
  const defaultPort = parsed.protocol === "http:" ? ":80" : ":443";
  let template = url
    .replace(/^https:\/\//i, "")
    .replace(/^http:\/\//i, ":")
    .replaceAll("<", "%3C")
    .replaceAll(">", "%3E")
    .replaceAll("{{{s}}}", ">");
  // Verify the resolver's fast string slicing matches the parsed scheme/host and yields a bare host.
  const isHttp = template[0] === ":";
  if (isHttp !== (parsed.protocol === "http:")) {
    throw new Error(`Bad scheme marker: ${JSON.stringify({ t, u })}`);
  }
  const rest = isHttp ? template.slice(1) : template;
  const end = rest.search(/[/?#]/);
  let authority = end === -1 ? rest : rest.slice(0, end);
  const expectedHost = parsed.host.replaceAll("{{{s}}}", ">");
  // Strip redundant default ports so `:80` on http bangs never turns into `https://host:80`.
  if (authority.toLowerCase() === `${expectedHost}${defaultPort}`) {
    authority = authority.slice(0, -defaultPort.length);
    template = `${isHttp ? ":" : ""}${authority}${end === -1 ? "" : rest.slice(end)}`;
  }
  if (authority.toLowerCase() !== expectedHost) {
    throw new Error(`Ambiguous authority: ${JSON.stringify({ t, u })}`);
  }
  const bareHost = authority
    .split(".")
    .filter((label) => !label.includes(">"))
    .join(".");
  if (!bareHost) throw new Error(`No bare hostname: ${JSON.stringify({ t, u })}`);
  const line = `${t}\t${template}`;
  if (!t || /\s/.test(t) || line.split(/[\t\n\r]/).length !== 2) {
    throw new Error(`Bad bang: ${JSON.stringify({ t, u })}`);
  }
  lines.set(t, line);
}

await writeFile(new URL("../public/bangs-v2.txt", import.meta.url), `\n${[...lines.values()].join("\n")}\n`);
console.log(`Wrote ${lines.size} bangs (${custom.length} custom).`);
