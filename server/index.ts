import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import express from 'express';
import {buildSitemapXml} from '../src/lib/sitemap';
import {createSwimHoleStore} from './storage';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 8787);
const distDir = path.resolve('dist');
const store = createSwimHoleStore();
const siteUrl =
  process.env.SITE_URL || process.env.VITE_SITE_URL || process.env.APP_URL || `http://localhost:${port}`;

function buildRobotsTxt() {
  return `User-agent: *
Allow: /

Sitemap: ${new URL('/sitemap.xml', siteUrl).toString()}
`;
}

app.get('/api/swim-holes', async (_request, response) => {
  try {
    response.json(await store.list());
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : 'Unable to load swim holes.',
    });
  }
});

app.get('/sitemap.xml', async (_request, response) => {
  try {
    const holes = await store.list();
    response.type('application/xml').send(buildSitemapXml(siteUrl, holes));
  } catch (error) {
    response.status(500).type('text/plain').send(error instanceof Error ? error.message : 'Unable to build sitemap.');
  }
});

app.get('/robots.txt', (_request, response) => {
  response.type('text/plain').send(buildRobotsTxt());
});

if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (request, response, next) => {
    if (request.path.startsWith('/api/')) {
      next();
      return;
    }

    response.sendFile(path.join(distDir, 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`SwimHoles site running on http://localhost:${port}`);
});
