import { buildTiers, matchPercent, matchesStyle, orderForVisitor } from './matching';
import { Plant } from './plant';
import { Traits } from './quiz-data';

const all: Traits = {
  watering: 'minimum', sunlight: 'full_sun', indoor: true, petFriendly: true,
  edible: true, warmth: 'chilly', lifespan: 'perennial', style: 'leafy',
};

const plant = (id: number, family?: string): Plant => ({ id, name: `P${id}`, scientific: '', family, image: 'x', credit: null });

describe('buildTiers', () => {
  it('starts with every preference as a filter, and sends the hardiness zone for the chosen warmth', () => {
    expect(buildTiers(all)[0].query).toEqual({
      safe: true, sunlight: 'full_sun', watering: 'minimum', edible: true, cycle: 'perennial', hardiness: 5,
    });
    expect(buildTiers({ ...all, warmth: 'warm' })[0].query.hardiness).toBe(11);
  });

  it('relaxes one preference at a time, least important first', () => {
    const q = buildTiers(all).map((t) => Object.keys(t.query).filter((k) => k !== 'safe'));
    expect(q).toEqual([
      ['sunlight', 'watering', 'edible', 'cycle', 'hardiness'],
      ['sunlight', 'watering', 'edible', 'cycle'], // warmth goes first
      ['sunlight', 'watering', 'edible'], // then lifespan
      ['sunlight', 'watering'], // then cooking
      ['sunlight'], // then watering
      [], // finally just the hard rules
    ]);
  });

  it('never relaxes pet safety or "indoors only"', () => {
    const tiers = buildTiers({ ...all, indoor: false });
    expect(tiers.every((t) => t.query.safe === true && t.query.indoor === false)).toBe(true);
  });

  it('keeps the indoor filter (the default) when the visitor wants indoors only, and skips pet safety without pets', () => {
    const tiers = buildTiers({ ...all, petFriendly: false });
    expect(tiers.every((t) => t.query.indoor === undefined && t.query.safe === undefined)).toBe(true);
  });

  it('does not count "no cooking" as a preference', () => {
    const tiers = buildTiers({ ...all, edible: false });
    expect(tiers[0].query.edible).toBeUndefined();
    expect(tiers.length).toBe(5); // one fewer preference to relax
  });

  it('scores each tier out of everything the visitor answered', () => {
    const tiers = buildTiers(all);
    expect(tiers[0]).toMatchObject({ got: 11, total: 13 }); // 3+3+2+2+1, out of that + 2 for style
    expect(tiers[tiers.length - 1].got).toBe(0);
  });
});

describe('matchPercent', () => {
  const tier = buildTiers(all)[0];

  it('adds the style bonus only for plants of the wanted look', () => {
    expect(matchPercent(tier, all, plant(1, 'Araceae'))).toBe(100); // 13/13
    expect(matchPercent(tier, all, plant(2, 'Cactaceae'))).toBe(85); // 11/13
    expect(matchPercent(tier, all, plant(3))).toBe(85); // unknown family is neutral
  });

  it('is 0, not NaN, when nothing was answered', () => {
    expect(matchPercent(buildTiers({})[0], {}, plant(1))).toBe(0);
  });
});

describe('matchesStyle', () => {
  it('goes by botanical family', () => {
    expect(matchesStyle(plant(1, 'Orchidaceae'), 'blooms')).toBe(true);
    expect(matchesStyle(plant(1, 'Orchidaceae'), 'spiky')).toBe(false);
    expect(matchesStyle(plant(1, 'Araceae'), undefined)).toBe(false);
  });
});

describe('orderForVisitor', () => {
  const plants = Array.from({ length: 8 }, (_, i) => plant(i + 1, i === 5 ? 'Araceae' : 'Asteraceae'));

  it('puts plants of the wanted look first', () => {
    expect(orderForVisitor(plants, all)[0].id).toBe(6);
  });

  it('is stable: the same answers always give the same order', () => {
    const ids = (t: Partial<Traits>) => orderForVisitor(plants, t).map((p) => p.id);
    expect(ids(all)).toEqual(ids({ ...all }));
  });

  it('varies between visitors, so the first plant in the API does not win every time', () => {
    const noStyle = (t: Partial<Traits>) => orderForVisitor(plants, { ...t, style: undefined }).map((p) => p.id).join();
    const orders = new Set(
      (['minimum', 'average', 'frequent'] as const).flatMap((w) =>
        (['full_shade', 'part_shade', 'full_sun'] as const).map((s) => noStyle({ watering: w, sunlight: s })),
      ),
    );
    expect(orders.size).toBeGreaterThan(4);
    expect(orders.has('1,2,3,4,5,6,7,8')).toBe(false); // not just the API's own order
  });

  it('does not mutate its input', () => {
    const copy = [...plants];
    orderForVisitor(plants, all);
    expect(plants).toEqual(copy);
  });
});
