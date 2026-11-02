import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';

interface PaymentStatusResponse {
  transactionReference: string;
  status: string;
  amount: number;
  currency: string;
  planName: string;
  verifiedAt: string | null;
  registrationCompleted: boolean;
  reviewNote?: string | null;
}

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './payment-success.component.html',
  styleUrl: './payment-success.component.scss'
})
export class PaymentSuccessComponent implements OnInit, OnDestroy {
  reference = '';
  payment: PaymentStatusResponse | null = null;
  loading = true;
  message = 'Checking your submitted payment details...';
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private attempts = 0;

  constructor(
    private route: ActivatedRoute,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      this.reference = params.get('reference') || '';

      if (!this.reference) {
        this.loading = false;
        this.message = 'No payment reference was provided.';
        return;
      }

      this.checkStatus();
      this.pollTimer = setInterval(() => {
        if (
          this.attempts >= 15 ||
          this.payment?.registrationCompleted ||
          this.payment?.status === 'PENDING_VERIFICATION' ||
          this.payment?.status === 'REJECTED' ||
          this.payment?.status === 'FAILED' ||
          this.payment?.status === 'VALIDATION_FAILED'
        ) {
          this.stopPolling();
          this.loading = false;
          return;
        }
        this.checkStatus();
      }, 3000);
    });
  }

  checkStatus(): void {
    if (!this.reference) return;
    this.attempts++;

    this.api.get<PaymentStatusResponse>(
      `/public/subscription/payments/${encodeURIComponent(this.reference)}/status`
    ).subscribe({
      next: response => {
        this.payment = response;

        if (response.registrationCompleted) {
          this.message = 'Your payment has been verified. Your pharmacy registration is now awaiting administrator approval.';
          this.loading = false;
          this.stopPolling();
        } else if (response.status === 'PENDING_VERIFICATION') {
          this.message = 'Your payment details have been submitted. A Super Admin must verify the TrxID before your pharmacy registration can be completed.';
          this.loading = false;
          this.stopPolling();
        } else if (response.status === 'REJECTED') {
          this.message = 'Your payment submission was rejected. Please contact PharmSaaS support for assistance.';
          this.loading = false;
          this.stopPolling();
        } else if (
          response.status === 'FAILED' ||
          response.status === 'VALIDATION_FAILED'
        ) {
          this.message = 'Payment verification failed. Please contact support if money was deducted.';
          this.loading = false;
          this.stopPolling();
        } else if (response.status === 'REVIEW_REQUIRED') {
          this.message = 'Your payment requires additional review. Please wait for confirmation.';
          this.loading = false;
          this.stopPolling();
        } else {
          this.message = 'The server is checking your payment status. Please wait...';
        }
      },
      error: () => {
        this.message = 'Unable to retrieve payment status right now. Please refresh this page later.';
        if (this.attempts >= 15) {
          this.loading = false;
          this.stopPolling();
        }
      }
    });
  }

  private stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }
}
