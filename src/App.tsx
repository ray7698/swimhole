import {type ReactNode, useEffect, useMemo, useState} from 'react';
import MonetagBodyTag from './components/MonetagBodyTag';
import PropellerAdSlot from './components/PropellerAdSlot';
import type {Difficulty, SwimHole} from './types/swim-hole';
import {
  absoluteUrl,
  buildSeoPayload,
  getCities,
  getCityByRoute,
  getHoleByRoute,
  getPathForCity,
  getPathForHole,
  getPathForPage,
  getPathForRegion,
  getRegions,
  getRegionByRoute,
  getRouteFromPathname,
  type Page,
  type Route,
} from './lib/site';

type Filters = {
  term: string;
  state: string;
  difficulty: '' | Difficulty;
  features: string[];
};

type AppProps = {
  initialHoles?: SwimHole[];
  initialPath?: string;
};

const defaultFilters: Filters = {
  term: '',
  state: '',
  difficulty: '',
  features: [],
};

const primaryFeatureFilters = ['Free Entry', 'Dog Friendly', 'Cliff Jumping'];
const runtimeEnv =
  typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env
    : ({} as Record<string, string | undefined>);
const adsConfig = {
  bannerSrc: runtimeEnv.VITE_MONETAG_BANNER_SRC,
  bodyTagSrc: runtimeEnv.VITE_MONETAG_BODY_TAG_SRC,
  bodyTagZone: runtimeEnv.VITE_MONETAG_BODY_TAG_ZONE,
};

function getSiteUrl() {
  if (typeof window !== 'undefined') {
    return runtimeEnv.VITE_SITE_URL || window.location.origin;
  }

  return runtimeEnv.VITE_SITE_URL || 'https://www.swimholes.com';
}

function formatCardDescription(description: string) {
  return description.length > 80 ? `${description.slice(0, 80)}...` : description;
}

function ratingLabel(hole: SwimHole) {
  return `Rating ${hole.rating} (${hole.reviews})`;
}

function getMapLink(coordinates: string) {
  return `https://maps.google.com/?q=${encodeURIComponent(coordinates)}`;
}

function setMetaTag(name: 'name' | 'property', value: string, content: string) {
  let tag = document.head.querySelector(`meta[${name}="${value}"]`) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(name, value);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function setCanonical(url: string) {
  let link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = url;
}

function setStructuredData(data: object) {
  const scriptId = 'route-structured-data';
  let script = document.getElementById(scriptId) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = scriptId;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

function applySeo(route: Route, selectedHole: SwimHole | null, holes: SwimHole[]) {
  const siteUrl = getSiteUrl();
  const seo = buildSeoPayload(route, selectedHole, siteUrl, holes);
  const canonicalUrl = absoluteUrl(seo.canonicalPath, siteUrl);

  document.title = seo.title;
  setMetaTag('name', 'description', seo.description);
  setMetaTag('property', 'og:title', seo.title);
  setMetaTag('property', 'og:description', seo.description);
  setMetaTag('property', 'og:type', seo.ogType);
  setMetaTag('property', 'og:url', canonicalUrl);
  setMetaTag('name', 'twitter:card', 'summary_large_image');
  setMetaTag('name', 'twitter:title', seo.title);
  setMetaTag('name', 'twitter:description', seo.description);
  setCanonical(canonicalUrl);
  setStructuredData(seo.structuredData);
}

function getImageMarkup(hole: SwimHole, className: string) {
  if (hole.imageUrl) {
    return <img alt={hole.imageAlt || hole.name} className={className} src={hole.imageUrl} />;
  }

  return <div className={`${className} image-fallback`}>Image Placeholder</div>;
}

async function fetchCatalog() {
  const response = await fetch('/api/swim-holes');
  if (!response.ok) {
    throw new Error(`Unable to load swim holes (${response.status})`);
  }

  return (await response.json()) as SwimHole[];
}

function SwimCard({
  hole,
  onSelect,
}: {
  hole: SwimHole;
  onSelect: (hole: SwimHole) => void;
}) {
  const open = () => onSelect(hole);

  return (
    <div
      className="card"
      onClick={open}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          open();
        }
      }}
      role="button"
      tabIndex={0}
    >
      {getImageMarkup(hole, 'card-img')}
      <div className="card-content">
        <h3 className="card-title">{hole.name}</h3>
        <div className="card-location">
          {hole.city}, {hole.region}
        </div>
        <div className="card-rating">{ratingLabel(hole)}</div>
        <div className="tags">
          {hole.features.slice(0, 3).map((feature) => (
            <span className="tag" key={feature}>
              {feature}
            </span>
          ))}
        </div>
        <p className="card-desc">{formatCardDescription(hole.description)}</p>
        <button className="btn btn-outline" style={{width: '100%', marginTop: 'auto'}} type="button">
          View Details
        </button>
      </div>
    </div>
  );
}

