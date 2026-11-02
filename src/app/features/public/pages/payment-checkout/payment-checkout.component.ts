import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { environment } from '../../../../../environments/environment';
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

interface ManualPaymentResponse {
  paymentReference: string;
  status: string;
  amount: number;
  currency: string;
  planName: string;
}

@Component({
  selector: 'app-payment-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
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

  paymentMethod = 'BKASH';
  senderNumber = '';
  transactionId = '';

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
        void this.router.navigate(['/register']);
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
            this.errorMessage = 'The selected subscription plan is unavailable. Please register again.';
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

  submitManualPayment(): void {
    if (!this.registrationReference || !this.selectedPlan || this.loading || this.loadingPlan) {
      return;
    }

    const sender = this.senderNumber.trim();
    const trx = this.transactionId.trim();

    if (!sender || !trx) {
      this.errorMessage = 'Please enter the sender number and Transaction ID.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.api.post<ManualPaymentResponse>(
      `/public/subscription/payments/${encodeURIComponent(this.registrationReference)}/manual`,
      {
        paymentMethod: this.paymentMethod,
        senderNumber: sender,
        transactionId: trx
      }
    ).subscribe({
      next: response => {
        if (!response?.paymentReference) {
          this.loading = false;
          this.errorMessage = 'Payment was submitted but no payment reference was returned. Please contact support.';
          return;
        }

        void this.router.navigate(['/payment-success'], {
          queryParams: { reference: response.paymentReference }
        });
      },
      error: error => {
        this.loading = false;
        this.errorMessage =
          error?.error?.detail ||
          error?.error?.message ||
          'Unable to submit payment details. Please check the information and try again.';
      }
    });
  }
}
