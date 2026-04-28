import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './app-header.html',
  styleUrl: './app-header.scss',
})
export class AppHeader {
  @ViewChild('profileButton') private profileButton?: ElementRef<HTMLButtonElement>;

  isProfileMenuOpen = false;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

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

  logout(): void {
    this.authService.setAuthenticated(false);
    this.focusProfileButtonIfMenuHadFocus();
    this.isProfileMenuOpen = false;
    void this.router.navigate(['/login']);
  }

  private focusProfileButtonIfMenuHadFocus(): void {
    const activeElement = document.activeElement;

    if (activeElement?.classList.contains('app-header__profile-menu-item')) {
      this.profileButton?.nativeElement.focus();
    }
  }
}
