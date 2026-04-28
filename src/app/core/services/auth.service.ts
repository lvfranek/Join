import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authenticated = signal(false);

  readonly isAuthenticated = this.authenticated.asReadonly();

  setAuthenticated(value: boolean): void {
    this.authenticated.set(value);
  }

  syncFromSession(hasSession: boolean): boolean {
    this.authenticated.set(hasSession);
    return hasSession;
  }
}
