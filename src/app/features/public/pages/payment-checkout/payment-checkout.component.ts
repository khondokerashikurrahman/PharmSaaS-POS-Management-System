import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';

interface SubscriptionPlan {
  id: number;
  code: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  durationDays: number;
}

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

  selectedPlan = '';
  monthlyPrice = 0;
  currency = 'BDT';
  durationDays = 30;
  registrationReference = '';
  loadingPlan = true;

  loading = false;
  errorMessage = '';

  constructor(
    private api: ApiService,
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      this.registrationReference = params.get('registrationReference') || '';
      const planCode = (params.get('plan') || '').trim().toUpperCase();

      if (!this.registrationReference || !planCode) {
        this.router.navigate(['/register']);
        return;
      }

      this.loadingPlan = true;

      this.http.get<SubscriptionPlan[]>(
        `${environment.apiUrl}/public/subscription-plans`
      ).subscribe({
        next: plans => {
          const plan = (plans || []).find(
            item => item.code.toUpperCase() === planCode
          );

          this.loadingPlan = false;

          if (!plan) {
            this.errorMessage = 'The selected subscription plan is unavailable. Please register again and select an available plan.';
            return;
          }

          this.selectedPlan = plan.name;
          this.monthlyPrice = plan.price;
          this.currency = plan.currency;
          this.durationDays = plan.durationDays;
        },
        error: () => {
          this.loadingPlan = false;
          this.errorMessage = 'Could not load subscription plan details. Please try again.';
        }
      });
    });
  }

  startPayment(): void {
    if (!this.registrationReference || !this.selectedPlan || this.loading || this.loadingPlan) {
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
        this.currency = response.currency;
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
