import { buildTiers } from './matching';

describe('buildTiers', () => {
  const all = { watering: 'minimum', sunlight: 'full_sun', petFriendly: true, edible: true } as const;

  it('starts with the strictest search and relaxes one preference at a time', () => {
    const tiers = buildTiers(all);
    expect(tiers[0].query).toEqual({ safe: true, watering: 'minimum', sunlight: 'full_sun', edible: true });
    expect(tiers[1].query).toEqual({ safe: true, watering: 'minimum', sunlight: 'full_sun' }); // edible dropped first
    expect(tiers[2].query).toEqual({ safe: true, sunlight: 'full_sun' }); // then watering
    expect(tiers[3].query).toEqual({ safe: true, watering: 'minimum' });
    expect(tiers[tiers.length - 1].query).toEqual({ safe: true }); // finally just "not poisonous"
  });

  it('never relaxes pet safety', () => {
    expect(buildTiers(all).every((t) => t.query.safe === true)).toBe(true);
  });

  it('does not ask for pet safety when the visitor has no pets', () => {
    expect(buildTiers({ ...all, petFriendly: false }).every((t) => t.query.safe === undefined)).toBe(true);
  });

  it('reports how much of the visitor\'s answers each search honours', () => {
    const pct = buildTiers(all).map((t) => t.percent);
    expect(pct[0]).toBe(100);
    expect(pct[1]).toBe(75); // 6 of 8 points
    expect(pct).toEqual([...pct].sort((a, b) => b - a)); // never improves while relaxing
  });

  it('skips duplicate searches when a question was not answered', () => {
    const tiers = buildTiers({ watering: 'average', sunlight: 'part_shade', petFriendly: false, edible: false });
    const keys = tiers.map((t) => JSON.stringify(t.query));
    expect(new Set(keys).size).toBe(keys.length);
    expect(tiers[0].query).toEqual({ watering: 'average', sunlight: 'part_shade' });
  });
});
