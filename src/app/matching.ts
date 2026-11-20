import { ListQuery } from './perenual.service';
import { Plant } from './plant';
import { Style, Traits, Warmth } from './quiz-data';

/** What we asked Perenual for in one search, and how closely it fits the quiz answers. */
export interface Tier {
  query: ListQuery;
  /** points of the visitor's answers this search honoured (style is added per plant) */
  got: number;
  /** points available across everything the visitor answered */
  total: number;
}

const WEIGHT = { sunlight: 3, watering: 3, edible: 2, cycle: 2, warmth: 1, style: 2 } as const;

/** USDA hardiness zone to ask Perenual for, per "how warm is your place". */
export const HARDINESS: Record<Warmth, number> = { chilly: 5, mild: 9, warm: 11 };

/** Preferences Perenual can filter on, most important first. The last ones are relaxed first. */
const FILTERABLE = ['sunlight', 'watering', 'edible', 'cycle', 'warmth'] as const;
type Pref = (typeof FILTERABLE)[number];

function answered(t: Partial<Traits>, p: Pref): boolean {
  switch (p) {
    case 'sunlight': return !!t.sunlight;
    case 'watering': return !!t.watering;
    case 'edible': return t.edible === true;
    case 'cycle': return !!t.lifespan;
    case 'warmth': return !!t.warmth;
  }
}

/**
 * Perenual does most of the matching (it filters server-side), so a "match" is a search.
 * We try the strictest search first and relax one preference at a time, least important
 * first, until there are enough results. "Indoors only" and pet safety are never relaxed.
 */
export function buildTiers(t: Partial<Traits>): Tier[] {
  const prefs = FILTERABLE.filter((p) => answered(t, p));
  const total = prefs.reduce((sum, p) => sum + WEIGHT[p], 0) + (t.style ? WEIGHT.style : 0);
  const base: ListQuery = { ...(t.petFriendly && { safe: true }), ...(t.indoor === false && { indoor: false }) };

  const tiers: Tier[] = [];
  for (let keep = prefs.length; keep >= 0; keep--) {
    const query: ListQuery = { ...base };
    let got = 0;
    for (const p of prefs.slice(0, keep)) {
      got += WEIGHT[p];
      switch (p) {
        case 'sunlight': query.sunlight = t.sunlight; break;
        case 'watering': query.watering = t.watering; break;
        case 'edible': query.edible = true; break;
        case 'cycle': query.cycle = t.lifespan; break;
        case 'warmth': query.hardiness = HARDINESS[t.warmth!]; break;
      }
    }
    tiers.push({ query, got, total });
  }
  return tiers;
}

// ---- the one preference the API can't filter on: the plant's look ----

/** Perenual has no "look" field, so we go by botanical family. Unknown families are simply neutral. */
const STYLE_FAMILIES: Record<Style, readonly string[]> = {
  leafy: ['Araceae', 'Moraceae', 'Araliaceae', 'Marantaceae', 'Piperaceae', 'Musaceae', 'Strelitziaceae', 'Urticaceae', 'Acanthaceae', 'Commelinaceae'],
  spiky: ['Asphodelaceae', 'Agavaceae', 'Asparagaceae', 'Cactaceae', 'Crassulaceae', 'Aizoaceae', 'Xanthorrhoeaceae', 'Dracaenaceae', 'Bromeliaceae'],
  soft: ['Arecaceae', 'Polypodiaceae', 'Pteridaceae', 'Aspleniaceae', 'Dryopteridaceae', 'Davalliaceae', 'Nephrolepidaceae', 'Blechnaceae', 'Dennstaedtiaceae', 'Cyatheaceae', 'Selaginellaceae', 'Zamiaceae'],
  blooms: ['Orchidaceae', 'Begoniaceae', 'Gesneriaceae', 'Malvaceae', 'Geraniaceae', 'Asteraceae', 'Rosaceae', 'Primulaceae', 'Solanaceae', 'Balsaminaceae', 'Amaryllidaceae', 'Iridaceae', 'Liliaceae'],
};

export function matchesStyle(plant: Plant, style: Style | undefined): boolean {
  return !!style && !!plant.family && STYLE_FAMILIES[style].includes(plant.family);
}

/** 0-100 for one plant: the search's points plus the style bonus, out of everything answered. */
export function matchPercent(tier: Tier, t: Partial<Traits>, plant: Plant): number {
  if (!tier.total) return 0;
  const bonus = matchesStyle(plant, t.style) ? WEIGHT.style : 0;
  return Math.round(((tier.got + bonus) / tier.total) * 100);
}

/**
 * Perenual always returns plants in the same (taxonomic) order, which would make the first
 * plant win every time. So: plants matching the wanted look come first, and the rest are
 * shuffled with a seed derived from the answers - varied between visitors, but the same
 * answers always give the same result (so a result link stays stable).
 */
export function orderForVisitor(plants: Plant[], t: Partial<Traits>): Plant[] {
  const seed = hash(JSON.stringify(t));
  const rank = (p: Plant) => (matchesStyle(p, t.style) ? 0 : 1);
  return [...plants].sort((a, b) => rank(a) - rank(b) || hash(`${seed}:${a.id}`) - hash(`${seed}:${b.id}`));
}

/** FNV-1a plus a final avalanche step, so inputs that differ in one character still shuffle differently. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}
