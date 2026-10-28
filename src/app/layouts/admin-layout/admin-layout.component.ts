import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent {

  sidebarOpen = true;

  profileDropdownOpen = false;
  notificationDropdownOpen = false;

  constructor(
    private authService: AuthService
  ) {}

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;

    this.profileDropdownOpen = false;
    this.notificationDropdownOpen = false;
  }

  toggleProfileDropdown(): void {
    this.profileDropdownOpen = !this.profileDropdownOpen;
    this.notificationDropdownOpen = false;
  }

  toggleNotificationDropdown(): void {
    this.notificationDropdownOpen = !this.notificationDropdownOpen;
    this.profileDropdownOpen = false;
  }

  logout(): void {
    this.authService.logout();
  }

  closeDropdowns(): void {
    this.profileDropdownOpen = false;
    this.notificationDropdownOpen = false;
  }

}