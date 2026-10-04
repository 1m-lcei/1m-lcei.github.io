import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://1m-lcei.github.io",
  base: "/kei-pinboard",
  output: "static",
  trailingSlash: "always",
  devToolbar: { enabled: false },
  markdown: {
    shikiConfig: { theme: "github-light" },
  },
});
