import { Injectable, computed, signal } from '@angular/core';

const GUEST_STORAGE_KEY = 'auth-guest';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly hasSession = signal(false);
  private readonly guest = signal(this.readGuestFlag());

  readonly isGuest = this.guest.asReadonly();
  readonly isAuthenticated = computed(() => this.hasSession() || this.guest());

  setAuthenticated(value: boolean): void {
    this.hasSession.set(value);
    if (!value) {
      this.setGuest(false);
    }
  }

  setGuestAuthenticated(): void {
    this.setGuest(true);
  }

  syncFromSession(hasSession: boolean): boolean {
    this.hasSession.set(hasSession);
    if (hasSession) {
      this.setGuest(false);
    }
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
  }
}
