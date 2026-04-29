import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  // Main shell (sidebar + header + footer) – public and app pages
  {
    path: '',
    loadComponent: () => import('./layouts/shell-layout/shell-layout').then((m) => m.ShellLayout),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./features/public/welcome/welcome').then((m) => m.Welcome),
      },
      { path: 'welcome', redirectTo: '', pathMatch: 'full' },

      // Public pages – always accessible
      {
        path: 'privacy-policy',
        loadComponent: () =>
          import('./features/public/privacy-policy/privacy-policy').then((m) => m.PrivacyPolicy),
      },
      {
        path: 'legal-notice',
        loadComponent: () =>
          import('./features/public/legal-notice/legal-notice').then((m) => m.LegalNotice),
      },
      {
        path: 'help-site',
        loadComponent: () =>
          import('./features/public/help-site/help-site').then((m) => m.HelpSite),
      },

      // Authenticated pages – without /app/ prefix
      {
        path: 'summary',
        canMatch: [authGuard],
        loadComponent: () => import('./features/app/summary/summary').then((m) => m.Summary),
      },
      {
        path: 'greeting',
        canMatch: [authGuard],
        loadComponent: () => import('./features/app/greeting/greeting').then((m) => m.Greeting),
      },
      {
        path: 'add-task',
        canMatch: [authGuard],
        loadComponent: () => import('./features/app/add-task/add-task').then((m) => m.AddTask),
      },
      {
        path: 'board',
        canMatch: [authGuard],
        loadComponent: () => import('./features/app/board/board').then((m) => m.Board),
      },
      {
        path: 'contacts',
        canMatch: [authGuard],
        loadComponent: () => import('./features/app/contacts/contacts').then((m) => m.Contacts),
      },
    ],
  },

  // Auth shell (login, register) – plain, no sidebar
  {
    path: '',
    loadComponent: () => import('./layouts/auth-layout/auth-layout').then((m) => m.AuthLayout),
    children: [
      {
        path: 'login',
        canMatch: [guestGuard],
        loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
      },
      {
        path: 'register',
        canMatch: [guestGuard],
        loadComponent: () => import('./features/auth/register/register').then((m) => m.Register),
      },
    ],
  },

  { path: '**', redirectTo: '' },
];
