import { Component, ElementRef, HostListener, ViewChild, inject } from '@angular/core';
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

  isProfileMenuOpen = false;

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
