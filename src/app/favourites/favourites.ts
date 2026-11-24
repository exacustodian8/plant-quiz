import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FavouritesStore } from '../favourites-store';
import { PlantCard } from '../plant-card/plant-card';
import { Reveal } from '../motion/reveal';
import { BgSection } from '../motion/background';

@Component({
  selector: 'app-favourites',
  imports: [RouterLink, PlantCard, Reveal, BgSection],
  templateUrl: './favourites.html',
  styleUrl: './favourites.css',
})
export class Favourites {
  protected store = inject(FavouritesStore);
}
