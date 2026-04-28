import { Component, HostListener } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './app-header.html',
  styleUrl: './app-header.scss',
})
export class AppHeader {
  isProfileMenuOpen = false;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  @HostListener('document:click')
  closeProfileMenu(): void {
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
    this.isProfileMenuOpen = false;
    void this.router.navigate(['/login']);
  }
}
