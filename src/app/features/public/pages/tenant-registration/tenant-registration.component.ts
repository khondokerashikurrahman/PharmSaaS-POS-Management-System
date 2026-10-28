
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../../../../environments/environment';

interface RegistrationResponse {
  tenantId: number;
  tenantCode: string;
  ownerUserId: number;
  pharmacyName: string;
  email: string;
  status: string;
  message: string;
}

@Component({
  selector: 'app-tenant-registration',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './tenant-registration.component.html',
  styleUrl: './tenant-registration.component.scss'
})
export class TenantRegistrationComponent {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  selectedPlan = 'Standard';

  pharmacyName = '';
  ownerName = '';
  phone = '';
  email = '';
  address = '';
  password = '';
  confirmPassword = '';
  termsAccepted = false;

  loading = false;
  errorMessage = '';
  successMessage = '';

  register(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (
      !this.pharmacyName.trim() ||
      !this.ownerName.trim() ||
      !this.email.trim() ||
      !this.password
    ) {
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }

    if (this.password.length < 8 || this.password.length > 72) {
      this.errorMessage = 'Password must be between 8 and 72 characters.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    if (!this.termsAccepted) {
      this.errorMessage = 'Please accept the terms and conditions.';
      return;
    }

    this.loading = true;

    const payload = {
      pharmacyName: this.pharmacyName.trim(),
      ownerName: this.ownerName.trim(),
      phone: this.phone.trim(),
      email: this.email.trim().toLowerCase(),
      address: this.address.trim(),
      password: this.password
    };

    this.http
      .post<RegistrationResponse>(
        `${environment.apiUrl}/public/registration`,
        payload
      )
      .subscribe({
        next: (response) => {
          this.loading = false;
          this.successMessage = response.message;

          // Pass the newly created tenant to the checkout page.
          void this.router.navigate(['/checkout'], {
            queryParams: {
              tenantId: response.tenantId,
              plan: this.selectedPlan
            }
          });
        },
        error: (error: HttpErrorResponse) => {
          this.loading = false;

          if (error.status === 409) {
            this.errorMessage =
              'This email is already registered. Please log in instead.';
          } else if (error.status === 400) {
            this.errorMessage =
              error.error?.detail ||
              error.error?.message ||
              'Please check your registration details.';
          } else if (error.status === 0) {
            this.errorMessage =
              'Cannot connect to the backend. Please check the server.';
          } else {
            this.errorMessage =
              error.error?.detail ||
              error.error?.message ||
              'Registration failed. Please try again.';
          }
        }
      });
  }
}
