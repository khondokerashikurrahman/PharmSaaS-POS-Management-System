
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { finalize } from 'rxjs';
import {
  CreateManagedUser,
  StaffRole,
  UserServiceService
} from '../../../../core/services/user-service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-user-management-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-management-form.component.html',
  styleUrl: './user-management-form.component.scss'
})
export class UserManagementFormComponent {
  @Output() userCreated = new EventEmitter<void>();

  loading = false;
  error = '';
  success = '';

  readonly isSuperAdmin: boolean;

  readonly roles: { value: StaffRole; label: string }[] = [
    { value: 'PHARMACY_ADMIN', label: 'Pharmacy Admin' },
    { value: 'MANAGER', label: 'Manager' },
    { value: 'STORE_KEEPER', label: 'Store Keeper' },
    { value: 'PHARMACIST', label: 'Pharmacist' },
    { value: 'STAFF', label: 'Staff' },
    { value: 'CASHIER', label: 'Cashier' }
  ];

  form;

  constructor(
    private readonly fb: FormBuilder,
    private readonly users: UserServiceService,
    auth: AuthService
  ) {
    this.isSuperAdmin = auth.isSuperAdmin();

    this.form = this.fb.nonNullable.group({
      fullName: ['', [Validators.required, Validators.maxLength(120)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      role: ['STAFF' as StaffRole, Validators.required]
    });
  }

  submit(): void {
    this.error = '';
    this.success = '';

    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.form.getRawValue() as CreateManagedUser;

    this.loading = true;

    this.users.createUser(payload)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: () => {
          this.success = 'User created successfully.';
          this.form.reset({
            fullName: '',
            email: '',
            password: '',
            role: 'STAFF'
          });
          this.userCreated.emit();
        },
        error: (err) => {
          this.error =
            err?.error?.message ||
            (err.status === 403
              ? 'You do not have permission to create this user.'
              : err.status === 409
                ? 'This email may already be registered.'
                : 'Could not create user. Check the backend API.');
        }
      });
  }
}
