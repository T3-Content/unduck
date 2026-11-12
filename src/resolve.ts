// Pure redirect logic. Bundled into the inline script in index.html, so keep it small.

/**
 * Finds a bang in a table made by scripts/sync-bangs.mjs: one `trigger\tdomain\turl` line
 * per bang, with a newline before the first line and after the last one.
 */
function findBang(table: string, trigger: string) {
  const start = table.indexOf(`\n${trigger}\t`);
  if (start === -1) return undefined;
  const [, domain, url] = table.slice(start + 1, table.indexOf("\n", start + 1)).split("\t");
  return { domain, url };
}

/**
 * Returns the URL that `query` redirects to.
 *
 * `table` is the full bang table, or only its first lines. With a partial table
 * (`isComplete` false), the result is `undefined` when the table cannot give the answer.
 */
export function resolveRedirect(query: string, defaultTrigger: string, table: string, isComplete: boolean) {
  // The first `!bang` that is a separate word. `Wacatac.B!ml` is not a bang.
  const match = query.match(/(?:^|\s)!(\S+)/);
  const bang = match && findBang(table, match[1].toLowerCase());
  if (match && !bang && !isComplete) return undefined;

  // An unknown bang stays in the query: `css !important` is a search for both words.
  const terms = bang ? (query.slice(0, match.index) + query.slice(match.index! + match[0].length)).trim() : query;
  const target = bang ?? findBang(table, defaultTrigger) ?? (isComplete ? findBang(table, "g") : undefined);
  if (!target) return undefined;

  // `!gh` alone opens github.com, not an empty search.
  if (!terms) return `https://${target.domain}`;
  // Keep `/` readable for formats like `!ghr t3dotgg/unduck`.
  return target.url.replace("{{{s}}}", encodeURIComponent(terms).replace(/%2F/g, "/"));
}
