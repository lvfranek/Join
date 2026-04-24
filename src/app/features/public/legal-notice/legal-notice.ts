import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-legal-notice',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>Impressum</h1>
    <p>Hier kommt das Impressum.</p>
  `,
})
export class LegalNotice {}
