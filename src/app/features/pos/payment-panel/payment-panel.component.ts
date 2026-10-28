import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface PaymentPanelData {
  paymentMethod: 'Cash' | 'Card' | 'Mobile';
  amountReceived: number;
  change: number;
}

@Component({
  selector: 'app-payment-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './payment-panel.component.html',
  styleUrl: './payment-panel.component.scss'
})
export class PaymentPanelComponent {

  @Input() totalAmount = 0;

  @Input()
  initialPaymentMethod: 'Cash' | 'Card' | 'Mobile' = 'Cash';

  @Input()
  initialAmountReceived = 0;

  @Output()
  paymentChanged =
    new EventEmitter<PaymentPanelData>();

  @Output()
  paymentCompleted =
    new EventEmitter<PaymentPanelData>();

  @Output()
  closed =
    new EventEmitter<void>();

  paymentMethod:
    'Cash' | 'Card' | 'Mobile' = 'Cash';

  amountReceived = 0;

  ngOnInit(): void {
    this.paymentMethod =
      this.initialPaymentMethod;

    this.amountReceived =
      this.initialAmountReceived;

    this.emitPayment();
  }

  ngOnChanges(): void {

    if (
      this.paymentMethod !==
      this.initialPaymentMethod
    ) {
      this.paymentMethod =
        this.initialPaymentMethod;
    }

    if (this.paymentMethod !== 'Cash') {
      this.amountReceived =
        this.totalAmount;
    } else {
      this.amountReceived =
        this.initialAmountReceived;
    }

    this.emitPayment();
  }

  selectPaymentMethod(
    method: 'Cash' | 'Card' | 'Mobile'
  ): void {

    this.paymentMethod = method;

    if (method === 'Cash') {
      this.amountReceived = 0;
    } else {
      this.amountReceived =
        this.totalAmount;
    }

    this.emitPayment();
  }

  onAmountChanged(): void {

    if (this.amountReceived < 0) {
      this.amountReceived = 0;
    }

    this.emitPayment();
  }

  get change(): number {
    return Math.max(
      this.amountReceived -
      this.totalAmount,
      0
    );
  }

  get isPaymentValid(): boolean {

    if (this.totalAmount <= 0) {
      return false;
    }

    if (this.paymentMethod === 'Cash') {
      return (
        this.amountReceived >=
        this.totalAmount
      );
    }

    return true;
  }

  get paymentButtonText(): string {

    if (this.paymentMethod === 'Cash') {
      return 'Complete Cash Payment';
    }

    if (this.paymentMethod === 'Card') {
      return 'Complete Card Payment';
    }

    return 'Complete Mobile Payment';
  }

  private emitPayment(): void {

    this.paymentChanged.emit({
      paymentMethod:
        this.paymentMethod,

      amountReceived:
        this.amountReceived,

      change:
        this.change
    });
  }

  completePayment(): void {

    if (!this.isPaymentValid) {
      return;
    }

    const payment: PaymentPanelData = {
      paymentMethod:
        this.paymentMethod,

      amountReceived:
        this.paymentMethod === 'Cash'
          ? this.amountReceived
          : this.totalAmount,

      change:
        this.paymentMethod === 'Cash'
          ? this.change
          : 0
    };

    this.paymentCompleted.emit(payment);
  }

  close(): void {
    this.closed.emit();
  }
}