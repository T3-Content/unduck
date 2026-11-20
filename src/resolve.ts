// Pure redirect logic. Bundled into the inline script in index.html, so keep it small.

/**
 * Finds a bang in a table made by scripts/sync-bangs.mjs: one `trigger\ttemplate` line
 * per bang, with a newline before the first line and after the last one.
 *
 * `template` omits `https://` (prefixing `http://` with `:`) and uses `>` for `{{{s}}}`.
 */
function findBang(table: string, trigger: string) {
  const prefix = `\n${trigger}\t`;
  const start = table.indexOf(prefix);
  if (start === -1) return undefined;
  const valueStart = start + prefix.length;
  return table.slice(valueStart, table.indexOf("\n", valueStart));
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

  const isHttp = target[0] === ":";
  const rest = isHttp ? target.slice(1) : target;
  // `!gh` alone opens github.com, not an empty search.
  if (!terms) {
    const end = rest.search(/[/?#]/);
    return `https://${end === -1 ? rest : rest.slice(0, end)}`;
  }
  // Keep `/` readable for formats like `!ghr t3dotgg/unduck`.
  const encoded = encodeURIComponent(terms).replace(/%2F/g, "/");
  return `${isHttp ? "http" : "https"}://${rest.replace(/>/g, encoded)}`;
}
