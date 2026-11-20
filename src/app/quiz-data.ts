import { Sunlight, Watering } from './plant';

export type Warmth = 'chilly' | 'mild' | 'warm';
export type Lifespan = 'perennial' | 'annual';
export type Style = 'leafy' | 'spiky' | 'soft' | 'blooms';

export interface Traits {
  watering: Watering;
  sunlight: Sunlight;
  /** true: houseplants only. false: balcony / garden plants are welcome too. */
  indoor: boolean;
  petFriendly: boolean;
  edible: boolean;
  warmth: Warmth;
  lifespan: Lifespan;
  style: Style;
}

export interface Option {
  label: string;
  traits: Partial<Traits>;
}

export interface Question {
  text: string;
  options: Option[];
}

export const QUESTIONS: Question[] = [
  {
    text: 'How good are you at remembering daily chores?',
    options: [
      { label: 'Honestly, I forget a lot', traits: { watering: 'minimum' } },
      { label: 'I get most of them done', traits: { watering: 'average' } },
      { label: 'I have a routine and stick to it', traits: { watering: 'frequent' } },
    ],
  },
  {
    text: 'Where do you spend most of your time at home?',
    options: [
      { label: 'A dim corner, curtains closed', traits: { sunlight: 'full_shade' } },
      { label: 'Somewhere with soft daylight', traits: { sunlight: 'part_shade' } },
      { label: 'Right next to a big sunny window', traits: { sunlight: 'full_sun' } },
    ],
  },
  {
    text: 'Where will your plant live?',
    options: [
      { label: 'Indoors, no exceptions', traits: { indoor: true } },
      { label: 'I have a balcony or garden too', traits: { indoor: false } },
    ],
  },
  {
    text: 'Do you share your home with pets?',
    options: [
      { label: 'Yes, and they chew everything', traits: { petFriendly: true } },
      { label: 'No pets', traits: { petFriendly: false } },
    ],
  },
  {
    text: 'Would you ever cook with your plant?',
    options: [
      { label: 'Yes, fresh herbs please', traits: { edible: true } },
      { label: 'No, it is just for looks', traits: { edible: false } },
    ],
  },
  {
    text: 'How warm do you keep your place?',
    options: [
      { label: 'Chilly, I save on heating', traits: { warmth: 'chilly' } },
      { label: 'Comfortable room temperature', traits: { warmth: 'mild' } },
      { label: 'Toasty all year round', traits: { warmth: 'warm' } },
    ],
  },
  {
    text: 'How long should your plant stay in your life?',
    options: [
      { label: "For years, I'm committed", traits: { lifespan: 'perennial' } },
      { label: 'One season, then I will move on', traits: { lifespan: 'annual' } },
    ],
  },
  {
    text: 'What kind of look are you after?',
    options: [
      { label: 'Big, glossy leaves', traits: { style: 'leafy' } },
      { label: 'Spiky and sculptural', traits: { style: 'spiky' } },
      { label: 'Soft and feathery', traits: { style: 'soft' } },
      { label: 'Flowers, please', traits: { style: 'blooms' } },
    ],
  },
];
