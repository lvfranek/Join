import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-privacy',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>Datenschutz</h1>
    <p>Hier kommt die Datenschutzerklärung.</p>
  `,
})
export class Privacy {}
