import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
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
});

test("a bang alone opens the site over https", () => {
  assert.equal(resolve("!gh"), "https://github.com");
  assert.equal(resolve("!m"), "https://maps.google.com");
  assert.equal(resolve("!mc"), "https://minecraft.wiki");
  assert.equal(resolve("!qs"), "https://example.com");
  assert.equal(resolve("!hash"), "https://example.org");
  assert.equal(resolve("!bare"), "https://plain.example");
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

test("public/bangs.txt resolves popular https and http bangs", () => {
  const fullTable = readFileSync(new URL("../public/bangs.txt", import.meta.url), "utf8");
  const hotTable = `${fullTable.split("\n", 301).join("\n")}\n`;
  assert.equal(resolveRedirect("!t3 hello", "g", hotTable, false), "https://www.t3.chat/new?q=hello");
  assert.equal(resolveRedirect("!t3", "g", hotTable, false), "https://www.t3.chat");
  assert.equal(resolveRedirect("!npmx vite", "g", hotTable, false), "https://npmx.dev/search?q=vite");
  assert.equal(resolveRedirect("!pypi httpx", "g", hotTable, false), "https://pypi.org/search/?q=httpx");
  assert.equal(resolveRedirect("!py asyncio", "g", hotTable, false), "https://docs.python.org/3/search.html?q=asyncio");
  assert.equal(resolveRedirect("!docker node", "g", hotTable, false), "https://store.docker.com/search?q=node");
  assert.equal(resolveRedirect("!so typescript", "g", hotTable, false), "http://stackoverflow.com/search?q=typescript");
  assert.equal(resolveRedirect("!so", "g", hotTable, false), "https://stackoverflow.com");
  assert.equal(resolveRedirect("!minecraft", "g", hotTable, false), "https://minecraft.wiki");
  assert.equal(resolveRedirect("!minecraft", "g", fullTable, true), "https://minecraft.wiki");
});
