import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-brand',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="brand" routerLink="/">
      <img src="/icons/logo_join_white.png" alt="Join" />
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
    }

    img {
      display: block;
      inline-size: 100.03px;
      block-size: 121.97px;
      object-fit: contain;
    }
  `,
})
export class Brand {}
