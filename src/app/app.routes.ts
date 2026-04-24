import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  // Auth shell (login, register) – plain, no sidebar
  {
    path: '',
    canMatch: [guestGuard],
    loadComponent: () => import('./layouts/auth-layout/auth-layout').then((m) => m.AuthLayout),
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register').then((m) => m.Register),
      },
    ],
  },

  // Main shell (sidebar + header + footer) – public and app pages
  {
    path: '',
    loadComponent: () => import('./layouts/shell-layout/shell-layout').then((m) => m.ShellLayout),
    children: [
      // Public pages – always accessible
      {
        path: 'privacy',
        loadComponent: () => import('./features/public/privacy/privacy').then((m) => m.Privacy),
      },
      {
        path: 'legal-notice',
        loadComponent: () =>
          import('./features/public/legal-notice/legal-notice').then((m) => m.LegalNotice),
      },
      {
        path: 'help',
        loadComponent: () => import('./features/public/help/help').then((m) => m.Help),
      },

      // Authenticated pages
      {
        path: 'app',
        canMatch: [authGuard],
        children: [
          { path: '', redirectTo: 'summary', pathMatch: 'full' },
          {
            path: 'summary',
            loadComponent: () => import('./features/app/summary/summary').then((m) => m.Summary),
          },
          {
            path: 'add-task',
            loadComponent: () => import('./features/app/add-task/add-task').then((m) => m.AddTask),
          },
          {
            path: 'board',
            loadComponent: () => import('./features/app/board/board').then((m) => m.Board),
          },
          {
            path: 'contacts',
            loadComponent: () => import('./features/app/contacts/contacts').then((m) => m.Contacts),
          },
        ],
      },

      { path: '', redirectTo: 'help', pathMatch: 'full' },
    ],
  },

  { path: '**', redirectTo: '' },
];
