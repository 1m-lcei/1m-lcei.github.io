import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://1m-lcei.github.io/",
  base: "/",
  output: "static",
  trailingSlash: "always",
  devToolbar: { enabled: false },
  markdown: {
    shikiConfig: { theme: "github-light" },
  },
});
