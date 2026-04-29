import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly supabase = inject(SupabaseService);
  protected readonly isSubmitting = signal(false);
  protected readonly submitError = signal('');
  protected readonly submitSuccess = signal('');
  protected readonly loginForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)],
    }),
  });

  constructor() {
    if (this.route.snapshot.queryParamMap.get('registered') === '1') {
      this.submitSuccess.set('You signed up successfully. Please log in.');

      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { registered: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }
  }

  protected hasError(controlName: 'email' | 'password'): boolean {
    const control = this.loginForm.controls[controlName];

    return control.invalid && (control.dirty || control.touched);
  }

  protected async submitLogin(): Promise<void> {
    if (this.loginForm.invalid || this.isSubmitting()) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.submitError.set('');
    this.submitSuccess.set('');

    const { email, password } = this.loginForm.getRawValue();
    const { error } = await this.supabase.client.auth.signInWithPassword({ email, password });

    if (error) {
      this.submitError.set('Check your email and password. Please try again.');
      this.isSubmitting.set(false);
      return;
    }

    this.auth.setAuthenticated(true);
    this.isSubmitting.set(false);
    await this.router.navigateByUrl('/summary');
  }

  protected continueAsGuest(): void {
    this.auth.loginAsGuest();
    void this.router.navigateByUrl('/summary');
  }
}
