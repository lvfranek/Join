import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TuiAvatar } from '@taiga-ui/kit';
import { TuiIcon } from '@taiga-ui/core';

interface NavItem {
  readonly label: string;
  readonly path: string;
  readonly icon: string;
}

@Component({
  selector: 'app-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, TuiAvatar, TuiIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class Layout {
  protected readonly navItems: readonly NavItem[] = [
    { label: 'Summary', path: '/summary', icon: '@tui.layout-dashboard' },
    { label: 'Add Task', path: '/add-task', icon: '@tui.plus' },
    { label: 'Board', path: '/board', icon: '@tui.kanban' },
    { label: 'Contacts', path: '/contacts', icon: '@tui.users' },
  ];
}
