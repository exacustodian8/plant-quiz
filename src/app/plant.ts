import { Traits } from './quiz-data';

export interface PhotoCredit {
  author: string;
  license: string;
  /** iNaturalist observation page the photo came from */
  source: string;
}

export interface Plant {
  id: string;
  /** path to a local photo under /plants */
  image: string;
  credit: PhotoCredit;
  name: string;
  scientific: string;
  emoji: string;
  watering: Traits['watering'];
  sunlight: Traits['sunlight'][];
  petFriendly: boolean;
  vibe: Traits['vibe'];
  blurb: string;
}

export const WATERING_LABEL: Record<Traits['watering'], string> = {
  minimum: 'Water rarely',
  average: 'Water weekly',
  frequent: 'Keep it moist',
};

export const SUNLIGHT_LABEL: Record<Traits['sunlight'], string> = {
  full_shade: 'Low light',
  part_shade: 'Bright, indirect',
  full_sun: 'Full sun',
};

export const VIBE_LABEL: Record<Traits['vibe'], string> = {
  calm: 'Calm',
  bold: 'Bold',
  quirky: 'Quirky',
};
