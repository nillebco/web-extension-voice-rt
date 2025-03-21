import { defineConfig } from "vite";
import webExtension, { readJsonFile } from "vite-plugin-web-extension";
import { resolve } from 'path';

function generateManifest() {
  const manifest = readJsonFile("manifest.json");
  const pkg = readJsonFile("package.json");
  
  // Process template variables
  const processedManifest = JSON.parse(
    JSON.stringify(manifest)
      .replace(/{{chrome}}/g, '')
      .replace(/{{firefox}}/g, '')
  );
  
  return {
    description: pkg.description,
    version: pkg.version,
    ...processedManifest,
  };
}

export default defineConfig({
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
      // Explicitly include the polyfill in the bundle
      webExtConfig: {
        chromiumManifest: {
          // Process chrome-specific manifest settings
        },
        firefoxManifest: {
          // Process firefox-specific manifest settings
        }
      }
    }),
  ],
});
