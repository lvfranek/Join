import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-help',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>Hilfe</h1>
    <p>Hier kommt der Hilfe-Inhalt.</p>
  `,
})
export class Help {}
