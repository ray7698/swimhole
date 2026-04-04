export const config = {
  runtime: 'nodejs',
};

function getSiteUrl(request: Request) {
  const envSiteUrl = process.env.SITE_URL || process.env.VITE_SITE_URL || process.env.APP_URL;
  if (envSiteUrl) {
    return envSiteUrl;
  }

  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export default {
  fetch(request: Request) {
    const siteUrl = getSiteUrl(request);
    return new Response(
      `User-agent: *
Allow: /

Sitemap: ${new URL('/sitemap.xml', siteUrl).toString()}
`,
      {
        headers: {
          'content-type': 'text/plain; charset=utf-8',
          'cache-control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      },
    );
  },
};
