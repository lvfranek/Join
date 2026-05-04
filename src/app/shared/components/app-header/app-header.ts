import {
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
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
  private readonly displayName = signal<string>('');

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
    void this.loadUser();
    this.supabase.client.auth.onAuthStateChange((_event, session) => {
      this.applyUser(session?.user ?? null);
    });
  }

  private async loadUser(): Promise<void> {
    const { data } = await this.supabase.client.auth.getUser();
    this.applyUser(data.user ?? null);
  }

  private applyUser(
    user: { user_metadata?: Record<string, unknown>; email?: string | null } | null,
  ): void {
    if (!user) {
      this.displayName.set('');
      return;
    }
    const fullName = (user.user_metadata?.['full_name'] as string | undefined) ?? '';
    const fallback = user.email ? user.email.split('@')[0] : '';
    this.displayName.set(fullName || fallback);
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
    await this.supabase.client.auth.signOut();
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
