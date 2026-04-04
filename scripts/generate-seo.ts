import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import {buildSitemapXml} from '../src/lib/sitemap';
import {createSwimHoleStore} from '../server/storage';

dotenv.config();

const siteUrl = process.env.SITE_URL || process.env.VITE_SITE_URL || process.env.APP_URL || 'https://www.swimholes.com';
const publicDir = path.resolve('public');

async function main() {
  const holes = await createSwimHoleStore().list();
  const sitemap = buildSitemapXml(siteUrl, holes);

  const robots = `User-agent: *
Allow: /

Sitemap: ${new URL('/sitemap.xml', siteUrl).toString()}
`;

  fs.mkdirSync(publicDir, {recursive: true});
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemap, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'robots.txt'), robots, 'utf8');
  console.log('Generated SEO files for current database-backed routes.');
}

void main();
