import { Injectable, computed, signal } from '@angular/core';

const GUEST_STORAGE_KEY = 'auth-guest';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly hasSession = signal(false);
  private readonly guest = signal(this.readGuestFlag());
  private static readonly GUEST_STORAGE_KEY = 'join-guest-authenticated';

  private readonly guestAuthenticated = signal(this.readGuestSession());
  private readonly authenticated = signal(this.guestAuthenticated());

  readonly isGuest = this.guest.asReadonly();
  readonly isAuthenticated = computed(() => this.hasSession() || this.guest());

  setAuthenticated(value: boolean): void {
    this.hasSession.set(value);
    if (!value) {
      this.setGuest(false);
    }
    this.setGuestSession(false);
    this.authenticated.set(value);
  }

  setGuestAuthenticated(): void {
    this.setGuestSession(true);
    this.authenticated.set(true);
  }

  syncFromSession(hasSession: boolean): boolean {
    this.hasSession.set(hasSession);
    return this.isAuthenticated();
  }

  loginAsGuest(): void {
    this.setGuest(true);
  }

  logout(): void {
    this.hasSession.set(false);
    this.setGuest(false);
  }

  private setGuest(value: boolean): void {
    this.guest.set(value);
    try {
      if (value) {
        sessionStorage.setItem(GUEST_STORAGE_KEY, '1');
      } else {
        sessionStorage.removeItem(GUEST_STORAGE_KEY);
      }
    } catch {
      // sessionStorage might be unavailable; ignore.
    }
  }

  private readGuestFlag(): boolean {
    try {
      return sessionStorage.getItem(GUEST_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
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
