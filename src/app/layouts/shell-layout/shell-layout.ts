import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AppHeader } from '../../shared/components/app-header/app-header';
import { Sidebar } from '../../shared/components/sidebar/sidebar';

type SidebarMode = 'expanded' | 'collapsed' | 'hidden';

@Component({
  selector: 'app-shell-layout',
  host: {
    '(window:resize)': 'onViewportResize()',
  },
  imports: [RouterOutlet, AppHeader, Sidebar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shell-layout.html',
  styleUrl: './shell-layout.scss',
})
export class ShellLayout {
  private static readonly COMPACT_BREAKPOINT = 1024;
  private static readonly STORAGE_KEY = 'sidebar-mode';

  private readonly viewportWidth = signal(window.innerWidth);
  private readonly sidebarMode = signal<SidebarMode>(ShellLayout.resolveInitialMode());

  private static resolveInitialMode(): SidebarMode {
    if (window.innerWidth <= ShellLayout.COMPACT_BREAKPOINT) return 'hidden';
    const stored = localStorage.getItem(ShellLayout.STORAGE_KEY);
    if (stored === 'collapsed' || stored === 'expanded') return stored;
    return 'expanded';
  }

  private persistMode(mode: SidebarMode): void {
    if (mode !== 'hidden') {
      localStorage.setItem(ShellLayout.STORAGE_KEY, mode);
    }
  }

  protected readonly isCompact = computed(
    () => this.viewportWidth() <= ShellLayout.COMPACT_BREAKPOINT,
  );
  protected readonly isSidebarHidden = computed(() => this.sidebarMode() === 'hidden');
  protected readonly isSidebarCollapsed = computed(() => this.sidebarMode() === 'collapsed');
  protected readonly isSidebarExpanded = computed(() => this.sidebarMode() === 'expanded');

  protected toggleSidebar(): void {
    if (this.isCompact()) {
      this.sidebarMode.set(this.isSidebarHidden() ? 'collapsed' : 'hidden');
      return;
    }

    const next = this.isSidebarExpanded() ? 'collapsed' : 'expanded';
    this.sidebarMode.set(next);
    this.persistMode(next);
  }

  protected closeSidebar(): void {
    if (this.isCompact()) {
      this.sidebarMode.set('hidden');
    }
  }

  protected onViewportResize(): void {
    const width = window.innerWidth;
    const wasCompact = this.isCompact();

    this.viewportWidth.set(width);

    if (wasCompact && !this.isCompact()) {
      const stored = localStorage.getItem(ShellLayout.STORAGE_KEY);
      const mode: SidebarMode = stored === 'collapsed' ? 'collapsed' : 'expanded';
      this.sidebarMode.set(mode);
    }

    if (!wasCompact && this.isCompact()) {
      this.sidebarMode.set('hidden');
    }
  }
}
