import { Plant, Sunlight, Watering, titleCase } from './plant';

/** Raw shapes from https://perenual.com/docs/api (only the fields we use). */
export interface RawImage {
  license_name?: string;
  license_url?: string;
  regular_url?: string;
  medium_url?: string;
}

export interface RawSpecies {
  id: number;
  common_name: string | null;
  scientific_name: string[];
  family?: string | null;
  default_image: RawImage | null;
}

export interface RawList {
  data: RawSpecies[];
  total: number;
  last_page: number;
  current_page: number;
}

export interface RawDetails extends RawSpecies {
  description?: string | null;
  watering?: string | null;
  sunlight?: string[] | null;
  care_level?: string | null;
  growth_rate?: string | null;
  poisonous_to_pets?: boolean | number | null;
}

export function toPlant(raw: RawSpecies, known: Partial<Plant> = {}): Plant {
  const img = raw.default_image;
  const image = realImage(img?.regular_url || img?.medium_url);
  return {
    id: raw.id,
    name: titleCase(raw.common_name || raw.scientific_name?.[0] || `Plant ${raw.id}`),
    scientific: raw.scientific_name?.[0] ?? '',
    family: raw.family ?? undefined,
    image,
    credit: image && img?.license_name ? { license: shortLicense(img.license_name), url: img.license_url ?? '' } : null,
    ...known,
  };
}

const SUN_MAP: Record<string, Sunlight> = {
  'full shade': 'full_shade',
  'part shade': 'part_shade',
  'filtered shade': 'part_shade',
  'part sun/part shade': 'part_shade',
  'full sun': 'full_sun',
};

/** Extra fields from the details endpoint, normalised to our own types. */
export function detailsToPartial(d: RawDetails): Partial<Plant> {
  const watering = d.watering?.toLowerCase();
  return {
    description: d.description ?? undefined,
    careLevel: d.care_level ?? undefined,
    growthRate: d.growth_rate ?? undefined,
    watering: (['frequent', 'average', 'minimum', 'none'] as const).find((w) => w === watering) as Watering | undefined,
    sunlight: d.sunlight?.map((s) => SUN_MAP[s.toLowerCase()]).filter((s): s is Sunlight => !!s),
    petFriendly: d.poisonous_to_pets == null ? undefined : !d.poisonous_to_pets,
  };
}

/** Premium-only species come back with a generic "upgrade_access.jpg" picture instead of a photo. */
function realImage(url: string | undefined): string | null {
  return url && !url.includes("upgrade_access") ? url : null;
}

/** "Attribution-ShareAlike 3.0 Unported (CC BY-SA 3.0)" -> "CC BY-SA 3.0" */
function shortLicense(name: string): string {
  return /\(([^)]*(CC|Public)[^)]*)\)/.exec(name)?.[1] ?? name;
}
