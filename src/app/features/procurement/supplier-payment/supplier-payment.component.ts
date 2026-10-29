import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupplierApiService, SupplierResponse } from '../../../core/services/supplier-api.service';
import {
  SupplierPaymentApiService,
  SupplierPaymentRequest,
  SupplierPaymentResponse
} from '../../../core/services/supplier-payment-api.service';

type PaymentMethod = 'Cash' | 'Bank Transfer' | 'Card' | 'Mobile Banking';
type PaymentStatus = 'Paid' | 'Cancelled';

interface SupplierPaymentRow {
  id: string;
  supplierId: number;
  supplier: string;
  date: string;
  reference: string;
  paymentMethod: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  note: string;
}

@Component({
  selector: 'app-supplier-payment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './supplier-payment.component.html',
  styleUrl: './supplier-payment.component.scss'
})
export class SupplierPaymentComponent implements OnInit {
  searchTerm = '';
  selectedStatus = 'All';
  showPaymentForm = false;
  selectedSupplier: number | '' = '';
  paymentDate = this.todayLocal();
  paymentMethod: PaymentMethod = 'Cash';
  amount = 0;
  reference = '';
  note = '';
  suppliers: SupplierResponse[] = [];
  payments: SupplierPaymentRow[] = [];
  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';
  private databaseIds: Record<string, number> = {};

  constructor(
    private readonly router: Router,
    private readonly supplierApi: SupplierApiService,
    private readonly paymentApi: SupplierPaymentApiService
  ) {}

  ngOnInit(): void {
    const tenantId = this.getTenantId();
    if (!tenantId) {
      this.errorMessage = 'Tenant ID পাওয়া যায়নি। Tenant account দিয়ে আবার login করুন।';
      return;
    }

    this.loadSuppliers(tenantId);
    this.loadPayments(tenantId);
  }

  private todayLocal(): string {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString().slice(0, 10);
  }

  private getTenantId(): number {
    for (const key of ['tenantId', 'tenant_id']) {
      const id = Number(localStorage.getItem(key) || 0);
      if (Number.isSafeInteger(id) && id > 0) return id;
    }
    try {
      const user = JSON.parse(localStorage.getItem('pharm_user') || '{}');
      for (const candidate of [user.tenantId, user.tenant?.id, user.currentTenantId]) {
        const id = Number(candidate || 0);
        if (Number.isSafeInteger(id) && id > 0) return id;
      }
    } catch {}
    return 0;
  }

  private loadSuppliers(tenantId: number): void {
    this.supplierApi.list(tenantId).subscribe({
      next: rows => {
        this.suppliers = (rows || []).filter(
          supplier => String(supplier.status || '').toUpperCase() === 'ACTIVE'
        );
      },
      error: err => {
        this.errorMessage = err?.error?.message || 'Supplier list load করা যায়নি।';
      }
    });
  }

  private loadPayments(tenantId: number): void {
    this.loading = true;
    this.paymentApi.list(tenantId).subscribe({
      next: rows => {
        this.payments = (rows || []).map(row => this.toRow(row));
        this.loading = false;
        this.errorMessage = '';
      },
      error: err => {
        this.payments = [];
        this.loading = false;
        this.errorMessage = err?.error?.message ||
          'Payment records load করা যায়নি। Backend চালু আছে কি না এবং permission যাচাই করুন।';
      }
    });
  }

  private toRow(row: SupplierPaymentResponse): SupplierPaymentRow {
    this.databaseIds[row.paymentNumber] = Number(row.id);
    return {
      id: row.paymentNumber,
      supplierId: Number(row.supplierId),
      supplier: row.supplierName,
      date: row.paymentDate,
      reference: row.referenceNumber || '—',
      paymentMethod: row.paymentMethod,
      amount: Number(row.amount || 0),
      status: String(row.status).toUpperCase() === 'CANCELLED' ? 'Cancelled' : 'Paid',
      note: row.notes || ''
    };
  }

