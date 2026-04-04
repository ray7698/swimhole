import type {IncomingMessage, ServerResponse} from 'node:http';

function getSiteUrl(req: IncomingMessage) {
  const envSiteUrl = process.env.SITE_URL || process.env.VITE_SITE_URL || process.env.APP_URL;
  if (envSiteUrl) {
    return envSiteUrl;
  }

  const host = req.headers.host || 'localhost';
  const proto = (req.headers['x-forwarded-proto'] as string | undefined) || 'https';
  return `${proto}://${host}`;
}

export default function handler(req: IncomingMessage, res: ServerResponse) {
  const siteUrl = getSiteUrl(req);

  res.statusCode = 200;
  res.setHeader('content-type', 'text/plain; charset=utf-8');
  res.setHeader('cache-control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.end(`User-agent: *
Allow: /

Sitemap: ${new URL('/sitemap.xml', siteUrl).toString()}
`);
}
