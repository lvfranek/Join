import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-brand',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<a class="brand" routerLink="/">Join</a>`,
  styles: `
    :host {
      display: inline-flex;
    }
    .brand {
      font-size: 1.5rem;
      font-weight: 700;
      padding-inline: 0.75rem;
      color: var(--tui-text-primary);
      text-decoration: none;
    }
  `,
})
export class Brand {}