  get filteredPayments(): SupplierPaymentRow[] {
    const search = this.searchTerm.trim().toLowerCase();
    return this.payments.filter(payment => {
      const matchesSearch = !search ||
        payment.id.toLowerCase().includes(search) ||
        payment.supplier.toLowerCase().includes(search) ||
        payment.reference.toLowerCase().includes(search) ||
        payment.paymentMethod.toLowerCase().includes(search);
      const matchesStatus = this.selectedStatus === 'All' ||
        payment.status === this.selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }

  get totalPayments(): number { return this.payments.length; }
  get paidPayments(): number {
    return this.payments.filter(p => p.status === 'Paid').length;
  }
  get pendingPayments(): number { return 0; }
  get cancelledPayments(): number {
    return this.payments.filter(p => p.status === 'Cancelled').length;
  }
  get totalPaidAmount(): number {
    return this.payments.filter(p => p.status === 'Paid')
      .reduce((sum, p) => sum + p.amount, 0);
  }
  get totalPendingAmount(): number { return 0; }

  openPaymentForm(): void {
    this.resetForm();
    this.showPaymentForm = true;
  }

  closePaymentForm(): void {
    if (this.saving) return;
    this.showPaymentForm = false;
    this.resetForm();
  }

  savePayment(): void {
    if (this.saving) return;
    const tenantId = this.getTenantId();
    if (!tenantId) {
      this.errorMessage = 'Tenant ID পাওয়া যায়নি। আবার login করুন।';
      return;
    }
    if (!this.selectedSupplier) {
      this.errorMessage = 'একটি Supplier নির্বাচন করুন।';
      return;
    }
    if (!this.paymentDate || this.paymentDate > this.todayLocal()) {
      this.errorMessage = 'Payment date সঠিকভাবে নির্বাচন করুন।';
      return;
    }
    if (!Number.isFinite(Number(this.amount)) || Number(this.amount) <= 0) {
      this.errorMessage = 'Payment amount অবশ্যই শূন্যের বেশি হতে হবে।';
      return;
    }
    if (!this.reference.trim()) {
      this.errorMessage = 'Payment reference দিন।';
      return;
    }

    const request: SupplierPaymentRequest = {
      supplierId: Number(this.selectedSupplier),
      paymentDate: this.paymentDate,
      amount: Number(this.amount),
      paymentMethod: this.paymentMethod,
      referenceNumber: this.reference.trim(),
      notes: this.note.trim() || undefined
    };

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.paymentApi.create(tenantId, request).subscribe({
      next: saved => {
        this.payments.unshift(this.toRow(saved));
        this.saving = false;
        this.showPaymentForm = false;
        this.resetForm();
        this.successMessage = 'Supplier payment database-এ save হয়েছে।';
      },
      error: err => {
        this.saving = false;
        this.errorMessage = err?.error?.message ||
          'Payment save হয়নি। Reference, amount এবং backend logs যাচাই করুন।';
      }
    });
  }

  viewPayment(payment: SupplierPaymentRow): void {
    alert(
      `Payment: ${payment.id}\n` +
      `Supplier: ${payment.supplier}\n` +
      `Date: ${payment.date}\n` +
      `Amount: ৳${payment.amount.toLocaleString()}\n` +
      `Method: ${payment.paymentMethod}\n` +
      `Status: ${payment.status}`
    );
  }

  cancelPayment(payment: SupplierPaymentRow): void {
    if (payment.status !== 'Paid') return;
    if (!confirm(`Cancel payment ${payment.id}? This will exclude it from paid totals.`)) return;

    const tenantId = this.getTenantId();
    const databaseId = this.databaseIds[payment.id];
    if (!databaseId) {
      this.errorMessage = 'Payment database ID পাওয়া যায়নি। Payment list reload করুন।';
      return;
    }

    this.paymentApi.cancel(tenantId, databaseId).subscribe({
      next: updated => {
        const index = this.payments.findIndex(p => p.id === payment.id);
        if (index >= 0) this.payments[index] = this.toRow(updated);
        this.successMessage = 'Payment cancelled; record সংরক্ষিত আছে।';
        this.errorMessage = '';
      },
      error: err => {
        this.errorMessage = err?.error?.message || 'Payment cancel করা যায়নি।';
      }
    });
  }

  backToProcurement(): void {
    this.router.navigate(['/app/procurement']);
  }

  getStatusClass(status: PaymentStatus | string): string {
    return status === 'Paid' ? 'status-paid' : 'status-cancelled';
  }

  getMethodClass(method: PaymentMethod | string): string {
    switch (method) {
      case 'Cash': return 'method-cash';
      case 'Bank Transfer': return 'method-bank';
      case 'Card': return 'method-card';
      case 'Mobile Banking': return 'method-mobile';
      default: return '';
    }
  }

  private resetForm(): void {
    this.selectedSupplier = '';
    this.paymentDate = this.todayLocal();
    this.paymentMethod = 'Cash';
    this.amount = 0;
    this.reference = '';
    this.note = '';
  }

  trackByPaymentId(index: number, payment: SupplierPaymentRow): string {
    return payment.id;
  }
}
