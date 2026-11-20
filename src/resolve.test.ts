import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import { buildInlineRedirect, HOT_BANG_COUNT } from "../vite.config.ts";
import { resolveRedirect } from "./resolve.ts";

const table = [
  "",
  "g\twww.google.com/search?q=>",
  "gh\tgithub.com/search?q=>",
  "m\t:maps.google.com/maps?q=>",
  "ghr\tgithub.com/>",
  "mc\t:minecraft.wiki?search=>",
  "qs\texample.com?next=/home&q=>",
  "hash\texample.org#q=>",
  "bare\t:plain.example",
  "sub\t:>.rtfd.io",
  "mid\t:www.>.hypestat.com/",
  "pref\tsub.foo>.example.com/p",
  "multi\texample.net/a=>&b=>",
  "static\tduckduckgo.com/newbang",
  "",
].join("\n");
const hot = table.slice(0, table.indexOf("\nghr\t") + 1);

const resolve = (query: string, defaultTrigger = "g") => resolveRedirect(query, defaultTrigger, table, true);

test("a search without a bang uses the default bang", () => {
  assert.equal(resolve("hello world"), "https://www.google.com/search?q=hello%20world");
  assert.equal(resolve("hello", "gh"), "https://github.com/search?q=hello");
  assert.equal(resolve("hello", "m"), "http://maps.google.com/maps?q=hello");
  assert.equal(resolve("hello", "not-a-bang"), "https://www.google.com/search?q=hello");
});

test("a bang works at any position and is removed from the search", () => {
  assert.equal(resolve("!gh unduck"), "https://github.com/search?q=unduck");
  assert.equal(resolve("t3 !gh unduck"), "https://github.com/search?q=t3%20unduck");
  assert.equal(resolve("unduck !GH"), "https://github.com/search?q=unduck");
});

test("http:// and https:// search URLs keep their scheme", () => {
  assert.equal(resolve("!gh unduck"), "https://github.com/search?q=unduck");
  assert.equal(resolve("!m new york"), "http://maps.google.com/maps?q=new%20york");
  assert.equal(resolve("!mc redstone"), "http://minecraft.wiki?search=redstone");
  assert.equal(resolve("!sub requests"), "http://requests.rtfd.io");
  assert.equal(resolve("!mid example.com"), "http://www.example.com.hypestat.com/");
});

test("a bang alone opens the site over https", () => {
  assert.equal(resolve("!gh"), "https://github.com");
  assert.equal(resolve("!m"), "https://maps.google.com");
  assert.equal(resolve("!mc"), "https://minecraft.wiki");
  assert.equal(resolve("!qs"), "https://example.com");
  assert.equal(resolve("!hash"), "https://example.org");
  assert.equal(resolve("!bare"), "https://plain.example");
  assert.equal(resolve("!sub"), "https://rtfd.io");
  assert.equal(resolve("!mid"), "https://www.hypestat.com");
  assert.equal(resolve("!pref"), "https://sub.example.com");
});

test("slashes stay readable and special characters are encoded safely", () => {
  assert.equal(resolve("!ghr t3dotgg/unduck"), "https://github.com/t3dotgg/unduck");
  assert.equal(resolve("!g a > b $&"), "https://www.google.com/search?q=a%20%3E%20b%20%24%26");
});

test("multiple and zero placeholders work", () => {
  assert.equal(resolve("!multi foo bar"), "https://example.net/a=foo%20bar&b=foo%20bar");
  assert.equal(resolve("!static ignored"), "https://duckduckgo.com/newbang");
  assert.equal(resolve("!static"), "https://duckduckgo.com");
});

test("an unknown bang stays in the search", () => {
  assert.equal(resolve("css !important"), "https://www.google.com/search?q=css%20!important");
});

test("a bang inside a word is not a bang", () => {
  assert.equal(resolve("Wacatac.B!gh"), "https://www.google.com/search?q=Wacatac.B!gh");
});

test("a partial table answers only what it knows", () => {
  assert.equal(resolveRedirect("!gh unduck", "g", hot, false), "https://github.com/search?q=unduck");
  assert.equal(resolveRedirect("!m nyc", "g", hot, false), "http://maps.google.com/maps?q=nyc");
  assert.equal(resolveRedirect("!m", "g", hot, false), "https://maps.google.com");
  assert.equal(resolveRedirect("hello", "g", hot, false), "https://www.google.com/search?q=hello");
  assert.equal(resolveRedirect("!ghr t3dotgg/unduck", "g", hot, false), undefined);
  assert.equal(resolveRedirect("!ghr", "g", hot, false), undefined);
  assert.equal(resolveRedirect("hello", "ghr", hot, false), undefined);
});

