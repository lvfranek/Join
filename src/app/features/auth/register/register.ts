import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  private readonly router = inject(Router);
  private readonly supabase = inject(SupabaseService);

  protected readonly isSubmitting = signal(false);
  protected readonly submitError = signal('');
  protected readonly submitSuccess = signal('');

  protected readonly registerForm = new FormGroup({
    fullName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
    confirmPassword: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    acceptPrivacy: new FormControl(false, {
      nonNullable: true,
      validators: [Validators.requiredTrue],
    }),
  });

  protected readonly passwordsMismatch = computed(() => {
    const password = this.registerForm.controls.password.value;
    const confirmPassword = this.registerForm.controls.confirmPassword.value;
    const confirmTouched = this.registerForm.controls.confirmPassword.touched;

    return !!confirmTouched && password !== confirmPassword;
  });

  protected hasError(controlName: keyof Register['registerForm']['controls']): boolean {
    const control = this.registerForm.controls[controlName];

    return control.invalid && (control.dirty || control.touched);
  }

  protected async submitRegister(): Promise<void> {
    if (this.registerForm.invalid || this.passwordsMismatch() || this.isSubmitting()) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.submitError.set('');
    this.submitSuccess.set('');

    const { fullName, email, password } = this.registerForm.getRawValue();

    const { data, error } = await this.supabase.client.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      this.submitError.set(error.message || 'Sign up failed. Please try again.');
      this.isSubmitting.set(false);
      return;
    }

    // Best-effort profile insert for projects that keep a users table.
    if (data.user?.id) {
      await this.supabase.client.from('users').upsert({
        id: data.user.id,
        email,
        full_name: fullName,
        role: 'user',
      });
    }

    this.isSubmitting.set(false);
    this.submitSuccess.set('You signed up successfully. Please log in.');

    await this.router.navigate(['/login'], {
      queryParams: { registered: '1' },
    });
  }
}
