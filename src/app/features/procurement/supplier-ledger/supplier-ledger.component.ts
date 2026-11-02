import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupplierApiService, SupplierResponse } from '../../../core/services/supplier-api.service';
import { SupplierLedgerApiService, SupplierLedgerResponse } from '../../../core/services/supplier-ledger-api.service';
import { SupplierPaymentApiService, SupplierPaymentRequest } from '../../../core/services/supplier-payment-api.service';

@Component({
  selector: 'app-supplier-ledger',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './supplier-ledger.component.html',
  styleUrl: './supplier-ledger.component.scss'
})
export class SupplierLedgerComponent implements OnInit {
  tenantId = 0;
  suppliers: SupplierResponse[] = [];
  selectedSupplierId: number | null = null;
  ledger: SupplierLedgerResponse | null = null;
  searchTerm = '';
  loading = false;
  savingPayment = false;
  errorMessage = '';
  successMessage = '';
  showPaymentForm = false;

  payment = {
    paymentDate: new Date().toISOString().slice(0, 10),
    amount: 0,
    paymentMethod: 'Cash' as SupplierPaymentRequest['paymentMethod'],
    referenceNumber: '',
    notes: ''
  };

  constructor(
    private readonly router: Router,
    private readonly supplierApi: SupplierApiService,
    private readonly ledgerApi: SupplierLedgerApiService,
    private readonly paymentApi: SupplierPaymentApiService
  ) {}

  ngOnInit(): void {
    this.tenantId = this.getTenantId();
    if (!this.tenantId) {
      this.errorMessage = 'Tenant ID পাওয়া যায়নি। আবার login করুন।';
      return;
    }
    this.loadSuppliers();
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

  loadSuppliers(): void {
    this.loading = true;
    this.errorMessage = '';
    this.supplierApi.list(this.tenantId).subscribe({
      next: rows => {
        this.suppliers = (rows || []).filter(
          supplier => String(supplier.status).toUpperCase() === 'ACTIVE'
        );
        if (!this.suppliers.length) {
          this.selectedSupplierId = null;
          this.ledger = null;
          this.loading = false;
          return;
        }
        const exists = this.suppliers.some(s => s.id === this.selectedSupplierId);
        if (!exists) this.selectedSupplierId = this.suppliers[0].id;
        this.loadLedger();
      },
      error: err => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Supplier list load করা যায়নি।';
      }
    });
  }

  onSupplierChange(): void {
    this.searchTerm = '';
    this.successMessage = '';
    this.loadLedger();
  }

