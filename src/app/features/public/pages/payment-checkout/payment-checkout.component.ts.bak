import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';

interface PaymentInitiationResponse {
  transactionReference: string;
  gatewayUrl: string;
  amount: number;
  currency: string;
  status: string;
}

@Component({
  selector: 'app-payment-checkout',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './payment-checkout.component.html',
  styleUrl: './payment-checkout.component.scss'
})
export class PaymentCheckoutComponent implements OnInit {

  selectedPlan = 'Standard';
  monthlyPrice = 1999;
  registrationReference = '';

  loading = false;
  errorMessage = '';

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      this.registrationReference = params.get('registrationReference') || '';
      const plan = params.get('plan');

      if (plan) {
        this.selectedPlan = plan;
      }

      const prices: Record<string, number> = {
        BASIC: 999,
        STANDARD: 1999,
        PREMIUM: 3999
      };

      this.monthlyPrice =
        prices[this.selectedPlan.toUpperCase()] ?? 1999;

      if (!this.registrationReference) {
        this.router.navigate(['/register']);
      }
    });
  }

  startPayment(): void {
    if (!this.registrationReference || this.loading) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.api.post<PaymentInitiationResponse>(
      `/public/subscription/payments/${encodeURIComponent(this.registrationReference)}/initiate`,
      {}
    ).subscribe({
      next: response => {
        if (!response.gatewayUrl) {
          this.loading = false;
          this.errorMessage = 'Payment gateway URL was not received. Please try again.';
          return;
        }

        this.monthlyPrice = response.amount;
        window.location.href = response.gatewayUrl;
      },
      error: error => {
        this.loading = false;

        this.errorMessage =
          error?.error?.detail ||
          error?.error?.message ||
          'Unable to start payment. Please try again later.';
      }
    });
  }
}
