import { rankPlants, score } from './matching';
import { Plant } from './plant';

const make = (over: Partial<Plant>): Plant => ({
  id: 'x', name: 'X', scientific: 'X x', emoji: '🌿', blurb: '',
  watering: 'average', sunlight: ['part_shade'], petFriendly: true, vibe: 'calm',
  ...over,
});

describe('matching', () => {
  it('scores watering 3, sunlight 3, vibe 2', () => {
    const p = make({});
    expect(score(p, { watering: 'average' })).toBe(3);
    expect(score(p, { sunlight: 'part_shade' })).toBe(3);
    expect(score(p, { vibe: 'calm' })).toBe(2);
    expect(score(p, { watering: 'average', sunlight: 'part_shade', vibe: 'calm' })).toBe(8);
  });

  it('ranks the better fit first and reports a percentage', () => {
    const cactus = make({ id: 'cactus', watering: 'minimum', sunlight: ['full_sun'], vibe: 'bold' });
    const fern = make({ id: 'fern', watering: 'frequent', sunlight: ['full_shade'], vibe: 'calm' });
    const [best, other] = rankPlants([fern, cactus], { watering: 'minimum', sunlight: 'full_sun', vibe: 'bold' });
    expect(best.plant.id).toBe('cactus');
    expect(best.percent).toBe(100);
    expect(other.percent).toBe(0);
  });

  it('excludes toxic plants for pet owners', () => {
    const toxic = make({ id: 'toxic', petFriendly: false, watering: 'minimum' });
    const safe = make({ id: 'safe', petFriendly: true });
    const ranked = rankPlants([toxic, safe], { watering: 'minimum', petFriendly: true });
    expect(ranked.map((m) => m.plant.id)).toEqual(['safe']);
  });

  it('does not divide by zero when nothing was answered', () => {
    expect(rankPlants([make({})], {})[0].percent).toBe(0);
  });
});
