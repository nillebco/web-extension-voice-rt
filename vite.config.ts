import { defineConfig } from "vite";
import webExtension, { readJsonFile } from "vite-plugin-web-extension";
import { resolve } from 'path';

function generateManifest() {
  const manifest = readJsonFile("manifest.json");
  const pkg = readJsonFile("package.json");  
  return {
    description: pkg.description,
    version: pkg.version,
    ...manifest,
  };
}

export default defineConfig({
  build: {
    outDir: 'dist/chrome',
  },
  resolve: {
    alias: {
      // Create an alias to make imports more reliable
      '@polyfill': resolve(__dirname, './polyfill.js')
    }
  },
  plugins: [
    webExtension({
      manifest: generateManifest,
      watchFilePaths: ["package.json", "manifest.json"],
    }),
  ],
});