  loadLedger(): void {
    if (!this.selectedSupplierId) {
      this.ledger = null;
      this.loading = false;
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    this.ledgerApi.get(this.tenantId, this.selectedSupplierId).subscribe({
      next: response => {
        this.ledger = response;
        this.loading = false;
      },
      error: err => {
        this.ledger = null;
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Supplier Ledger load করা যায়নি।';
      }
    });
  }

  get selectedSupplier(): SupplierResponse | undefined {
    return this.suppliers.find(s => s.id === this.selectedSupplierId);
  }

  get entries(): SupplierLedgerResponse['transactions'] {
    return this.ledger?.transactions || [];
  }

  get filteredEntries(): SupplierLedgerResponse['transactions'] {
    const search = this.searchTerm.trim().toLowerCase();
    if (!search) return this.entries;
    return this.entries.filter(entry =>
      (entry.reference || '').toLowerCase().includes(search) ||
      (entry.description || '').toLowerCase().includes(search) ||
      (entry.type || '').toLowerCase().includes(search)
    );
  }

  get totalDebit(): number {
    return Number(this.ledger?.openingBalance || 0) + Number(this.ledger?.totalPurchases || 0);
  }

  get totalCredit(): number {
    return Number(this.ledger?.totalPayments || 0);
  }

  get currentBalance(): number {
    return Number(this.ledger?.outstandingBalance || 0);
  }

  get purchaseCount(): number {
    return this.entries.filter(e => e.type === 'Purchase').length;
  }

  get paymentCount(): number {
    return this.entries.filter(e => e.type === 'Payment' && e.status === 'PAID').length;
  }

  get returnCount(): number {
    return this.entries.filter(e => e.type === 'Return').length;
  }

  getTypeClass(type: string): string {
    switch (type) {
      case 'Purchase': return 'type-purchase';
      case 'Payment': return 'type-payment';
      default: return 'type-return';
    }
  }

  openPaymentForm(): void {
    if (!this.selectedSupplierId) {
      this.errorMessage = 'প্রথমে Supplier নির্বাচন করুন।';
      return;
    }
    this.payment = {
      paymentDate: new Date().toISOString().slice(0, 10),
      amount: 0,
      paymentMethod: 'Cash',
      referenceNumber: '',
      notes: ''
    };
    this.errorMessage = '';
    this.successMessage = '';
    this.showPaymentForm = true;
  }

  closePaymentForm(): void {
    if (!this.savingPayment) this.showPaymentForm = false;
  }

  submitPayment(): void {
    if (!this.selectedSupplierId || !this.payment.paymentDate ||
        !Number.isFinite(this.payment.amount) || this.payment.amount <= 0) {
      this.errorMessage = 'Payment date এবং সঠিক amount দিন।';
      return;
    }

    const request: SupplierPaymentRequest = {
      supplierId: this.selectedSupplierId,
      paymentDate: this.payment.paymentDate,
      amount: this.payment.amount,
      paymentMethod: this.payment.paymentMethod,
      referenceNumber: this.payment.referenceNumber.trim() || undefined,
      notes: this.payment.notes.trim() || undefined
    };

    this.savingPayment = true;
    this.errorMessage = '';
    this.paymentApi.create(this.tenantId, request).subscribe({
      next: response => {
        this.savingPayment = false;
        this.showPaymentForm = false;
        this.successMessage = `Payment ${response.paymentNumber} সফলভাবে সংরক্ষিত হয়েছে।`;
        this.loadLedger();
      },
      error: err => {
        this.savingPayment = false;
        this.errorMessage = err?.error?.message || 'Payment সংরক্ষণ করা যায়নি।';
      }
    });
  }

  cancelPayment(entry: SupplierLedgerResponse['transactions'][number]): void {
    if (entry.type !== 'Payment' || entry.status !== 'PAID') return;
    const id = Number(entry.id.replace('PAY-', ''));
    if (!Number.isSafeInteger(id) || id <= 0) return;
    if (!confirm(`Payment ${entry.reference} cancel করতে চান?`)) return;

    this.loading = true;
    this.errorMessage = '';
    this.paymentApi.cancel(this.tenantId, id).subscribe({
      next: () => {
        this.successMessage = `Payment ${entry.reference} cancel হয়েছে।`;
        this.loadLedger();
      },
      error: err => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Payment cancel করা যায়নি।';
      }
    });
  }

  exportLedger(): void {
    if (!this.ledger) return;
    const rows = [
      ['Date', 'Reference', 'Type', 'Description', 'Debit', 'Credit', 'Balance', 'Status'],
      ...this.filteredEntries.map(e => [
        e.date || '',
        e.reference || '',
        e.type || '',
        e.description || '',
        String(e.debit || 0),
        String(e.credit || 0),
        String(e.balance || 0),
        e.status || ''
      ])
    ];
    const csv = rows.map(row =>
      row.map(value => '"' + String(value).replace(/"/g, '""') + '"').join(',')
    ).join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `supplier-ledger-${this.selectedSupplierId}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  backToProcurement(): void {
    this.router.navigate(['/app/procurement']);
  }

  trackByReference(index: number, entry: SupplierLedgerResponse['transactions'][number]): string {
    return entry.id || entry.reference;
  }
}
