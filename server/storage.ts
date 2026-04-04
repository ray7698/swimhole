import {neon} from '@neondatabase/serverless';
import type {Difficulty, RecordStatus, SwimHole} from '../src/types/swim-hole';

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export type SwimHoleStore = {
  list(): Promise<SwimHole[]>;
};

class NeonSwimHoleStore implements SwimHoleStore {
  private sql = neon(process.env.DATABASE_URL!);
  private ready: Promise<void> | null = null;

  private async ensureTable() {
    if (!this.ready) {
      this.ready = this.sql`
        CREATE TABLE IF NOT EXISTS swim_holes (
          id SERIAL PRIMARY KEY,
          slug TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          country TEXT NOT NULL,
          country_slug TEXT NOT NULL,
          region TEXT NOT NULL,
          region_slug TEXT NOT NULL,
          city TEXT NOT NULL,
          city_slug TEXT NOT NULL,
          description TEXT NOT NULL,
          difficulty TEXT NOT NULL,
          depth TEXT NOT NULL,
          best_season TEXT NOT NULL,
          parking_info TEXT NOT NULL,
          entry_fee TEXT NOT NULL,
          features JSONB NOT NULL DEFAULT '[]'::jsonb,
          coordinates TEXT NOT NULL,
          rating DOUBLE PRECISION NOT NULL DEFAULT 0,
          reviews INTEGER NOT NULL DEFAULT 0,
          image_url TEXT NOT NULL DEFAULT '',
          image_alt TEXT NOT NULL DEFAULT '',
          source_url TEXT NOT NULL DEFAULT '',
          last_verified TEXT NOT NULL DEFAULT '',
          status TEXT NOT NULL DEFAULT 'draft'
        );
      `.then(() => undefined);
    }

    await this.ready;
  }

  private mapRow(row: Record<string, unknown>): SwimHole {
    return {
      id: toNumber(row.id),
      slug: String(row.slug || ''),
      name: String(row.name || ''),
      country: String(row.country || ''),
      countrySlug: String(row.country_slug || ''),
      region: String(row.region || ''),
      regionSlug: String(row.region_slug || ''),
      city: String(row.city || ''),
      citySlug: String(row.city_slug || ''),
      description: String(row.description || ''),
      difficulty: String(row.difficulty || 'Easy') as Difficulty,
      depth: String(row.depth || ''),
      bestSeason: String(row.best_season || ''),
      parkingInfo: String(row.parking_info || ''),
      entryFee: String(row.entry_fee || ''),
      features: Array.isArray(row.features) ? row.features.map(String) : [],
      coordinates: String(row.coordinates || ''),
      rating: toNumber(row.rating),
      reviews: toNumber(row.reviews),
      imageUrl: String(row.image_url || ''),
      imageAlt: String(row.image_alt || ''),
      sourceUrl: String(row.source_url || ''),
      lastVerified: String(row.last_verified || ''),
      status: String(row.status || 'draft') as RecordStatus,
    };
  }

  async list() {
    await this.ensureTable();
    const rows = await this.sql`SELECT * FROM swim_holes WHERE status = 'published' ORDER BY name ASC`;
    return rows.map((row) => this.mapRow(row as Record<string, unknown>));
  }
}

export function createSwimHoleStore(): SwimHoleStore {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required. The public site only reads from the database.');
  }

  return new NeonSwimHoleStore();
}
