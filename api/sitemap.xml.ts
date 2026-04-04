import type {IncomingMessage, ServerResponse} from 'node:http';
import {buildSitemapXml} from '../src/lib/sitemap.js';
import {createSwimHoleStore} from './_lib/storage.js';

function getSiteUrl(req: IncomingMessage) {
  const envSiteUrl = process.env.SITE_URL || process.env.VITE_SITE_URL || process.env.APP_URL;
  if (envSiteUrl) {
    return envSiteUrl;
  }

  const host = req.headers.host || 'localhost';
  const proto = (req.headers['x-forwarded-proto'] as string | undefined) || 'https';
  return `${proto}://${host}`;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const holes = await createSwimHoleStore().list();
    res.statusCode = 200;
    res.setHeader('content-type', 'application/xml; charset=utf-8');
    res.setHeader('cache-control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.end(buildSitemapXml(getSiteUrl(req), holes));
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('content-type', 'text/plain; charset=utf-8');
    res.end(error instanceof Error ? error.message : 'Unable to build sitemap.');
  }
}
