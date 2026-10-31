import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { environment } from '../../../../../environments/environment';

interface SubscriptionPlan {
  id: number;
  code: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  durationDays: number;
}

interface RegistrationResponse {
  registrationReference: string;
  pharmacyName: string;
  planCode: string;
  planName: string;
  amount: number;
  currency: string;
  durationDays: number;
  status: string;
  expiresAt: string;
  message: string;
}

interface EmailVerificationResponse {
  success: boolean;
  emailVerified: boolean;
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
export class TenantRegistrationComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  plans: SubscriptionPlan[] = [];
  selectedPlan = '';
  loadingPlans = false;
  planError = '';
  registrationReference = '';
  otp = '';
  otpStep = false;

  pharmacyName = '';
  ownerName = '';
  phone = '';
  email = '';
  address = '';
  password = '';
  confirmPassword = '';
  termsAccepted = false;

  loading = false;
  sendingOtp = false;
  verifyingOtp = false;
  errorMessage = '';
  successMessage = '';

  ngOnInit(): void {
    let requestedPlan = '';

    this.route.queryParamMap.subscribe(params => {
      requestedPlan = (params.get('plan') || '').trim().toUpperCase();
      if (this.plans.length) {
        this.applyRequestedPlan(requestedPlan);
      }
    });

    this.loadingPlans = true;

    this.http.get<SubscriptionPlan[]>(
      `${environment.apiUrl}/public/subscription-plans`
    ).subscribe({
      next: plans => {
        this.plans = plans || [];
        this.loadingPlans = false;
        this.applyRequestedPlan(requestedPlan);

        if (!this.plans.length) {
          this.planError = 'No subscription plans are currently available.';
        }
      },
      error: () => {
        this.loadingPlans = false;
        this.planError = 'Could not load subscription plans. Please refresh the page.';
      }
    });
  }

  private applyRequestedPlan(code: string): void {
    if (!code) {
      return;
    }

    const matchingPlan = this.plans.find(
      plan => plan.code.toUpperCase() === code
    );

    if (matchingPlan) {
      this.selectedPlan = matchingPlan.code;
    }
  }

  selectPlan(code: string): void {
    this.selectedPlan = code;
    this.errorMessage = '';
  }

  get selectedPlanDetails(): SubscriptionPlan | undefined {
    return this.plans.find(plan => plan.code === this.selectedPlan);
  }

  register(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.selectedPlan || !this.plans.some(plan => plan.code === this.selectedPlan)) {
      this.errorMessage = 'Please select a subscription plan.';
      return;
    }

    if (this.loadingPlans) {
      this.errorMessage = 'Please wait while subscription plans are loading.';
      return;
    }

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
      password: this.password,
      planCode: this.selectedPlan
    };

    this.http.post<RegistrationResponse>(
      `${environment.apiUrl}/public/subscription/registration`,
      payload
    ).subscribe({
      next: response => {
        this.registrationReference = response.registrationReference;
        this.sendVerificationCode();
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        this.errorMessage = this.getErrorMessage(
          error,
          'Registration failed. Please try again.'
        );
      }
    });
  }

  private sendVerificationCode(): void {
    this.sendingOtp = true;
    this.errorMessage = '';

    this.http.post<EmailVerificationResponse>(
      `${environment.apiUrl}/public/subscription/registration/${encodeURIComponent(this.registrationReference)}/send-verification`,
      {}
    ).subscribe({
      next: response => {
        this.loading = false;
        this.sendingOtp = false;

        if (response.success && !response.emailVerified) {
          this.otpStep = true;
          this.successMessage = response.message;
        } else if (response.emailVerified) {
          this.goToCheckout();
        } else {
          this.errorMessage = response.message;
        }
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        this.sendingOtp = false;
        this.errorMessage = this.getErrorMessage(
          error,
          'Could not send the verification code.'
        );
      }
    });
  }

  verifyEmail(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!/^[0-9]{6}$/.test(this.otp)) {
      this.errorMessage = 'Please enter the 6-digit verification code.';
      return;
    }

    this.verifyingOtp = true;

    this.http.post<EmailVerificationResponse>(
      `${environment.apiUrl}/public/subscription/registration/${encodeURIComponent(this.registrationReference)}/verify-email`,
      { otp: this.otp }
    ).subscribe({
      next: response => {
        this.verifyingOtp = false;

        if (response.success && response.emailVerified) {
          this.successMessage = response.message;
          this.goToCheckout();
        } else {
          this.errorMessage = response.message;
        }
      },
      error: (error: HttpErrorResponse) => {
        this.verifyingOtp = false;
        this.errorMessage = this.getErrorMessage(
          error,
          'Email verification failed. Please try again.'
        );
      }
    });
  }

  resendOtp(): void {
    if (!this.registrationReference || this.sendingOtp || this.verifyingOtp) {
      return;
    }

    this.sendVerificationCode();
  }

  private goToCheckout(): void {
    void this.router.navigate(['/checkout'], {
      queryParams: {
        registrationReference: this.registrationReference,
        plan: this.selectedPlan
      }
    });
  }

  private getErrorMessage(
    error: HttpErrorResponse,
    fallback: string
  ): string {
    if (error.status === 0) {
      return 'Cannot connect to the backend. Please check the server.';
    }

    return error.error?.detail ||
      error.error?.message ||
      error.error?.title ||
      fallback;
  }
}
