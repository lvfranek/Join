import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h1>Login</h1>`,
})
export class Login {}
