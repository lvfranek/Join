import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AppHeader } from '../../shared/components/app-header/app-header';
import { Sidebar } from '../../shared/components/sidebar/sidebar';

@Component({
  selector: 'app-shell-layout',
  imports: [RouterOutlet, AppHeader, Sidebar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shell-layout.html',
  styleUrl: './shell-layout.scss',
})
export class ShellLayout {}
