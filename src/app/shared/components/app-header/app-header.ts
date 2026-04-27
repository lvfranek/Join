import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TuiAvatar } from '@taiga-ui/kit';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, TuiAvatar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="header">
      <h1 class="header__title">{{ title() }}</h1>
      <div class="header__actions">
        @if (isAuthenticated()) {
          <span tuiAvatar="LB" size="m" aria-label="User avatar" role="img"></span>
        } @else {
          <a class="header__link" routerLink="/login">Login</a>
          <a class="header__link" routerLink="/register">Register</a>
        }
      </div>
    </header>
  `,
  styleUrl: './app-header.scss',
})
export class AppHeader {
  private readonly auth = inject(AuthService);

  readonly title = input<string>('Kanban Project Management Tool');

  protected readonly isAuthenticated = this.auth.isAuthenticated;
}
