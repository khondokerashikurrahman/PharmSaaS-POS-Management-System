
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface SupplierPayment {
  id: string;
  supplier: string;
  date: string;
  reference: string;
  paymentMethod: 'Cash' | 'Bank Transfer' | 'Card' | 'Mobile Banking';
  amount: number;
  status: 'Paid' | 'Pending' | 'Cancelled';
  note: string;
}

@Component({
  selector: 'app-supplier-payment',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './supplier-payment.component.html',
  styleUrl: './supplier-payment.component.scss'
})
export class SupplierPaymentComponent {

  searchTerm = '';
  selectedStatus = 'All';

  showPaymentForm = false;

  selectedSupplier = '';
  paymentDate = '2026-09-13';
  paymentMethod: SupplierPayment['paymentMethod'] = 'Cash';
  amount = 0;
  reference = '';
  note = '';

  suppliers = [
    'Square Pharmaceuticals',
    'Beximco Pharmaceuticals',
    'Incepta Pharmaceuticals',
    'Renata Limited',
    'ACI Limited',
    'Healthcare Pharmaceuticals'
  ];

  payments: SupplierPayment[] = [
    {
      id: 'PAY-2026-018',
      supplier: 'Square Pharmaceuticals',
      date: '11 Sep 2026',
      reference: 'TRX-SP-45821',
      paymentMethod: 'Bank Transfer',
      amount: 20000,
      status: 'Paid',
      note: 'Partial payment against PO-2026-001'
    },
    {
      id: 'PAY-2026-017',
      supplier: 'Beximco Pharmaceuticals',
      date: '10 Sep 2026',
      reference: 'TRX-BEX-78142',
      paymentMethod: 'Mobile Banking',
      amount: 15000,
      status: 'Paid',
      note: 'Supplier account settlement'
    },
    {
      id: 'PAY-2026-016',
      supplier: 'Incepta Pharmaceuticals',
      date: '09 Sep 2026',
      reference: 'TRX-INC-32514',
      paymentMethod: 'Bank Transfer',
      amount: 30000,
      status: 'Paid',
      note: 'Payment against GRN-2026-003'
    },
    {
      id: 'PAY-2026-015',
      supplier: 'Renata Limited',
      date: '08 Sep 2026',
      reference: 'TRX-REN-91452',
      paymentMethod: 'Cash',
      amount: 12000,
      status: 'Pending',
      note: 'Payment awaiting approval'
    },
    {
      id: 'PAY-2026-014',
      supplier: 'ACI Limited',
      date: '07 Sep 2026',
      reference: 'TRX-ACI-65231',
      paymentMethod: 'Bank Transfer',
      amount: 25000,
      status: 'Paid',
      note: 'Purchase settlement'
    },
    {
      id: 'PAY-2026-013',
      supplier: 'Healthcare Pharmaceuticals',
      date: '06 Sep 2026',
      reference: 'TRX-HCP-18452',
      paymentMethod: 'Card',
      amount: 8500,
      status: 'Cancelled',
      note: 'Duplicate payment cancelled'
    }
  ];

  constructor(
    private router: Router
  ) {}

  get filteredPayments(): SupplierPayment[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.payments.filter(payment => {

      const matchesSearch =
        !search ||
        payment.id.toLowerCase().includes(search) ||
        payment.supplier.toLowerCase().includes(search) ||
        payment.reference.toLowerCase().includes(search) ||
        payment.paymentMethod.toLowerCase().includes(search);

      const matchesStatus =
        this.selectedStatus === 'All' ||
        payment.status === this.selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }

  get totalPayments(): number {
    return this.payments.length;
  }

  get paidPayments(): number {
    return this.payments.filter(
      payment => payment.status === 'Paid'
    ).length;
  }

  get pendingPayments(): number {
    return this.payments.filter(
      payment => payment.status === 'Pending'
    ).length;
  }

  get cancelledPayments(): number {
    return this.payments.filter(
      payment => payment.status === 'Cancelled'
    ).length;
  }

  get totalPaidAmount(): number {
    return this.payments
      .filter(payment => payment.status === 'Paid')
      .reduce(
        (total, payment) => total + payment.amount,
        0
      );
  }

  get totalPendingAmount(): number {
    return this.payments
      .filter(payment => payment.status === 'Pending')
      .reduce(
        (total, payment) => total + payment.amount,
        0
      );
  }

  openPaymentForm(): void {
    this.resetForm();
    this.showPaymentForm = true;
  }

  closePaymentForm(): void {
    this.showPaymentForm = false;
    this.resetForm();
  }

  savePayment(): void {

    if (!this.selectedSupplier) {
      alert('Please select a supplier.');
      return;
    }

    if (!this.paymentDate) {
      alert('Please select payment date.');
      return;
    }

    if (this.amount <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }

    if (!this.reference.trim()) {
      alert('Please enter payment reference.');
      return;
    }

    const newPayment: SupplierPayment = {
      id: `PAY-2026-${String(this.payments.length + 19).padStart(3, '0')}`,
      supplier: this.selectedSupplier,
      date: this.formatDate(this.paymentDate),
      reference: this.reference.trim(),
      paymentMethod: this.paymentMethod,
      amount: Number(this.amount),
      status: 'Paid',
      note: this.note.trim() || 'Supplier payment'
    };

    this.payments.unshift(newPayment);

    alert('Supplier payment recorded successfully.');

    this.closePaymentForm();
  }

  viewPayment(payment: SupplierPayment): void {
    alert(
      `Payment: ${payment.id}\n` +
      `Supplier: ${payment.supplier}\n` +
      `Amount: ৳${payment.amount.toLocaleString()}\n` +
      `Method: ${payment.paymentMethod}`
    );
  }

  cancelPayment(payment: SupplierPayment): void {

    if (payment.status !== 'Pending') {
      alert('Only pending payments can be cancelled.');
      return;
    }

    payment.status = 'Cancelled';

    alert(`${payment.id} has been cancelled.`);
  }

  backToProcurement(): void {
    this.router.navigate(['/app/procurement']);
  }

  getStatusClass(status: SupplierPayment['status']): string {
    switch (status) {
      case 'Paid':
        return 'status-paid';

      case 'Pending':
        return 'status-pending';

      case 'Cancelled':
        return 'status-cancelled';

      default:
        return '';
    }
  }

  getMethodClass(
    method: SupplierPayment['paymentMethod']
  ): string {

    switch (method) {
      case 'Cash':
        return 'method-cash';

      case 'Bank Transfer':
        return 'method-bank';

      case 'Card':
        return 'method-card';

      case 'Mobile Banking':
        return 'method-mobile';

      default:
        return '';
    }
  }

  private resetForm(): void {
    this.selectedSupplier = '';
    this.paymentDate = '2026-09-13';
    this.paymentMethod = 'Cash';
    this.amount = 0;
    this.reference = '';
    this.note = '';
  }

  private formatDate(date: string): string {

    const parts = date.split('-');

    if (parts.length !== 3) {
      return date;
    }

    const year = parts[0];
    const month = Number(parts[1]);
    const day = Number(parts[2]);

    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ];

    return `${day} ${monthNames[month - 1]} ${year}`;
  }

  trackByPaymentId(
    index: number,
    payment: SupplierPayment
  ): string {
    return payment.id;
  }
}
