import { Sunlight, Watering } from './plant';

export interface Traits {
  watering: Watering;
  sunlight: Sunlight;
  petFriendly: boolean;
  edible: boolean;
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
];
