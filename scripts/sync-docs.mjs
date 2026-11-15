import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const webDistDir = path.resolve(rootDir, 'website/dist');
const docsDir = path.resolve(rootDir, 'docs');

function syncDocs() {
  if (!fs.existsSync(webDistDir)) {
    console.error(`[sync-docs] Error: Source directory does not exist: ${webDistDir}`);
    process.exit(1);
  }

  // Clean and prepare docs directory
  if (fs.existsSync(docsDir)) {
    fs.rmSync(docsDir, { recursive: true, force: true });
  }
  fs.mkdirSync(docsDir, { recursive: true });

  // Copy website/dist to docs/ recursively
  fs.cpSync(webDistDir, docsDir, { recursive: true, force: true });

  // Generate docs/404.html as exact duplicate of docs/index.html for GitHub Pages SPA client-side routing
  const indexHtmlPath = path.resolve(docsDir, 'index.html');
  const path404 = path.resolve(docsDir, '404.html');

  if (!fs.existsSync(indexHtmlPath)) {
    console.error(`[sync-docs] Error: index.html not found in ${docsDir}`);
    process.exit(1);
  }

  fs.copyFileSync(indexHtmlPath, path404);

  console.log('✅ [sync-docs] Successfully synchronized website/dist to docs/ and generated docs/404.html');
}

syncDocs();
