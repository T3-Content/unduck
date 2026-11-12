import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveRedirect } from "./resolve.ts";

const table = [
  "",
  "g\twww.google.com\thttps://www.google.com/search?q={{{s}}}",
  "gh\tgithub.com\thttps://github.com/search?q={{{s}}}",
  "ghr\tgithub.com\thttps://github.com/{{{s}}}",
  "",
].join("\n");
const hot = table.slice(0, table.indexOf("\nghr\t") + 1);

const resolve = (query: string, defaultTrigger = "g") => resolveRedirect(query, defaultTrigger, table, true);

test("a search without a bang uses the default bang", () => {
  assert.equal(resolve("hello world"), "https://www.google.com/search?q=hello%20world");
  assert.equal(resolve("hello", "gh"), "https://github.com/search?q=hello");
  assert.equal(resolve("hello", "not-a-bang"), "https://www.google.com/search?q=hello");
});

test("a bang works at any position and is removed from the search", () => {
  assert.equal(resolve("!gh unduck"), "https://github.com/search?q=unduck");
  assert.equal(resolve("t3 !gh unduck"), "https://github.com/search?q=t3%20unduck");
  assert.equal(resolve("unduck !GH"), "https://github.com/search?q=unduck");
});

test("a bang alone opens the site", () => {
  assert.equal(resolve("!gh"), "https://github.com");
});

test("slashes stay readable", () => {
  assert.equal(resolve("!ghr t3dotgg/unduck"), "https://github.com/t3dotgg/unduck");
});

test("an unknown bang stays in the search", () => {
  assert.equal(resolve("css !important"), "https://www.google.com/search?q=css%20!important");
});

test("a bang inside a word is not a bang", () => {
  assert.equal(resolve("Wacatac.B!gh"), "https://www.google.com/search?q=Wacatac.B!gh");
});

test("a partial table answers only what it knows", () => {
  assert.equal(resolveRedirect("!gh unduck", "g", hot, false), "https://github.com/search?q=unduck");
  assert.equal(resolveRedirect("hello", "g", hot, false), "https://www.google.com/search?q=hello");
  assert.equal(resolveRedirect("!ghr t3dotgg/unduck", "g", hot, false), undefined);
  assert.equal(resolveRedirect("hello", "ghr", hot, false), undefined);
});
