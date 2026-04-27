import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TuiIcon } from '@taiga-ui/core';

import { AuthService } from '../../../core/services/auth.service';
import { Brand } from '../brand/brand';

interface NavItem {
  readonly label: string;
  readonly path: string;
  readonly icon: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, TuiIcon, Brand],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
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
