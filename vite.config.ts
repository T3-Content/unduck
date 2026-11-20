import { readFile } from "node:fs/promises";
import { build, defineConfig, type Plugin } from "vite";
import { VitePWA } from "vite-plugin-pwa";

/**
 * How many of the most popular bangs go inline into index.html. The others need public/bangs-v2.txt.
 * 270 includes !pypi (#154), !py (#177), !docker (#239), and !so (#270) while keeping
 * dist/index.html under 14 KB raw (~4.1 KB brotli).
 */
export const HOT_BANG_COUNT = 270;

/**
 * Bundles src/redirect.ts with the hot bang slice inlined.
 */
export async function buildInlineRedirect() {
  // The table starts with a newline, so this keeps the format that resolve.ts expects.
  const table = await readFile("public/bangs-v2.txt", "utf8");
  const hotBangs = `${table.split("\n", HOT_BANG_COUNT + 1).join("\n")}\n`;
  if (hotBangs.includes("<")) throw new Error("inline-redirect: hot bangs must not contain '<'");

  const result = await build({
    configFile: false,
    logLevel: "silent",
    publicDir: false,
    define: { __HOT_BANGS__: JSON.stringify(hotBangs) },
    build: {
      write: false,
      lib: { entry: "src/redirect.ts", formats: ["iife"], name: "redirect" },
    },
  });
  const [chunk] = [result].flat().flatMap((r) => ("output" in r ? r.output : []));
  if (chunk?.type !== "chunk") throw new Error("inline-redirect: no build output");
  if (/<!--|<\/?script/i.test(chunk.code)) throw new Error("inline-redirect: unsafe HTML token in script");
  return chunk.code;
}

/**
 * Puts the bundled src/redirect.ts inline at the `<!--inline-redirect-->` marker in
 * index.html, so a search redirects before the browser loads anything else.
 */
function inlineRedirect(): Plugin {
  return {
    name: "inline-redirect",
    async transformIndexHtml(html) {
      const code = await buildInlineRedirect();
      // A function replacement, because the code contains `$` patterns.
      return html.replace("<!--inline-redirect-->", () => `<script>${code}</script>`);
    },
  };
}

export default defineConfig({
  plugins: [
    inlineRedirect(),
    VitePWA({
      registerType: "autoUpdate",
      // bangs-v2.txt must be in the precache, or each rare bang needs the network.
      workbox: { globPatterns: ["**/*.{js,css,html,txt}"] },
    }),
  ],
});
