import {buildSitemapXml} from '../src/lib/sitemap';
import {createSwimHoleStore} from '../server/storage';

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
  async fetch(request: Request) {
    try {
      const holes = await createSwimHoleStore().list();
      return new Response(buildSitemapXml(getSiteUrl(request), holes), {
        headers: {
          'content-type': 'application/xml; charset=utf-8',
          'cache-control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      });
    } catch (error) {
      return new Response(
        error instanceof Error ? error.message : 'Unable to build sitemap.',
        {
          status: 500,
          headers: {'content-type': 'text/plain; charset=utf-8'},
        },
      );
    }
  },
};
