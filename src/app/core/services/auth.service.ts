import { Injectable, computed, signal } from '@angular/core';

const GUEST_STORAGE_KEY = 'auth-guest';
const TOKEN_STORAGE_KEY = 'auth-token';

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  isGuest?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly hasSession = signal(false);
  private readonly guest = signal(this.readGuestFlag());
  private readonly user = signal<CurrentUser | null>(null);
  private readonly logoutListeners = new Set<() => void>();

  readonly isGuest = this.guest.asReadonly();
  readonly currentUser = this.user.asReadonly();
  readonly isAuthenticated = computed(() => this.hasSession() || this.guest());

  setAuthenticated(value: boolean): void {
    this.hasSession.set(value);
    if (!value) {
      this.setGuest(false);
      this.user.set(null);
    }
  }

  setGuestAuthenticated(): void {
    this.setGuest(true);
    if (!this.user()) {
      this.user.set({
        id: 'guest',
        email: 'guest@demo-join.local',
        name: 'Guest',
        isGuest: true,
      });
    }
  }

  syncFromSession(hasSession: boolean): boolean {
    this.hasSession.set(hasSession);
    if (hasSession) {
      this.setGuest(false);
    }
    return this.isAuthenticated();
  }

  loginAsGuest(): void {
    this.setGuestAuthenticated();
  }

  setCurrentUser(user: CurrentUser | null): void {
    this.user.set(user);
  }

  updateCurrentUser(patch: Partial<CurrentUser>): void {
    const current = this.user();
    if (!current) return;
    this.user.set({ ...current, ...patch });
  }

  setToken(token: string): void {
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } catch {
      // localStorage may be unavailable; ignore.
    }
  }

  getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  }

  clearToken(): void {
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  /** Register a callback that fires when the user logs out (or the session ends). */
  onLogout(callback: () => void): void {
    this.logoutListeners.add(callback);
  }

  logout(): void {
    this.hasSession.set(false);
    this.setGuest(false);
    this.user.set(null);
    this.clearToken();
    for (const cb of this.logoutListeners) {
      try {
        cb();
      } catch (err) {
        console.error('Logout listener failed', err);
      }
    }
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
