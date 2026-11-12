import { readFile } from "node:fs/promises";
import { build, defineConfig, type Plugin } from "vite";
import { VitePWA } from "vite-plugin-pwa";

/** How many of the most popular bangs go inline into index.html. The others need public/bangs.txt. */
const HOT_BANG_COUNT = 150;

/**
 * Bundles src/redirect.ts and puts it inline at the `<!--inline-redirect-->` marker in
 * index.html, so a search redirects before the browser loads anything else.
 */
function inlineRedirect(): Plugin {
  return {
    name: "inline-redirect",
    async transformIndexHtml(html) {
      // The table starts with a newline, so this keeps the format that resolve.ts expects.
      const table = await readFile("public/bangs.txt", "utf8");
      const hotBangs = `${table.split("\n", HOT_BANG_COUNT + 1).join("\n")}\n`;

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

      // A function replacement, because the code contains `$` patterns.
      return html.replace("<!--inline-redirect-->", () => `<script>${chunk.code}</script>`);
    },
  };
}

export default defineConfig({
  plugins: [
    inlineRedirect(),
    VitePWA({
      registerType: "autoUpdate",
      // bangs.txt must be in the precache, or each rare bang needs the network.
      workbox: { globPatterns: ["**/*.{js,css,html,txt}"] },
    }),
  ],
});
