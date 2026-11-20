import { Plant } from './plant';
import { Traits } from './quiz-data';

export interface Match {
  plant: Plant;
  score: number;
  /** 0–100, how well the plant fits the answers given */
  percent: number;
}

const WATERING_POINTS = 3;
const SUNLIGHT_POINTS = 3;
const VIBE_POINTS = 2;

export function score(p: Plant, t: Partial<Traits>): number {
  let s = 0;
  if (t.watering === p.watering) s += WATERING_POINTS;
  if (t.sunlight && p.sunlight.includes(t.sunlight)) s += SUNLIGHT_POINTS;
  if (t.vibe === p.vibe) s += VIBE_POINTS;
  return s;
}

/** Ranks plants best-first. A pet owner's pool only contains pet-safe plants. */
export function rankPlants(plants: Plant[], t: Partial<Traits>): Match[] {
  const max =
    (t.watering ? WATERING_POINTS : 0) + (t.sunlight ? SUNLIGHT_POINTS : 0) + (t.vibe ? VIBE_POINTS : 0);
  const pool = t.petFriendly ? plants.filter((p) => p.petFriendly) : plants;

  return pool
    .map((plant) => {
      const s = score(plant, t);
      return { plant, score: s, percent: max ? Math.round((s / max) * 100) : 0 };
    })
    .sort((a, b) => b.score - a.score);
}
