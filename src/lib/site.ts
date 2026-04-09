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
  keywords?: string;
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

export function getRegionKeywords(region: string) {
  return [
    `swimming holes in ${region}`,
    `hidden swimming holes in ${region}`,
    `natural pools in ${region}`,
    `waterfalls you can swim in ${region}`,
    `${region} swimming holes`
  ];
}

export function getCityKeywords(city: string, region: string) {
  return [
    `swimming holes near ${city}`,
    `hidden swimming spots in ${city}`,
    `natural pools near ${city} ${region}`,
    `swimming near ${city}`,
    `best places to swim in ${city}`
  ];
}

export function getHoleKeywords(holeName: string, city: string, region: string) {
  return [
    `${holeName} swimming hole`,
    `swimming at ${holeName}`,
    `how to visit ${holeName}`,
    `${holeName} guide`,
    `${region} swimming holes`,
    `swimming near ${city}`
  ];
}

export function buildSeoPayload(route: Route, selectedHole: SwimHole | null, siteUrl: string, holes: SwimHole[]): SeoPayload {
  const region = getRegionByRoute(route, holes);
  const city = getCityByRoute(route, holes);
  const currentYear = new Date().getFullYear();

  let title = "SwimHoles - Discover America's Most Beautiful Swimming Holes";
  let description = 'Find the best natural swimming holes across the United States.';
  let canonicalPath = '/';
  let ogType: 'website' | 'article' = 'website';
  let keywords: string | undefined = undefined;
  
  const breadcrumbList: any = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: absoluteUrl('/', siteUrl),
      }
    ]
  };

  let structuredData: any = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'SwimHoles',
    url: absoluteUrl('/', siteUrl),
  };

  if (route.page === 'directory') {
    title = 'SwimHoles - Directory of Swimming Holes';
    description = 'Browse swimming holes by state, difficulty, and features like cliff jumping or free entry.';
    canonicalPath = '/directory';
    breadcrumbList.itemListElement.push({
      '@type': 'ListItem',
      position: 2,
      name: 'Directory',
      item: absoluteUrl('/directory', siteUrl),
    });
    structuredData = [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'SwimHoles Directory',
        url: absoluteUrl('/directory', siteUrl),
        description,
      },
      breadcrumbList
    ];
  }

  if (route.page === 'region' && region) {
    const kw = getRegionKeywords(region.region);
    keywords = kw.join(', ');
    title = `Best Swimming Holes in ${region.region} (${currentYear} Guide) | Hidden Spots & Natural Pools`;
    description = `Discover the best swimming holes in ${region.region}, including hidden spots, natural pools, and waterfalls you can swim in. Plan your perfect summer escape.`;
    canonicalPath = getPathForRegion(region);
    breadcrumbList.itemListElement.push({
      '@type': 'ListItem',
      position: 2,
      name: region.region,
      item: absoluteUrl(canonicalPath, siteUrl),
    });
    structuredData = [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `Best Swimming Holes in ${region.region}`,
        url: absoluteUrl(canonicalPath, siteUrl),
        description,
        keywords: keywords
      },
      breadcrumbList
    ];
  }

  if (route.page === 'city' && city) {
    const kw = getCityKeywords(city.city, city.region);
    keywords = kw.join(', ');
    title = `Best Swimming Holes Near ${city.city}, ${city.region} (${currentYear} Guide) | Hidden Spots & Natural Pools`;
    description = `Discover the best swimming holes near ${city.city}, ${city.region}, including hidden spots, natural pools, and waterfalls you can swim in. Plan your perfect summer escape.`;
    canonicalPath = getPathForCity(city);
    breadcrumbList.itemListElement.push(
      {
        '@type': 'ListItem',
        position: 2,
        name: city.region,
        item: absoluteUrl(getPathForRegion({countrySlug: city.countrySlug, regionSlug: city.regionSlug}), siteUrl),
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: city.city,
        item: absoluteUrl(canonicalPath, siteUrl),
      }
    );
    structuredData = [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `Swimming Holes Near ${city.city}, ${city.region}`,
        url: absoluteUrl(canonicalPath, siteUrl),
        description,
        keywords: keywords
      },
      breadcrumbList
    ];
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
    const holeName = selectedHole.name;
    const kw = getHoleKeywords(holeName, selectedHole.city, selectedHole.region);
    keywords = kw.join(', ');
    title = `${holeName} Swimming Hole, ${selectedHole.region} (${currentYear}) | Complete Guide`;
    description = `Discover everything you need to know about swimming at ${holeName} in ${selectedHole.city}, ${selectedHole.region}. Plan your perfect summer escape to this hidden natural pool.`;
    canonicalPath = getPathForHole(selectedHole);
    ogType = 'article';
    const [latitude, longitude] = selectedHole.coordinates.split(',').map((item) => Number(item.trim()));
    
    breadcrumbList.itemListElement.push(
      {
        '@type': 'ListItem',
        position: 2,
        name: selectedHole.region,
        item: absoluteUrl(getPathForRegion(selectedHole), siteUrl),
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: selectedHole.city,
        item: absoluteUrl(getPathForCity(selectedHole), siteUrl),
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: holeName,
        item: absoluteUrl(canonicalPath, siteUrl),
      }
    );

    structuredData = [
      {
        '@context': 'https://schema.org',
        '@type': 'TouristAttraction',
        name: holeName,
        description: description,
        keywords: keywords,
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
        url: absoluteUrl(canonicalPath, siteUrl),
      },
      breadcrumbList
    ];
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

  return {title, description, canonicalPath, ogType, structuredData, keywords};
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
