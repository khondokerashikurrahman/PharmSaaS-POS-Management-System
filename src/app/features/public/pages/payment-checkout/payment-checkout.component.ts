import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-payment-checkout',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './payment-checkout.component.html',
  styleUrl: './payment-checkout.component.scss'
})
export class PaymentCheckoutComponent {

  selectedPlan = 'Standard';
  monthlyPrice = 1999;

}