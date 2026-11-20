import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Gallery } from './gallery';
import { Plant } from '../plant';

const make = (over: Partial<Plant>): Plant => ({
  id: 'p', image: 'plants/p.jpg', credit: { author: 'A', license: 'CC0', source: '' },
  name: 'Plant', scientific: 'P p', emoji: '🌿', blurb: '',
  watering: 'average', sunlight: ['part_shade'], petFriendly: true, vibe: 'calm', ...over,
});

const PLANTS = [
  make({ id: 'a', name: 'Aloe', vibe: 'bold', petFriendly: false }),
  make({ id: 'b', name: 'Fern', vibe: 'calm', petFriendly: true }),
  make({ id: 'c', name: 'Cactus', vibe: 'bold', petFriendly: true, sunlight: ['full_sun'] }),
];

async function setup() {
  TestBed.configureTestingModule({
    imports: [Gallery],
    providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
  });
  const fixture = TestBed.createComponent(Gallery);
  TestBed.inject(HttpTestingController).expectOne('plants.json').flush(PLANTS);
  await fixture.whenStable();
  const names = () =>
    Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('app-plant-card h3')).map((h) => h.textContent!.trim());
  return { fixture, names };
}

describe('Gallery', () => {
  it('lists every plant, then narrows by search text', async () => {
    const { fixture, names } = await setup();
    expect(names()).toEqual(['Aloe', 'Fern', 'Cactus']);

    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('input[type=search]')!;
    input.value = 'fer';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(names()).toEqual(['Fern']);
  });

  it('starts filtered by the ?vibe= route input', async () => {
    const { fixture, names } = await setup();
    fixture.componentRef.setInput('vibe', 'bold');
    await fixture.whenStable();
    expect(names()).toEqual(['Aloe', 'Cactus']);
  });

  it('ignores an unknown vibe and combines with the pet-safe filter', async () => {
    const { fixture, names } = await setup();
    fixture.componentRef.setInput('vibe', 'nonsense');
    await fixture.whenStable();
    expect(names().length).toBe(3);

    fixture.componentRef.setInput('vibe', 'bold');
    const petChip = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('.chip')).find((b) => b.textContent!.includes('Pet-safe'))!;
    petChip.click();
    await fixture.whenStable();
    expect(names()).toEqual(['Cactus']);
  });
});
