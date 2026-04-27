import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AppFooter } from '../../shared/components/app-footer/app-footer';
import { AppHeader } from '../../shared/components/app-header/app-header';
import { Sidebar } from '../../shared/components/sidebar/sidebar';

@Component({
  selector: 'app-shell-layout',
  imports: [RouterOutlet, AppHeader, AppFooter, Sidebar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shell-layout.html',
  styleUrl: './shell-layout.scss',
})
export class ShellLayout {}
