import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AppFooter } from '../../shared/components/app-footer/app-footer';
import { Brand } from '../../shared/components/brand/brand';

@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet, AppFooter, Brand],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './auth-layout.html',
  styleUrl: './auth-layout.scss',
})
export class AuthLayout {
  protected readonly footerLinks = [
    { label: 'Impressum', path: '/legal-notice' },
    { label: 'Datenschutz', path: '/privacy' },
  ] as const;
}
