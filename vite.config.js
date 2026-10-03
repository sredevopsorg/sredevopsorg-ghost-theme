import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import ghostManifestPartials from "./lib/vite/ghost-manifest-partials.js";

export default defineConfig({
  // Ghost serves theme assets from a versioned path and can run under a subdirectory,
  // so asset URLs must stay relative.
  base: "./",

  // A theme has no public/ directory: everything static already lives under assets/.
  publicDir: false,

  build: {
    outDir: "assets/built",
    // Never emit assets/built/assets/** — GScan warns about the nested directory.
    assetsDir: ".",
    emptyOutDir: true,
    manifest: "manifest.json",
    sourcemap: false,
    rollupOptions: {
      input: "assets/js/index.js",
    },
  },

  plugins: [
    ghostManifestPartials(
      "assets/built/manifest.json",
      "partials/vite_assets/head.hbs",
      "partials/vite_assets/foot.hbs",
    ),
    tailwindcss(),
    // JSX for the islands in assets/js/islands/**. Components are code-split by
    // the registry in assets/js/islands.jsx, so this plugin adds no runtime by itself.
    react(),
  ],
});
