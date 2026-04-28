import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="padding: 2rem;">
      <h1>Login</h1>
      <button (click)="testSupabase()">Test Supabase Connection</button>
      @if (testResult()) {
        <pre style="margin-top: 1rem; padding: 1rem; background: #f5f5f5;">{{ testResult() }}</pre>
      }
    </div>
  `,
})
export class Login {
  private readonly supabase = inject(SupabaseService);
  readonly testResult = signal<string>('');

  async testSupabase() {
    try {
      const result = await this.supabase.client.auth.getSession();
      this.testResult.set('✓ Supabase Connection OK\n\n' + JSON.stringify(result, null, 2));
    } catch (error) {
      this.testResult.set('✗ Connection Error:\n\n' + JSON.stringify(error, null, 2));
    }
  }
}
