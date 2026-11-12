// Runs inline at the top of index.html (see vite.config.ts), before any other resource loads.
// Sends a search to its destination. Without a search, main.ts renders the homepage.
import { resolveRedirect } from "./resolve.ts";

if (location.hostname === "unduck.link") {
  // Plausible pageview. A beacon does not delay the redirect, and the search query is not sent.
  navigator.sendBeacon(
    "https://plausible.io/api/event",
    JSON.stringify({
      name: "pageview",
      url: `${location.origin}/`,
      domain: location.hostname,
      referrer: document.referrer || null,
    }),
  );
}

// Read the constant once: the build replaces each use with the full string.
const hotBangs = __HOT_BANGS__;
const query = new URLSearchParams(location.search).get("q")?.trim();

if (query) {
  const defaultTrigger = localStorage.getItem("default-bang") ?? "g";
  const redirect = (table: string, isComplete: boolean) => {
    const url = resolveRedirect(query, defaultTrigger, table, isComplete);
    if (url) location.replace(url);
    return url !== undefined;
  };

  // Popular bangs are inlined. For the others, scan the full table. If it does not load,
  // fall back to the default search engine.
  if (!redirect(hotBangs, false)) {
    fetch("/bangs.txt")
      .then((response) => (response.ok ? response.text() : hotBangs))
      .catch(() => hotBangs)
      .then((table) => redirect(table, true));
  }
}
