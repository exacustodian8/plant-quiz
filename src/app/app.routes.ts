import { Routes } from '@angular/router';

// Every page is lazy-loaded, so the first paint only ships the shell.
export const routes: Routes = [
  { path: '', title: 'PlantQuiz', loadComponent: () => import('./home/home').then((m) => m.Home) },
  { path: 'quiz', title: 'Take the quiz · PlantQuiz', loadComponent: () => import('./quiz/quiz').then((m) => m.Quiz) },
  { path: 'plants', title: 'All plants · PlantQuiz', loadComponent: () => import('./gallery/gallery').then((m) => m.Gallery) },
  { path: 'plant/:id', title: 'Plant · PlantQuiz', loadComponent: () => import('./plant-detail/plant-detail').then((m) => m.PlantDetail) },
  { path: '**', title: 'Not found · PlantQuiz', loadComponent: () => import('./not-found/not-found').then((m) => m.NotFound) },
];
