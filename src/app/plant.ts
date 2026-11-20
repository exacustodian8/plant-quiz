export type Watering = 'frequent' | 'average' | 'minimum' | 'none';
export type Sunlight = 'full_shade' | 'part_shade' | 'full_sun';

export interface PhotoCredit {
  license: string;
  url: string;
}

/** The app's own plant shape, mapped from Perenual's responses (see perenual.service.ts). */
export interface Plant {
  id: number;
  name: string;
  scientific: string;
  family?: string;
  image: string | null;
  credit: PhotoCredit | null;

  // Known when we searched by that trait, or when the details endpoint was available.
  watering?: Watering;
  sunlight?: Sunlight[];
  petFriendly?: boolean;
  edible?: boolean;

  // Only from the details endpoint (free plan: low-numbered species only).
  description?: string;
  careLevel?: string;
  growthRate?: string;
}

export const WATERING_LABEL: Record<Watering, string> = {
  none: 'Barely any water',
  minimum: 'Water rarely',
  average: 'Water weekly',
  frequent: 'Keep it moist',
};

export const SUNLIGHT_LABEL: Record<Sunlight, string> = {
  full_shade: 'Low light',
  part_shade: 'Bright, indirect',
  full_sun: 'Full sun',
};

/** 'flowering-maple' -> 'Flowering Maple' */
export function titleCase(s: string): string {
  return s.replace(/[-_]+/g, ' ').replace(/\b\p{L}/gu, (c) => c.toUpperCase());
}
