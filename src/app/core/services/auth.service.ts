import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private static readonly GUEST_STORAGE_KEY = 'join-guest-authenticated';

  private readonly guestAuthenticated = signal(this.readGuestSession());
  private readonly authenticated = signal(this.guestAuthenticated());

  readonly isAuthenticated = this.authenticated.asReadonly();

  setAuthenticated(value: boolean): void {
    this.setGuestSession(false);
    this.authenticated.set(value);
  }

  setGuestAuthenticated(): void {
    this.setGuestSession(true);
    this.authenticated.set(true);
  }

  syncFromSession(hasSession: boolean): boolean {
    if (hasSession) {
      this.setGuestSession(false);
      this.authenticated.set(true);
      return true;
    }

    const isGuest = this.guestAuthenticated();
    this.authenticated.set(isGuest);
    return isGuest;
  }

  private setGuestSession(value: boolean): void {
    this.guestAuthenticated.set(value);

    if (value) {
      sessionStorage.setItem(AuthService.GUEST_STORAGE_KEY, 'true');
      return;
    }

    sessionStorage.removeItem(AuthService.GUEST_STORAGE_KEY);
  }

  private readGuestSession(): boolean {
    return sessionStorage.getItem(AuthService.GUEST_STORAGE_KEY) === 'true';
  }
}
