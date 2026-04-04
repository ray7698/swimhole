import {getCities, getPathForCity, getPathForHole, getPathForRegion, getRegions} from './site';
import type {SwimHole} from '../types/swim-hole';

type SitemapEntry = {
  path: string;
  lastmod: string;
  changefreq: 'daily' | 'weekly' | 'monthly';
  priority: string;
};

function normalizeLastmod(value?: string) {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }

  return parsed.toISOString().slice(0, 10);
}

function mostRecentLastmod(holes: SwimHole[]) {
  const dates = holes
    .map((hole) => normalizeLastmod(hole.lastVerified))
    .sort((left, right) => right.localeCompare(left));

  return dates[0] || normalizeLastmod();
}

export function getSitemapEntries(holes: SwimHole[]): SitemapEntry[] {
  const regionEntries = getRegions(holes).map((region) => ({
    path: getPathForRegion(region),
    lastmod: mostRecentLastmod(region.holes),
    changefreq: 'weekly' as const,
    priority: '0.80',
  }));

  const cityEntries = getCities(holes).map((city) => ({
    path: getPathForCity(city),
    lastmod: mostRecentLastmod(city.holes),
    changefreq: 'weekly' as const,
    priority: '0.75',
  }));

  const placeEntries = holes.map((hole) => ({
    path: getPathForHole(hole),
    lastmod: normalizeLastmod(hole.lastVerified),
    changefreq: 'weekly' as const,
    priority: '0.90',
  }));

  return [
    {
      path: '/',
      lastmod: mostRecentLastmod(holes),
      changefreq: 'daily',
      priority: '1.00',
    },
    {
      path: '/directory',
      lastmod: mostRecentLastmod(holes),
      changefreq: 'daily',
      priority: '0.95',
    },
    {
      path: '/about',
      lastmod: normalizeLastmod(),
      changefreq: 'monthly',
      priority: '0.40',
    },
    ...regionEntries,
    ...cityEntries,
    ...placeEntries,
  ];
}

export function buildSitemapXml(siteUrl: string, holes: SwimHole[]) {
  const entries = getSitemapEntries(holes);

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (entry) => `  <url>
    <loc>${new URL(entry.path, siteUrl).toString()}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`;
}
