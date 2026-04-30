import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TuiButton, TuiHintDirective } from '@taiga-ui/core';

import { Brand } from '../brand/brand';

interface NavItem {
  readonly label: string;
  readonly path: string;
  readonly iconPath: string;
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
  imports: [NgOptimizedImage, RouterLink, RouterLinkActive, Brand, TuiButton, TuiHintDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  readonly collapsed = input(false);
  readonly hidden = input(false);
  readonly compact = input(false);
  readonly publicMode = input(false);

  readonly toggleMode = output<void>();
  readonly requestClose = output<void>();

  protected readonly isLegalMenuOpen = signal(false);

  private readonly appNavItems: readonly NavItem[] = [
    { label: 'Summary', path: '/summary', iconPath: '/icons/Summary.svg' },
    { label: 'Add Task', path: '/add-task', iconPath: '/icons/Add task.svg' },
    { label: 'Board', path: '/board', iconPath: '/icons/Board.svg' },
    { label: 'Contacts', path: '/contacts', iconPath: '/icons/Contacts.svg' },
  ];

  private readonly publicNavItems: readonly NavItem[] = [
    { label: 'Login', path: '/login', iconPath: '/icons/login.svg' },
  ];

  protected readonly navItems = computed(() =>
    this.publicMode() ? this.publicNavItems : this.appNavItems,
  );

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
