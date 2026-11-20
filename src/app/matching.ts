import { ListQuery } from './perenual.service';
import { Traits } from './quiz-data';

/** What we asked Perenual for in one search, and how closely it fits the quiz answers. */
export interface Tier {
  query: ListQuery;
  /** 0-100: share of the answered preferences this search honoured */
  percent: number;
}

const WEIGHT = { watering: 3, sunlight: 3, edible: 2 } as const;

/**
 * Perenual does the matching (it filters server-side), so a "match" is a search.
 * We try the strictest search first and relax preferences one at a time, least
 * important first, until there are enough results. Pet safety is never relaxed.
 */
export function buildTiers(t: Partial<Traits>): Tier[] {
  const total =
    (t.watering ? WEIGHT.watering : 0) + (t.sunlight ? WEIGHT.sunlight : 0) + (t.edible ? WEIGHT.edible : 0);
  const base: ListQuery = t.petFriendly ? { safe: true } : {};

  // preference combinations, strictest first: [watering, sunlight, edible]
  const combos: [boolean, boolean, boolean][] = [
    [true, true, true],
    [true, true, false],
    [false, true, false],
    [true, false, false],
    [false, false, false],
  ];

  const seen = new Set<string>();
  const tiers: Tier[] = [];
  for (const [w, s, e] of combos) {
    const query: ListQuery = { ...base };
    let got = 0;
    if (w && t.watering) { query.watering = t.watering; got += WEIGHT.watering; }
    if (s && t.sunlight) { query.sunlight = t.sunlight; got += WEIGHT.sunlight; }
    if (e && t.edible) { query.edible = true; got += WEIGHT.edible; }

    // skip combinations that collapse into one we already have (e.g. the user never answered edible)
    const key = JSON.stringify(query);
    if (seen.has(key)) continue;
    seen.add(key);
    tiers.push({ query, percent: total ? Math.round((got / total) * 100) : 0 });
  }
  return tiers;
}
