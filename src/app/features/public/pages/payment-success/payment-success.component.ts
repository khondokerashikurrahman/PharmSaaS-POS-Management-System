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
  result = '';
  payment: PaymentStatusResponse | null = null;

  loading = true;
  message = 'Checking your payment with the server...';
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private attempts = 0;

  constructor(
    private route: ActivatedRoute,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      this.reference = params.get('reference') || '';
      this.result = params.get('result') || '';

      if (!this.reference) {
        this.loading = false;
        this.message = 'No payment reference was provided.';
        return;
      }

      if (this.result === 'failed' || this.result === 'cancelled') {
        this.loading = false;
        this.message = this.result === 'failed'
          ? 'The payment was not completed. You can return to checkout and try again.'
          : 'The payment was cancelled. You can return to checkout and try again.';
        this.loadStatus();
        return;
      }

      this.checkStatus();
      this.pollTimer = setInterval(() => {
        if (this.attempts >= 15 || this.payment?.registrationCompleted) {
          this.stopPolling();
          this.loading = false;
          return;
        }

        this.checkStatus();
      }, 3000);
    });
  }

  checkStatus(): void {
    if (!this.reference) {
      return;
    }

    this.attempts++;

    this.api.get<PaymentStatusResponse>(
      `/public/subscription/payments/${encodeURIComponent(this.reference)}/status`
    ).subscribe({
      next: response => {
        this.payment = response;

        if (response.registrationCompleted) {
          this.message = 'Payment verified. Your pharmacy registration is awaiting administrator approval.';
          this.loading = false;
          this.stopPolling();
        } else if (response.status === 'REVIEW_REQUIRED') {
          this.message = 'Your payment requires additional review. Please wait for confirmation.';
          this.loading = false;
          this.stopPolling();
        } else if (
          response.status === 'FAILED' ||
          response.status === 'VALIDATION_FAILED'
        ) {
          this.message = 'Payment could not be verified. Please contact support if money was deducted.';
          this.loading = false;
          this.stopPolling();
        } else {
          this.message = 'Payment received. Waiting for server-side verification...';
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

  loadStatus(): void {
    if (!this.reference) {
      return;
    }

    this.api.get<PaymentStatusResponse>(
      `/public/subscription/payments/${encodeURIComponent(this.reference)}/status`
    ).subscribe({
      next: response => this.payment = response,
      error: () => {}
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
