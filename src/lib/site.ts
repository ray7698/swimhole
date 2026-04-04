import type {SwimHole} from '../types/swim-hole';

export type Page = 'home' | 'directory' | 'detail' | 'region' | 'city' | 'about' | 'not-found';

export type Route = {
  page: Page;
  holeId: number | null;
  regionSlug?: string | null;
  citySlug?: string | null;
};

export type SeoPayload = {
  title: string;
  description: string;
  canonicalPath: string;
  ogType: 'website' | 'article';
  structuredData: object;
};

export type RegionRecord = {
  country: string;
  countrySlug: string;
  region: string;
  regionSlug: string;
  holes: SwimHole[];
};

export type CityRecord = {
  country: string;
  countrySlug: string;
  region: string;
  regionSlug: string;
  city: string;
  citySlug: string;
  holes: SwimHole[];
};

export function absoluteUrl(path: string, siteUrl: string) {
  return new URL(path, siteUrl).toString();
}

export function getPathForPage(page: Exclude<Page, 'detail' | 'region' | 'city' | 'not-found'>) {
  switch (page) {
    case 'home':
      return '/';
    case 'directory':
      return '/directory';
    case 'about':
      return '/about';
  }
}

export function getPathForHole(hole: SwimHole) {
  return `/places/${hole.slug}`;
}

export function getPathForRegion(region: Pick<SwimHole, 'countrySlug' | 'regionSlug'>) {
  return `/countries/${region.countrySlug}/regions/${region.regionSlug}`;
}

export function getPathForCity(city: Pick<SwimHole, 'countrySlug' | 'regionSlug' | 'citySlug'>) {
  return `/countries/${city.countrySlug}/regions/${city.regionSlug}/cities/${city.citySlug}`;
}

export function getRegions(holes: SwimHole[]): RegionRecord[] {
  const regionMap = new Map<string, RegionRecord>();

  for (const hole of holes) {
    const key = `${hole.countrySlug}:${hole.regionSlug}`;
    const existing = regionMap.get(key);

    if (existing) {
      existing.holes.push(hole);
      continue;
    }

    regionMap.set(key, {
      country: hole.country,
      countrySlug: hole.countrySlug,
      region: hole.region,
      regionSlug: hole.regionSlug,
      holes: [hole],
    });
  }

  return [...regionMap.values()].sort((a, b) => a.region.localeCompare(b.region));
}

export function getCities(holes: SwimHole[]): CityRecord[] {
  const cityMap = new Map<string, CityRecord>();

  for (const hole of holes) {
    const key = `${hole.countrySlug}:${hole.regionSlug}:${hole.citySlug}`;
    const existing = cityMap.get(key);

    if (existing) {
      existing.holes.push(hole);
      continue;
    }

    cityMap.set(key, {
      country: hole.country,
      countrySlug: hole.countrySlug,
      region: hole.region,
      regionSlug: hole.regionSlug,
      city: hole.city,
      citySlug: hole.citySlug,
      holes: [hole],
    });
  }

  return [...cityMap.values()].sort((a, b) => a.city.localeCompare(b.city));
}

export function getRegionBySlug(countrySlug: string, regionSlug: string, holes: SwimHole[]) {
  return getRegions(holes).find((region) => region.countrySlug === countrySlug && region.regionSlug === regionSlug) ?? null;
}

export function getCityBySlug(countrySlug: string, regionSlug: string, citySlug: string, holes: SwimHole[]) {
  return getCities(holes).find((city) => city.countrySlug === countrySlug && city.regionSlug === regionSlug && city.citySlug === citySlug) ?? null;
}

export function getRouteFromPathname(pathname: string, holes: SwimHole[]): Route {
  if (pathname === '/' || pathname === '') {
    return {page: 'home', holeId: null};
  }

  if (pathname === '/directory') {
    return {page: 'directory', holeId: null};
  }

  if (pathname === '/about') {
    return {page: 'about', holeId: null};
  }

  if (pathname.startsWith('/places/')) {
    const slug = pathname.slice('/places/'.length).replace(/\/$/, '');
    const hole = holes.find((item) => item.slug === slug);
    return hole ? {page: 'detail', holeId: hole.id} : {page: 'not-found', holeId: null};
  }

  const cityMatch = pathname.match(/^\/countries\/([^/]+)\/regions\/([^/]+)\/cities\/([^/]+)\/?$/);
  if (cityMatch) {
    const [, countrySlug, regionSlug, citySlug] = cityMatch;
    return getCityBySlug(countrySlug, regionSlug, citySlug, holes)
      ? {page: 'city', holeId: null, regionSlug, citySlug}
      : {page: 'not-found', holeId: null};
  }

  const regionMatch = pathname.match(/^\/countries\/([^/]+)\/regions\/([^/]+)\/?$/);
  if (regionMatch) {
    const [, countrySlug, regionSlug] = regionMatch;
    return getRegionBySlug(countrySlug, regionSlug, holes)
      ? {page: 'region', holeId: null, regionSlug}
      : {page: 'not-found', holeId: null};
  }

  return {page: 'not-found', holeId: null};
}

