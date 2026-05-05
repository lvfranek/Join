import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-brand',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.brand-collapsed]': 'collapsed()',
  },
  template: `
    <a class="brand" [class.brand--collapsed]="collapsed()" routerLink="/">
      <img src="/logo/Capa2.svg" alt="Join" />
    </a>
  `,
  styles: `
    :host {
      display: flex;
      justify-content: center;
      inline-size: 100%;
      padding-block-start: 64px;
    }

    .brand {
      display: inline-flex;
      align-items: center;
      text-decoration: none;
      overflow: hidden;
    }

    img {
      display: block;
      inline-size: 100.03px;
      block-size: 121.97px;
      object-fit: contain;
      flex-shrink: 0;
      transition:
        inline-size 0.18s ease,
        block-size 0.18s ease;
    }

    :host(.brand-collapsed) {
      padding-block-start: 1.5rem;
    }

    .brand--collapsed img {
      inline-size: 48px;
      block-size: 48px;
      object-position: center bottom;
    }
  `,
})
export class Brand {
  readonly collapsed = input(false);
}