test("public/bangs-v2.txt satisfies compact format invariants", () => {
  const fullTable = readFileSync(new URL("../public/bangs-v2.txt", import.meta.url), "utf8");
  assert.ok(fullTable.startsWith("\n") && fullTable.endsWith("\n"));
  assert.equal(fullTable.includes("<"), false);

  const rows = fullTable.slice(1, -1).split("\n");
  assert.ok(rows.length > HOT_BANG_COUNT);
  for (const row of rows) {
    const parts = row.split("\t");
    assert.equal(parts.length, 2, `Expected 2 columns: ${row}`);
    const [trigger, template] = parts;
    assert.ok(trigger && !/\s/.test(trigger), `Invalid trigger: ${row}`);
    assert.ok(!/^https?:\/\//i.test(template), `Uncompacted scheme: ${row}`);
    assert.ok(!template.includes("{{{s}}}"), `Uncompacted placeholder: ${row}`);
    const isHttp = template[0] === ":";
    const rest = isHttp ? template.slice(1) : template;
    const end = rest.search(/[/?#]/);
    const authority = end === -1 ? rest : rest.slice(0, end);
    const parsed = new URL(`${isHttp ? "http" : "https"}://${rest.replace(/>/g, "{{{s}}}")}`);
    assert.equal(authority.toLowerCase(), parsed.host.replace(/\{\{\{s\}\}\}/g, ">"), `Ambiguous authority: ${row}`);
    const host = authority
      .split(".")
      .filter((label) => !label.includes(">"))
      .join(".");
    assert.ok(host.length > 0, `Empty bare host: ${row}`);
  }

  assert.equal(resolveRedirect("!dauser", "g", fullTable, true), "https://deviantart.com");
  assert.equal(resolveRedirect("!wpblog", "g", fullTable, true), "https://wordpress.com");
  assert.equal(resolveRedirect("!rtfd", "g", fullTable, true), "https://rtfd.io");
  assert.equal(resolveRedirect("!tor", "g", fullTable, true), "https://tor2web.org");
  assert.equal(resolveRedirect("!hypestat", "g", fullTable, true), "https://www.hypestat.com");
  assert.equal(resolveRedirect("!minecraft", "g", fullTable, true), "https://minecraft.wiki");
});

test("built inline redirect handles hot bangs without fetch and cold bangs via /bangs-v2.txt", async () => {
  const fullTable = readFileSync(new URL("../public/bangs-v2.txt", import.meta.url), "utf8");
  const code = await buildInlineRedirect();
  assert.equal(/<!--|<\/?script/i.test(code), false);

  async function runInline(query: string) {
    let redirected: string | undefined;
    const fetched: string[] = [];
    let pendingFetch: Promise<void> | undefined;

    const sandbox = {
      URLSearchParams,
      location: {
        hostname: "example.test",
        origin: "https://example.test",
        search: `?q=${encodeURIComponent(query)}`,
        replace(url: string) {
          redirected = url;
        },
      },
      localStorage: { getItem: () => null },
      document: { referrer: "" },
      navigator: { sendBeacon: () => true },
      fetch(url: string) {
        fetched.push(url);
        let resolveDone!: () => void;
        pendingFetch = new Promise((r) => {
          resolveDone = r;
        });
        return Promise.resolve({
          ok: true,
          text: () => {
            queueMicrotask(resolveDone);
            return Promise.resolve(fullTable);
          },
        });
      },
    };
    vm.runInNewContext(code, sandbox);
    if (pendingFetch) {
      await pendingFetch;
      await new Promise((r) => setImmediate(r));
    }
    return { redirected, fetched };
  }

  // Row #270 (`!so`) is the last hot bang and must redirect without fetching.
  const hotSearch = await runInline("!so typescript");
  assert.equal(hotSearch.redirected, "http://stackoverflow.com/search?q=typescript");
  assert.deepEqual(hotSearch.fetched, []);

  const hotBare = await runInline("!gh");
  assert.equal(hotBare.redirected, "https://github.com");
  assert.deepEqual(hotBare.fetched, []);

  // Row #271 (first cold bang past HOT_BANG_COUNT) must fetch `/bangs-v2.txt`.
  const firstColdTrigger = fullTable.slice(1, -1).split("\n")[HOT_BANG_COUNT].split("\t")[0];
  const expectedCold = resolveRedirect(`!${firstColdTrigger} test`, "g", fullTable, true);
  const coldSearch = await runInline(`!${firstColdTrigger} test`);
  assert.equal(coldSearch.redirected, expectedCold);
  assert.deepEqual(coldSearch.fetched, ["/bangs-v2.txt"]);
});
