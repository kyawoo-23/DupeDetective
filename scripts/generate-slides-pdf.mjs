import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');
const outPath = path.join(publicDir, 'dupe-detective-hackathon.pdf');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
};

const server = createServer((req, res) => {
  const pathname = (req.url ?? '/').split('?')[0];
  const rel = pathname === '/' ? 'hackathon-slides.html' : pathname.replace(/^\//, '');
  const filePath = path.resolve(publicDir, rel);
  if (!filePath.startsWith(publicDir) || !existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  const ext = path.extname(filePath);
  res.writeHead(200, { 'Content-Type': MIME[ext] ?? 'application/octet-stream' });
  res.end(readFileSync(filePath));
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const { port } = server.address();

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(`http://127.0.0.1:${port}/hackathon-slides.html`, {
    waitUntil: 'networkidle',
  });
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
  });
  await page.emulateMedia({ media: 'print' });
  await page.pdf({
    path: outPath,
    preferCSSPageSize: true,
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });
  console.log(`Wrote ${outPath}`);
} finally {
  await browser.close();
  server.close();
}