function SwimCardGrid({
  holes,
  onSelect,
}: {
  holes: SwimHole[];
  onSelect: (hole: SwimHole) => void;
}) {
  return (
    <div className="grid grid-3">
      {holes.map((hole) => (
        <div key={hole.id}>
          <SwimCard hole={hole} onSelect={onSelect} />
        </div>
      ))}
    </div>
  );
}

export default function App({initialHoles = [], initialPath}: AppProps) {
  const [holes, setHoles] = useState<SwimHole[]>(initialHoles);
  const startingPath = initialPath || (typeof window !== 'undefined' ? window.location.pathname : '/');
  const [route, setRoute] = useState<Route>(() => getRouteFromPathname(startingPath, holes));
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(initialHoles.length === 0);
  const [catalogError, setCatalogError] = useState('');

  const regions = useMemo(
    () => getRegions(holes).filter((region) => region.countrySlug === 'united-states'),
    [holes],
  );
  const cities = useMemo(
    () => getCities(holes).filter((city) => city.countrySlug === 'united-states'),
    [holes],
  );
  const states = useMemo(() => regions.map((region) => region.region), [regions]);
  const selectedHole = useMemo(() => getHoleByRoute(route, holes), [route, holes]);
  const selectedRegion = useMemo(() => getRegionByRoute(route, holes), [route, holes]);
  const selectedCity = useMemo(() => getCityByRoute(route, holes), [route, holes]);

  const filteredHoles = useMemo(() => {
    const term = filters.term.trim().toLowerCase();

    return holes.filter((hole) => {
      const matchTerm =
        !term ||
        hole.name.toLowerCase().includes(term) ||
        hole.city.toLowerCase().includes(term) ||
        hole.region.toLowerCase().includes(term) ||
        hole.country.toLowerCase().includes(term);
      const matchState = !filters.state || hole.region === filters.state;
      const matchDifficulty = !filters.difficulty || hole.difficulty === filters.difficulty;
      const matchFeatures = filters.features.every((feature) => hole.features.includes(feature));

      return matchTerm && matchState && matchDifficulty && matchFeatures;
    });
  }, [filters, holes]);

  useEffect(() => {
    let active = true;

    const loadCatalog = async () => {
      setCatalogLoading(true);
      try {
        const records = await fetchCatalog();
        if (active) {
          setHoles(records);
          setCatalogError('');
          setRoute(getRouteFromPathname(typeof window !== 'undefined' ? window.location.pathname : startingPath, records));
        }
      } catch (error) {
        if (active) {
          setCatalogError(error instanceof Error ? error.message : 'Unable to load catalog.');
        }
      } finally {
        if (active) {
          setCatalogLoading(false);
        }
      }
    };

    void loadCatalog();

    return () => {
      active = false;
    };
  }, [startingPath]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const onPopState = () => setRoute(getRouteFromPathname(window.location.pathname, holes));
    window.addEventListener('popstate', onPopState);

    return () => window.removeEventListener('popstate', onPopState);
  }, [holes]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      applySeo(route, selectedHole, holes);
    }
  }, [route, selectedHole, holes]);

  const navigate = (
    page: Exclude<Page, 'not-found' | 'region' | 'city'>,
    hole?: SwimHole,
  ) => {
    setMobileMenuOpen(false);

    const targetPath = page === 'detail' && hole ? getPathForHole(hole) : getPathForPage(page as Exclude<Page, 'detail' | 'region' | 'city' | 'not-found'>);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', targetPath);
      setRoute(getRouteFromPathname(targetPath, holes));
      window.scrollTo({top: 0, behavior: 'smooth'});
    } else {
      setRoute(getRouteFromPathname(targetPath, holes));
    }
  };

  const navigateToPath = (path: string) => {
    setMobileMenuOpen(false);

    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
      setRoute(getRouteFromPathname(path, holes));
      window.scrollTo({top: 0, behavior: 'smooth'});
    } else {
      setRoute(getRouteFromPathname(path, holes));
    }
  };

  const toggleFeature = (feature: string) => {
    setFilters((current) => ({
      ...current,
      features: current.features.includes(feature)
        ? current.features.filter((item) => item !== feature)
        : [...current.features, feature],
    }));
  };

  return (
    <>
      <header>
        <div className="container nav-container">
          <a
            className="logo"
            href="/"
            onClick={(event) => {
              event.preventDefault();
              navigate('home');
            }}
          >
            SwimHoles
          </a>
          <nav className={`nav-links ${mobileMenuOpen ? 'show' : ''}`} id="navLinks">
            <a
              className={`nav-link ${route.page === 'home' ? 'active' : ''}`}
              href="/"
              onClick={(event) => {
                event.preventDefault();
                navigate('home');
              }}
            >
              Home
            </a>
            <a
              className={`nav-link ${route.page === 'directory' ? 'active' : ''}`}
              href="/directory"
              onClick={(event) => {
                event.preventDefault();
                navigate('directory');
              }}
            >
              Directory
            </a>
            <a
              className={`nav-link ${route.page === 'about' ? 'active' : ''}`}
              href="/about"
              onClick={(event) => {
                event.preventDefault();
                navigate('about');
              }}
            >
              About
            </a>
          </nav>
          <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen((value) => !value)} type="button">
            Menu
          </button>
        </div>
      </header>

      <MonetagBodyTag
        scriptSrc={adsConfig.bodyTagSrc}
        zoneId={adsConfig.bodyTagZone}
      />

      <main id="app">
        {catalogError ? (
          <div className="container mt-4">
            <div className="status-banner error-banner">{catalogError}</div>
          </div>
        ) : null}

        {catalogLoading && holes.length === 0 && !catalogError ? (
          <div className="container section">
            <div className="status-banner">Loading swimming holes...</div>
          </div>
        ) : null}

        <div className={`page ${route.page === 'home' && (!catalogLoading || holes.length > 0) ? '' : 'hidden'}`}>
          <section className="hero">
            <div className="container">
              <h1>Discover America's Most Beautiful Swimming Holes</h1>
              <p>Find hidden gems, crystal clear waters, and the perfect spot for your next wild swim.</p>
              <div className="search-bar">
                <input
                  onChange={(event) => setFilters((current) => ({...current, term: event.target.value}))}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      navigate('directory');
                    }
                  }}
                  placeholder="Search by name, city, or state..."
                  type="text"
                  value={filters.term}
                />
                <button className="btn btn-primary" onClick={() => navigate('directory')} type="button">
                  Search
                </button>
              </div>
            </div>
          </section>

          <div className="container">
            <PropellerAdSlot
              className="propeller-hero"
              label="Top banner"
              minHeight={160}
              scriptSrc={adsConfig.bannerSrc}
            />
          </div>

          <section className="section container">
            <div className="flex justify-between items-center mb-4">
              <h2>Featured Spots</h2>
              <button className="btn btn-outline" onClick={() => navigate('directory')} type="button">
                View All
              </button>
            </div>
            <SwimCardGrid holes={holes.slice(0, 6)} onSelect={(selected) => navigate('detail', selected)} />
          </section>

          <section className="section container">
            <h2 className="mb-4">Browse by State</h2>
            <div className="states-grid">
              {regions.map((region) => (
                <button className="state-item" key={region.regionSlug} onClick={() => navigateToPath(getPathForRegion(region))} type="button">
                  {region.region}
                </button>
              ))}
            </div>
          </section>

          <section className="section container">
            <h2 className="mb-4">Browse by City</h2>
            <div className="states-grid">
              {cities.map((city) => (
                <button className="state-item" key={`${city.regionSlug}-${city.citySlug}`} onClick={() => navigateToPath(getPathForCity(city))} type="button">
                  {city.city}
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className={`page ${route.page === 'directory' && (!catalogLoading || holes.length > 0) ? '' : 'hidden'}`}>
          <div className="container section">
            <h1 className="mb-4">All Swimming Holes</h1>
            <div className="filters">
              <div className="filter-group" style={{flex: 1, minWidth: 200}}>
                <input
                  onChange={(event) => setFilters((current) => ({...current, term: event.target.value}))}
                  placeholder="Search..."
                  style={{width: '100%', padding: 8, border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', outline: 'none'}}
                  type="text"
                  value={filters.term}
                />
              </div>
              <div className="filter-group">
                <select onChange={(event) => setFilters((current) => ({...current, state: event.target.value}))} value={filters.state}>
                  <option value="">All States</option>
                  {states.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <select
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      difficulty: event.target.value as Filters['difficulty'],
                    }))
                  }
                  value={filters.difficulty}
                >
                  <option value="">Any Difficulty</option>
                  <option value="Easy">Easy</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
              <div className="filter-group">
                {primaryFeatureFilters.map((feature) => (
                  <button className={`filter-btn ${filters.features.includes(feature) ? 'active' : ''}`} key={feature} onClick={() => toggleFeature(feature)} type="button">
                    {feature === 'Free Entry' ? 'Free' : feature}
                  </button>
                ))}
              </div>
            </div>

            {catalogLoading ? <div className="status-banner">Refreshing catalog...</div> : null}
            <SwimCardGrid holes={filteredHoles} onSelect={(selected) => navigate('detail', selected)} />
            {filteredHoles.length === 0 ? (
              <div className="text-center mt-4" style={{color: 'var(--gray-500)'}}>
                No swimming holes found matching your criteria.
              </div>
            ) : null}
          </div>
        </div>

        <div className={`page ${route.page === 'region' && (!catalogLoading || holes.length > 0) ? '' : 'hidden'}`}>
          <div className="container section">
            {selectedRegion ? (
              <>
                <button className="btn btn-outline mb-4" onClick={() => navigate('directory')} type="button">
                  Back to Directory
                </button>
                <h1 className="mb-2">{selectedRegion.region} Swimming Holes</h1>
                <p className="mb-4" style={{color: 'var(--gray-500)'}}>
                  Explore swimming holes in {selectedRegion.region}, {selectedRegion.country}.
                </p>
                <div className="states-grid mb-4">
                  {selectedRegion.holes.map((hole) => (
                    <button className="state-item" key={hole.citySlug} onClick={() => navigateToPath(getPathForCity(hole))} type="button">
                      {hole.city}
                    </button>
                  ))}
                </div>
                <SwimCardGrid holes={selectedRegion.holes} onSelect={(selected) => navigate('detail', selected)} />
              </>
            ) : null}
          </div>
        </div>

        <div className={`page ${route.page === 'city' && (!catalogLoading || holes.length > 0) ? '' : 'hidden'}`}>
          <div className="container section">
            {selectedCity ? (
              <>
                <button
                  className="btn btn-outline mb-4"
                  onClick={() =>
                    navigateToPath(
                      getPathForRegion({
                        countrySlug: selectedCity.countrySlug,
                        regionSlug: selectedCity.regionSlug,
                      }),
                    )
                  }
                  type="button"
                >
                  Back to {selectedCity.region}
                </button>
                <h1 className="mb-2">{selectedCity.city} Swimming Holes</h1>
                <p className="mb-4" style={{color: 'var(--gray-500)'}}>
                  Explore swimming holes near {selectedCity.city}, {selectedCity.region}.
                </p>
                <SwimCardGrid holes={selectedCity.holes} onSelect={(selected) => navigate('detail', selected)} />
              </>
            ) : null}
          </div>
        </div>

        <div className={`page ${route.page === 'detail' && (!catalogLoading || holes.length > 0) ? '' : 'hidden'}`}>
          <div className="container section">
            <button className="btn btn-outline mb-4" onClick={() => navigate('directory')} type="button">
              Back to Directory
            </button>
            {selectedHole ? (
              <div>
                {getImageMarkup(selectedHole, 'detail-hero')}
                <div className="detail-header">
                  <div>
                    <h1 style={{fontSize: '2.5rem', marginBottom: 5}}>{selectedHole.name}</h1>
                    <p style={{color: 'var(--gray-500)', fontSize: '1.1rem'}}>
                      {selectedHole.city}, {selectedHole.region}
                    </p>
                    <div style={{color: '#f59e0b', fontWeight: 500, marginTop: 10}}>{ratingLabel(selectedHole)}</div>
                  </div>
                  <a className="btn btn-primary" href={getMapLink(selectedHole.coordinates)} rel="noreferrer" target="_blank">
                    Get Directions
                  </a>
                </div>

                <div className="tags" style={{marginBottom: 30}}>
                  <button className="tag tag-button" onClick={() => navigateToPath(getPathForRegion(selectedHole))} type="button">
                    {selectedHole.region}
                  </button>
                  <button className="tag tag-button" onClick={() => navigateToPath(getPathForCity(selectedHole))} type="button">
                    {selectedHole.city}
                  </button>
                  {selectedHole.features.map((feature) => (
                    <span className="tag" key={feature}>
                      {feature}
                    </span>
                  ))}
                </div>

                <div className="detail-info-grid">
                  <div className="info-item">
                    <h4>Difficulty</h4>
                    <p>{selectedHole.difficulty}</p>
                  </div>
                  <div className="info-item">
                    <h4>Best Season</h4>
                    <p>{selectedHole.bestSeason}</p>
                  </div>
                  <div className="info-item">
                    <h4>Depth</h4>
                    <p>{selectedHole.depth}</p>
                  </div>
                  <div className="info-item">
                    <h4>Entry Fee</h4>
                    <p>{selectedHole.entryFee}</p>
                  </div>
                  <div className="info-item">
                    <h4>Parking</h4>
                    <p>{selectedHole.parkingInfo}</p>
                  </div>
                  <div className="info-item">
                    <h4>Last Verified</h4>
                    <p>{selectedHole.lastVerified || 'Not set yet'}</p>
                  </div>
                </div>
                <div className="tab-content active">
                  <h3 className="mb-2">About {selectedHole.name}</h3>
                  <p>{selectedHole.description}</p>
                  <p className="mt-4" style={{color: 'var(--gray-500)', fontSize: '0.9rem'}}>
                    Coordinates: {selectedHole.coordinates}
                  </p>
                  {selectedHole.sourceUrl ? (
                    <p className="mt-4">
                      <a className="link-inline" href={selectedHole.sourceUrl} rel="noreferrer" target="_blank">
                        Source listing
                      </a>
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className={`page ${route.page === 'about' ? '' : 'hidden'}`}>
          <div className="container section" style={{maxWidth: 800}}>
            <h1 className="mb-4">About SwimHoles</h1>
            <div className="about-panel">
              <p className="mb-4">
                Welcome to SwimHoles, your guide to beautiful natural swimming spots across the United States.
              </p>
              <p className="mb-4">
                The public site now focuses only on published catalog browsing while content management lives in a separate local admin app.
              </p>
              <p>That keeps the main site lean and the editing workflow private on your machine.</p>
            </div>
          </div>
        </div>

        <div className={`page ${route.page === 'not-found' && !catalogLoading ? '' : 'hidden'}`}>
          <div className="container section" style={{maxWidth: 800}}>
            <h1 className="mb-4">Page Not Found</h1>
            <div className="about-panel">
              <p className="mb-4">That page does not exist yet.</p>
              <button className="btn btn-primary" onClick={() => navigate('home')} type="button">
                Go Home
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer>
        <div className="container">
          <p>Copyright 2026 SwimHoles.com. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}

