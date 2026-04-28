import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TuiButton, TuiHintDirective, TuiIcon } from '@taiga-ui/core';

import { Brand } from '../brand/brand';

interface NavItem {
  readonly label: string;
  readonly path: string;
  readonly icon: string;
}

interface LegalItem {
  readonly label: string;
  readonly path: string;
}

@Component({
  selector: 'app-sidebar',
  host: {
    '(document:click)': 'closeLegalMenu()',
    '(document:keydown.escape)': 'closeLegalMenu()',
  },
  imports: [RouterLink, RouterLinkActive, Brand, TuiIcon, TuiButton, TuiHintDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  readonly collapsed = input(false);
  readonly hidden = input(false);
  readonly compact = input(false);

  readonly toggleMode = output<void>();
  readonly requestClose = output<void>();

  protected readonly isLegalMenuOpen = signal(false);

  protected readonly navItems: readonly NavItem[] = [
    { label: 'Summary', path: '/summary', icon: '@tui.layout-dashboard' },
    { label: 'Add Task', path: '/add-task', icon: '@tui.plus' },
    { label: 'Board', path: '/board', icon: '@tui.kanban' },
    { label: 'Contacts', path: '/contacts', icon: '@tui.users' },
  ];

  protected readonly legalItems: readonly LegalItem[] = [
    { label: 'Privacy Policy', path: '/privacy-policy' },
    { label: 'Legal Notice', path: '/legal-notice' },
  ];

  protected handleNavigation(): void {
    this.closeLegalMenu();

    if (this.compact()) {
      this.requestClose.emit();
    }
  }

  protected toggleLegalMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isLegalMenuOpen.update((open) => !open);
  }

  protected keepLegalMenuOpen(event: MouseEvent): void {
    event.stopPropagation();
  }

  protected closeLegalMenu(): void {
    this.isLegalMenuOpen.set(false);
  }

  protected sidebarToggleLabel(): string {
    if (this.compact()) {
      return this.hidden() ? 'Open sidebar' : 'Close sidebar';
    }

    return this.collapsed() ? 'Expand sidebar' : 'Collapse sidebar';
  }
}
