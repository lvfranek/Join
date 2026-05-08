import { Component, ElementRef, HostListener, ViewChild, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './app-header.html',
  styleUrl: './app-header.scss',
})
export class AppHeader {
  @ViewChild('profileButton') private profileButton?: ElementRef<HTMLButtonElement>;

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly supabase = inject(SupabaseService);

  protected readonly isAuthenticated = this.authService.isAuthenticated;
  private readonly displayName = computed(() => this.authService.currentUser()?.name ?? '');

  protected readonly initials = computed(() => {
    const name = this.displayName().trim();
    if (!name) return 'G';
    const parts = name.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? '';
    const second = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + second).toUpperCase() || 'G';
  });

  isProfileMenuOpen = false;

  constructor() {
    // Keep AuthService.currentUser in sync with the underlying Supabase session.
    this.supabase.client.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      if (!user) {
        // Don't clear here on plain SIGNED_OUT events — logout flow handles it.
        return;
      }
      const fullName =
        (user.user_metadata?.['full_name'] as string | undefined) ||
        (user.email ? user.email.split('@')[0] : '');
      this.authService.setCurrentUser({
        id: user.id,
        email: user.email ?? '',
        name: fullName,
        phone: (user.user_metadata?.['phone'] as string | undefined) ?? '',
      });
    });
  }

  @HostListener('document:click')
  closeProfileMenu(): void {
    this.focusProfileButtonIfMenuHadFocus();
    this.isProfileMenuOpen = false;
  }

  toggleProfileMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  keepProfileMenuOpen(event: MouseEvent): void {
    event.stopPropagation();
  }

  async logout(): Promise<void> {
    // Try Supabase sign-out first (no-op for guest sessions).
    try {
      await this.supabase.client.auth.signOut();
    } catch (err) {
      console.warn('Supabase sign-out failed', err);
    }
    // Central logout: clears guest flag, JWT token, current user, and notifies
    // listeners (TaskService, ContactService) to invalidate their caches.
    this.authService.logout();
    this.focusProfileButtonIfMenuHadFocus();
    this.isProfileMenuOpen = false;
    await this.router.navigate(['/login']);
  }

  private focusProfileButtonIfMenuHadFocus(): void {
    const activeElement = document.activeElement;

    if (activeElement?.classList.contains('app-header__profile-menu-item')) {
      this.profileButton?.nativeElement.focus();
    }
  }
}
