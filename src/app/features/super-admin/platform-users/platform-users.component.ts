
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

interface BackendUser {
  id: number;
  fullName: string;
  email: string;
  enabled: boolean;
  systemRole: string;
}

interface CreatePlatformUserRequest {
  fullName: string;
  email: string;
  password: string;
}

interface PlatformUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  lastLogin: string;
  status: 'Active' | 'Inactive' | 'Suspended';
}

@Component({
  selector: 'app-platform-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './platform-users.component.html',
  styleUrl: './platform-users.component.scss'
})
export class PlatformUsersComponent implements OnInit {
  users: PlatformUser[] = [];
  filteredUsers: PlatformUser[] = [];

  searchText = '';
  selectedFilter = 'All';

  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';
  formError = '';

  showAddUserModal = false;

  newUser: CreatePlatformUserRequest = this.emptyForm();

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  private emptyForm(): CreatePlatformUserRequest {
    return {
      fullName: '',
      email: '',
      password: ''
    };
  }

  loadUsers(): void {
    this.loading = true;
    this.errorMessage = '';

    this.api.get<BackendUser[]>('/auth/users').subscribe({
      next: (data) => {
        this.users = (Array.isArray(data) ? data : []).map(user => ({
          id: user.id,
          name: user.fullName || 'Unnamed user',
          email: user.email,
          phone: '—',
          role: user.systemRole === 'SUPER_ADMIN'
            ? 'Super Admin'
            : user.systemRole,
          department: '—',
          lastLogin: '—',
          status: user.enabled ? 'Active' : 'Inactive'
        }));

        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage =
          err?.status === 401
            ? 'Your session has expired. Please log in again.'
            : err?.status === 403
              ? 'Only Super Admin can view platform users.'
              : 'Could not load users from the backend.';

        this.applyFilters();
      }
    });
  }

  get totalUsers(): number {
    return this.users.length;
  }

  get activeUsers(): number {
    return this.users.filter(user => user.status === 'Active').length;
  }

  get inactiveUsers(): number {
    return this.users.filter(user => user.status === 'Inactive').length;
  }

  get suspendedUsers(): number {
    return this.users.filter(user => user.status === 'Suspended').length;
  }

  filterUsers(status: string): void {
    this.selectedFilter = status;
    this.applyFilters();
  }

  searchUsers(): void {
    this.applyFilters();
  }

  private applyFilters(): void {
    const query = this.searchText.trim().toLowerCase();

    this.filteredUsers = this.users.filter(user => {
      const matchesStatus =
        this.selectedFilter === 'All' ||
        user.status === this.selectedFilter;

      const matchesSearch =
        !query ||
        String(user.id).includes(query) ||
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }

  openAddUserModal(): void {
    this.newUser = this.emptyForm();
    this.formError = '';
    this.successMessage = '';
    this.showAddUserModal = true;
  }

  closeAddUserModal(): void {
    if (this.saving) {
      return;
    }

    this.showAddUserModal = false;
    this.formError = '';
  }

  createUser(): void {
    this.formError = '';
    this.successMessage = '';

    const fullName = this.newUser.fullName.trim();
    const email = this.newUser.email.trim().toLowerCase();
    const password = this.newUser.password;

    if (!fullName || !email || !password) {
      this.formError = 'Please fill in all fields.';
      return;
    }

    if (fullName.length > 150) {
      this.formError = 'Name cannot exceed 150 characters.';
      return;
    }

    if (email.length > 255 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.formError = 'Please enter a valid email address.';
      return;
    }

    if (password.length < 8 || password.length > 72) {
      this.formError = 'Password must contain 8 to 72 characters.';
      return;
    }

    const payload: CreatePlatformUserRequest = {
      fullName,
      email,
      password
    };

    this.saving = true;

    this.api.post<BackendUser>(
      '/auth/platform-users',
      payload
    ).subscribe({
      next: (createdUser) => {
        this.saving = false;
        this.showAddUserModal = false;
        this.newUser = this.emptyForm();

        this.successMessage =
          `${createdUser.fullName} was created successfully.`;

        this.loadUsers();
      },
      error: (err) => {
        this.saving = false;

        this.formError =
          err?.status === 400
            ? 'Please check the submitted information.'
            : err?.status === 401
              ? 'Please log in again.'
              : err?.status === 403
                ? 'Only Super Admin can create platform users.'
                : err?.status === 409
                  ? 'This email address is already registered.'
                  : err?.error?.detail ||
                    err?.error?.message ||
                    'Could not create the user. Please try again.';
      }
    });
  }

  viewUser(user: PlatformUser): void {
    alert(
      `User Details\n\n` +
      `ID: ${user.id}\n` +
      `Name: ${user.name}\n` +
      `Email: ${user.email}\n` +
      `Role: ${user.role}\n` +
      `Status: ${user.status}`
    );
  }

  toggleUserStatus(user: PlatformUser): void {
    if (user.status !== 'Active') {
      alert(
        'Reactivating a disabled account is not supported by the current backend API.'
      );
      return;
    }

    if (!confirm(`Disable ${user.name}'s account?`)) {
      return;
    }

    this.api.delete<void>(`/auth/${user.id}`).subscribe({
      next: () => {
        this.successMessage = `${user.name}'s account was disabled.`;
        this.loadUsers();
      },
      error: (err) => {
        alert(
          err?.status === 403
            ? 'Only Super Admin can disable this account.'
            : 'Could not update the account. Please try again.'
        );
      }
    });
  }

  suspendUser(user: PlatformUser): void {
    alert(
      'A separate Suspended status is not implemented in the backend yet. ' +
      'No changes have been made to this account.'
    );
  }
}
