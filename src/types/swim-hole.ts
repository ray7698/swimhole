export type Difficulty = 'Easy' | 'Moderate' | 'Hard';

export type RecordStatus = 'draft' | 'published';

export type SwimHole = {
  id: number;
  slug: string;
  name: string;
  country: string;
  countrySlug: string;
  region: string;
  regionSlug: string;
  city: string;
  citySlug: string;
  description: string;
  difficulty: Difficulty;
  depth: string;
  bestSeason: string;
  parkingInfo: string;
  entryFee: string;
  features: string[];
  coordinates: string;
  rating: number;
  reviews: number;
  imageUrl?: string;
  imageAlt?: string;
  sourceUrl?: string;
  lastVerified?: string;
  status?: RecordStatus;
};

export type SwimHoleInput = Omit<
  SwimHole,
  'id' | 'countrySlug' | 'regionSlug' | 'citySlug'
> & {
  id?: number;
};
