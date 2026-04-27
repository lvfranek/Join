import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { Brand } from '../brand/brand';

interface NavItem {
  readonly label: string;
  readonly path: string;
  readonly icon: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, Brand],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  protected readonly navItems: readonly NavItem[] = [
    { label: 'Summary', path: '/app/summary', icon: '/icons/Summary.png' },
    { label: 'Add Task', path: '/app/add-task', icon: '/icons/Add task.png' },
    { label: 'Board', path: '/app/board', icon: '/icons/Board.png' },
    { label: 'Contacts', path: '/app/contacts', icon: '/icons/Contacts.png' },
  ];
}
