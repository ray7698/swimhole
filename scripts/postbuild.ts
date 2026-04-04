import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import React from 'react';
import {renderToString} from 'react-dom/server';
import App from '../src/App';
import {buildSitemapXml} from '../src/lib/sitemap';
import {buildSeoPayload, getHoleByRoute, getPrerenderPaths, getRouteFromPathname} from '../src/lib/site';
import {createSwimHoleStore} from '../server/storage';
import type {SwimHole} from '../src/types/swim-hole';

dotenv.config();

const siteUrl = process.env.SITE_URL || process.env.VITE_SITE_URL || process.env.APP_URL || 'https://www.swimholes.com';
const distDir = path.resolve('dist');
const baseHtmlPath = path.join(distDir, 'index.html');

function injectHtml(template: string, pathname: string, holes: SwimHole[]) {
  const route = getRouteFromPathname(pathname, holes);
  const hole = getHoleByRoute(route, holes);
  const seo = buildSeoPayload(route, hole, siteUrl, holes);
  const appHtml = renderToString(React.createElement(App, {initialHoles: holes, initialPath: pathname}));
  const structuredData = JSON.stringify(seo.structuredData).replace(/</g, '\\u003c');
  const serializedHoles = JSON.stringify(holes).replace(/</g, '\\u003c');
  const canonicalUrl = new URL(seo.canonicalPath, siteUrl).toString();

  return template
    .replace(/<title>.*?<\/title>/, `<title>${seo.title}</title>`)
    .replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${seo.description}" />`)
    .replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${seo.title}" />`)
    .replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${seo.description}" />`)
    .replace(/<meta property="og:type" content=".*?" \/>/, `<meta property="og:type" content="${seo.ogType}" />`)
    .replace(/<meta property="og:url" content=".*?" \/>/, `<meta property="og:url" content="${canonicalUrl}" />`)
    .replace(/<meta name="twitter:title" content=".*?" \/>/, `<meta name="twitter:title" content="${seo.title}" />`)
    .replace(/<meta name="twitter:description" content=".*?" \/>/, `<meta name="twitter:description" content="${seo.description}" />`)
    .replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="${canonicalUrl}" />`)
    .replace('</head>', `  <script id="route-structured-data" type="application/ld+json">${structuredData}</script>\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${appHtml}</div>\n    <script id="initial-catalog" type="application/json">${serializedHoles}</script>`);
}

function writeRouteHtml(template: string, pathname: string, holes: SwimHole[]) {
  const normalized = pathname === '/404' ? '/404.html' : pathname;
  const outputPath = normalized === '/' ? path.join(distDir, 'index.html') : normalized.endsWith('.html') ? path.join(distDir, normalized.slice(1)) : path.join(distDir, normalized.slice(1), 'index.html');
  fs.mkdirSync(path.dirname(outputPath), {recursive: true});
  fs.writeFileSync(outputPath, injectHtml(template, pathname, holes), 'utf8');
}

function writeSitemapAndRobots(holes: SwimHole[]) {
  const sitemap = buildSitemapXml(siteUrl, holes);
  const robots = `User-agent: *
Allow: /

Sitemap: ${new URL('/sitemap.xml', siteUrl).toString()}
`;
  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap, 'utf8');
  fs.writeFileSync(path.join(distDir, 'robots.txt'), robots, 'utf8');
}

async function main() {
  if (!fs.existsSync(baseHtmlPath)) throw new Error('dist/index.html not found. Run vite build before postbuild.');

  const template = fs.readFileSync(baseHtmlPath, 'utf8');
  const holes = await createSwimHoleStore().list();
  const routes = getPrerenderPaths(holes);

  for (const route of routes) {
    writeRouteHtml(template, route, holes);
  }

  writeSitemapAndRobots(holes);
  console.log(`Prerendered ${routes.length} routes from database records and generated sitemap/robots.`);
}

void main();