export function getHoleByRoute(route: Route, holes: SwimHole[]) {
  return holes.find((hole) => hole.id === route.holeId) ?? null;
}

export function getRegionByRoute(route: Route, holes: SwimHole[]) {
  if (!route.regionSlug) {
    return null;
  }

  return getRegions(holes).find((region) => region.regionSlug === route.regionSlug) ?? null;
}

export function getCityByRoute(route: Route, holes: SwimHole[]) {
  if (!route.regionSlug || !route.citySlug) {
    return null;
  }

  return getCities(holes).find((city) => city.regionSlug === route.regionSlug && city.citySlug === route.citySlug) ?? null;
}

export function buildSeoPayload(route: Route, selectedHole: SwimHole | null, siteUrl: string, holes: SwimHole[]): SeoPayload {
  const region = getRegionByRoute(route, holes);
  const city = getCityByRoute(route, holes);

  let title = "SwimHoles - Discover America's Most Beautiful Swimming Holes";
  let description = 'Find the best natural swimming holes across the United States.';
  let canonicalPath = '/';
  let ogType: 'website' | 'article' = 'website';
  let structuredData: object = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'SwimHoles',
    url: absoluteUrl('/', siteUrl),
  };

  if (route.page === 'directory') {
    title = 'SwimHoles - Directory of Swimming Holes';
    description = 'Browse swimming holes by state, difficulty, and features like cliff jumping or free entry.';
    canonicalPath = '/directory';
    structuredData = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'SwimHoles Directory',
      url: absoluteUrl('/directory', siteUrl),
      description,
    };
  }

  if (route.page === 'region' && region) {
    title = `${region.region} Swimming Holes - SwimHoles`;
    description = `Explore swimming holes in ${region.region}, ${region.country}. Discover spots, directions, and trip details.`;
    canonicalPath = getPathForRegion(region);
    structuredData = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `${region.region} Swimming Holes`,
      url: absoluteUrl(canonicalPath, siteUrl),
      description,
    };
  }

  if (route.page === 'city' && city) {
    title = `${city.city} Swimming Holes - SwimHoles`;
    description = `Explore swimming holes near ${city.city}, ${city.region}. Find local wild swim spots and trip information.`;
    canonicalPath = getPathForCity(city);
    structuredData = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `${city.city} Swimming Holes`,
      url: absoluteUrl(canonicalPath, siteUrl),
      description,
    };
  }

  if (route.page === 'about') {
    title = 'SwimHoles - About';
    description = 'Learn about SwimHoles and our mission to help people discover beautiful natural swimming spots.';
    canonicalPath = '/about';
    structuredData = {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: 'About SwimHoles',
      url: absoluteUrl('/about', siteUrl),
      description,
    };
  }

  if (route.page === 'detail' && selectedHole) {
    title = `${selectedHole.name} - SwimHoles`;
    description = selectedHole.description;
    canonicalPath = getPathForHole(selectedHole);
    ogType = 'article';
    const [latitude, longitude] = selectedHole.coordinates.split(',').map((item) => Number(item.trim()));
    structuredData = {
      '@context': 'https://schema.org',
      '@type': 'TouristAttraction',
      name: selectedHole.name,
      description: selectedHole.description,
      address: {
        '@type': 'PostalAddress',
        addressLocality: selectedHole.city,
        addressRegion: selectedHole.region,
        addressCountry: selectedHole.country,
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude,
        longitude,
      },
      url: absoluteUrl(getPathForHole(selectedHole), siteUrl),
    };
  }

  if (route.page === 'not-found') {
    title = 'SwimHoles - Page Not Found';
    description = 'The page you are looking for could not be found.';
    canonicalPath = '/404';
    structuredData = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Page Not Found',
      url: absoluteUrl('/404', siteUrl),
      description,
    };
  }

  return {title, description, canonicalPath, ogType, structuredData};
}

export function getPrerenderPaths(holes: SwimHole[]) {
  return [
    '/',
    '/directory',
    '/about',
    '/404',
    ...getRegions(holes).map((region) => getPathForRegion(region)),
    ...getCities(holes).map((city) => getPathForCity(city)),
    ...holes.map((hole) => getPathForHole(hole)),
  ];
}
