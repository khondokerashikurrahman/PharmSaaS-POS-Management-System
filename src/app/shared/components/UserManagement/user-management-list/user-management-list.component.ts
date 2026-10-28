
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import {
  ManagedUser,
  StaffRole,
  UserServiceService
} from '../../../../core/services/user-service';

import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-user-management-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management-list.component.html',
  styleUrl: './user-management-list.component.scss'
})
export class UserManagementListComponent implements OnInit {
  users: ManagedUser[] = [];

  loading = false;
  error = '';
  success = '';

  search = '';
  roleFilter = 'ALL';

  actionLoadingId: number | string | null = null;

  editingUserId: number | string | null = null;
  selectedRole: StaffRole = 'STAFF';

  readonly roles: StaffRole[] = [
    'PHARMACY_ADMIN',
    'MANAGER',
    'STORE_KEEPER',
    'PHARMACIST',
    'STAFF',
    'CASHIER'
  ];

  constructor(
    private readonly userService: UserServiceService,
    private readonly auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  get isSuperAdmin(): boolean {
    return this.auth.isSuperAdmin();
  }

  loadUsers(): void {
    this.loading = true;
    this.error = '';

    this.userService
      .getUsers()
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (data: ManagedUser[]) => {
          this.users = Array.isArray(data) ? data : [];
        },
        error: (err) => {
          this.error =
            err?.error?.detail ||
            err?.error?.message ||
            'Unable to load users. Please check your API connection and permissions.';
        }
      });
  }

  get filteredUsers(): ManagedUser[] {
    const query = this.search.trim().toLowerCase();

    return this.users.filter((user) => {
      const name = this.getName(user).toLowerCase();
      const email = (user.email || '').toLowerCase();
      const role = this.getRawRole(user);

      const matchesSearch =
        name.includes(query) || email.includes(query);

      const matchesRole =
        this.roleFilter === 'ALL' ||
        role === this.roleFilter;

      return matchesSearch && matchesRole;
    });
  }

  get activeCount(): number {
    return this.users.filter((user) => this.isActive(user)).length;
  }

  getName(user: ManagedUser): string {
    return user.fullName || user.name || 'Unnamed user';
  }

  getRawRole(user: ManagedUser): string {
    return (
      user.membershipRole ||
      user.role ||
      user.systemRole ||
      'STAFF'
    ).toUpperCase().replaceAll(' ', '_');
  }

  getRole(user: ManagedUser): string {
    return this.getRawRole(user).replaceAll('_', ' ');
  }

  getRoleLabel(role: string): string {
    return role.replaceAll('_', ' ');
  }

  isActive(user: ManagedUser): boolean {
    if (typeof user.active === 'boolean') {
      return user.active;
    }

    if (typeof user.enabled === 'boolean') {
      return user.enabled;
    }

    return user.status?.toUpperCase() === 'ACTIVE';
  }

  trackById(_: number, user: ManagedUser): number | string {
    return user.userId ?? user.id;
  }

  startRoleEdit(user: ManagedUser): void {
    if (this.isSuperAdmin || this.actionLoadingId !== null) {
      return;
    }

    this.error = '';
    this.success = '';

    this.editingUserId = user.userId ?? user.id;

    const currentRole = this.getRawRole(user);

    this.selectedRole = this.roles.includes(currentRole as StaffRole)
      ? (currentRole as StaffRole)
      : 'STAFF';
  }

  cancelRoleEdit(): void {
    if (this.actionLoadingId !== null) {
      return;
    }

    this.editingUserId = null;
    this.selectedRole = 'STAFF';
    this.error = '';
  }

  saveRole(user: ManagedUser): void {
    if (this.isSuperAdmin || this.actionLoadingId !== null) {
      return;
    }

    const userId = user.userId ?? user.id;
    const currentRole = this.getRawRole(user);

    if (currentRole === this.selectedRole) {
      this.editingUserId = null;
      return;
    }

    if (!this.roles.includes(this.selectedRole)) {
      this.error = 'Please select a valid role.';
      return;
    }

    this.actionLoadingId = userId;
    this.error = '';
    this.success = '';

    this.userService
      .updateRole(userId, this.selectedRole)
      .pipe(
        finalize(() => {
          this.actionLoadingId = null;
        })
      )
      .subscribe({
        next: () => {
          this.editingUserId = null;
          this.success = `Role updated successfully for ${this.getName(user)}.`;

          // Reload the persisted server data after a successful update.
          this.loadUsers();
        },
        error: (err) => {
          this.error =
            err?.error?.detail ||
            err?.error?.message ||
            'Unable to update this role. Check your permissions.';
        }
      });
  }

  toggleStatus(user: ManagedUser): void {
    if (this.isSuperAdmin || this.actionLoadingId !== null) {
      return;
    }

    const userId = user.userId ?? user.id;
    const active = this.isActive(user);
    const name = this.getName(user);
    const role = this.getRawRole(user);

    if (role === 'TENANT_OWNER') {
      this.error = 'The Tenant Owner status cannot be changed here.';
      return;
    }

    if (role === 'PHARMACY_ADMIN' && !this.auth.isSuperAdmin()) {
      this.error =
        'Only the Tenant Owner can change a Pharmacy Admin status. The server will enforce this permission.';
    }

    const action = active ? 'deactivate' : 'activate';

    if (!confirm(`Are you sure you want to ${action} ${name}?`)) {
      return;
    }

    this.actionLoadingId = userId;
    this.error = '';
    this.success = '';

    this.userService
      .updateStatus(userId, !active)
      .pipe(
        finalize(() => {
          this.actionLoadingId = null;
        })
      )
      .subscribe({
        next: () => {
          this.success = `${name} has been ${active ? 'deactivated' : 'activated'}.`;

          // Reload the state confirmed by the backend.
          this.loadUsers();
        },
        error: (err) => {
          this.error =
            err?.error?.detail ||
            err?.error?.message ||
            'Unable to change user status. Check your permissions.';
        }
      });
  }

  deleteUser(user: ManagedUser): void {
    if (this.isSuperAdmin || this.actionLoadingId !== null) {
      return;
    }

    const role = this.getRawRole(user);

    if (role === 'TENANT_OWNER') {
      this.error = 'The Tenant Owner cannot be removed.';
      return;
    }

    const userId = user.userId ?? user.id;
    const name = this.getName(user);

    if (
      !confirm(
        `Remove ${name} from this pharmacy? Their user account and transaction history will not be deleted.`
      )
    ) {
      return;
    }

    this.actionLoadingId = userId;
    this.error = '';
    this.success = '';

    this.userService
      .deleteMember(userId)
      .pipe(
        finalize(() => {
          this.actionLoadingId = null;
        })
      )
      .subscribe({
        next: () => {
          this.users = this.users.filter(
            (item) => (item.userId ?? item.id) !== userId
          );

          this.editingUserId = null;
          this.success = `${name} was removed from this pharmacy.`;
        },
        error: (err) => {
          this.error =
            err?.error?.detail ||
            err?.error?.message ||
            'Unable to remove this member. Check your permissions.';
        }
      });
  }
}
