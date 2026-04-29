import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-welcome',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="welcome" aria-labelledby="welcome-title">
      <h1 id="welcome-title">Willkommen</h1>
    </section>
  `,
  styles: `
    :host {
      display: block;
      block-size: 100%;
    }

    .welcome {
      display: grid;
      place-items: center;
      min-block-size: 100%;
    }

    h1 {
      margin: 0;
      font-size: clamp(2rem, 5vw, 3.5rem);
      font-weight: 700;
      color: var(--neutral-1000);
    }
  `,
})
export class Welcome {}
