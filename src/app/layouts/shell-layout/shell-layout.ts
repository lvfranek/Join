import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TuiAvatar } from '@taiga-ui/kit';
import { TuiIcon } from '@taiga-ui/core';

import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  readonly label: string;
  readonly path: string;
  readonly icon: string;
}

@Component({
  selector: 'app-shell-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, TuiAvatar, TuiIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shell-layout.html',
  styleUrl: './shell-layout.scss',
})
export class ShellLayout {
  private readonly auth = inject(AuthService);

  protected readonly isAuthenticated = this.auth.isAuthenticated;

  protected readonly navItems = computed<readonly NavItem[]>(() =>
    this.isAuthenticated()
      ? [
          { label: 'Summary', path: '/app/summary', icon: '@tui.layout-dashboard' },
          { label: 'Add Task', path: '/app/add-task', icon: '@tui.plus' },
          { label: 'Board', path: '/app/board', icon: '@tui.kanban' },
          { label: 'Contacts', path: '/app/contacts', icon: '@tui.users' },
        ]
      : [],
  );

  protected readonly publicItems: readonly NavItem[] = [
    { label: 'Hilfe', path: '/help', icon: '@tui.circle-help' },
    { label: 'Datenschutz', path: '/privacy', icon: '@tui.shield' },
    { label: 'Impressum', path: '/legal-notice', icon: '@tui.info' },
  ];
}
