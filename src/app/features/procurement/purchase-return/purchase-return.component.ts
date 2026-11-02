import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GrnApiService, GrnResponse } from '../../../core/services/grn-api.service';
import { StoreApiService, StoreResponse } from '../../../core/services/store-api.service';
import {
  PurchaseReturnApiService,
  PurchaseReturnResponse
} from '../../../core/services/purchase-return-api.service';

interface ReturnLine {
  grnItemId: number;
  medicineName: string;
  batchNumber: string;
  receivedQuantity: number;
  alreadyReturned: number;
  remainingQuantity: number;
  returnQty: number;
  unitPrice: number;
  reason: string;
}

@Component({
  selector: 'app-purchase-return',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './purchase-return.component.html',
  styleUrl: './purchase-return.component.scss'
})
export class PurchaseReturnComponent implements OnInit {
  tenantId = 0;
  grns: GrnResponse[] = [];
  stores: StoreResponse[] = [];
  returns: PurchaseReturnResponse[] = [];

  selectedGrnId: number | null = null;
  selectedStoreId: number | null = null;
  selectedGrn: GrnResponse | null = null;

  returnDate = new Date().toISOString().slice(0, 10);
  returnReason = 'Damaged / Defective';
  notes = '';

  lines: ReturnLine[] = [];
  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';

  readonly returnReasons = [
    'Damaged / Defective',
    'Expired / Near Expiry',
    'Wrong Medicine',
    'Wrong Quantity',
    'Quality Issue',
    'Other'
  ];

  constructor(
    private router: Router,
    private grnApi: GrnApiService,
    private storeApi: StoreApiService,
    private returnApi: PurchaseReturnApiService
  ) {}

  ngOnInit(): void {
    this.tenantId = this.getTenantId();
    if (!this.tenantId) {
      this.errorMessage = 'Tenant ID পাওয়া যায়নি। আবার login করুন।';
      return;
    }
    this.loadData();
  }

  private getTenantId(): number {
    const direct = localStorage.getItem('tenantId') ||
      localStorage.getItem('tenant_id');
    if (direct && Number(direct) > 0) return Number(direct);

    try {
      const user = JSON.parse(localStorage.getItem('pharm_user') || '{}');
      return Number(user.tenantId || user.tenant?.id || user.currentTenantId || 0);
    } catch {
      return 0;
    }
  }

  loadData(): void {
    this.loading = true;
    this.errorMessage = '';

    this.grnApi.list(this.tenantId).subscribe({
      next: data => {
        this.grns = (data || []).filter(x =>
          (x.status || '').toUpperCase() === 'RECEIVED'
        );
        this.loading = false;
      },
      error: err => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'GRN data load করা যায়নি।';
      }
    });

    this.storeApi.getAll(this.tenantId).subscribe({
      next: data => {
        this.stores = (data || []).filter(x =>
          (x.status || '').toUpperCase() === 'ACTIVE'
        );
      },
      error: err => {
        this.errorMessage = err?.error?.message || 'Store data load করা যায়নি।';
      }
    });

    this.loadReturns();
  }

  loadReturns(): void {
    this.returnApi.list(this.tenantId).subscribe({
      next: data => this.returns = data || [],
      error: err => this.errorMessage =
        err?.error?.message || 'Purchase Return history load করা যায়নি।'
    });
  }

  onGrnChange(): void {
    this.selectedGrn = this.grns.find(x => x.id === Number(this.selectedGrnId)) || null;
    this.lines = [];

    if (!this.selectedGrn) return;

    const completedByItem = new Map<number, number>();
    for (const ret of this.returns) {
      if (ret.status?.toUpperCase() !== 'COMPLETED') continue;
      if (ret.grnId !== this.selectedGrn.id) continue;

      for (const item of ret.items || []) {
        completedByItem.set(
          item.grnItemId,
          (completedByItem.get(item.grnItemId) || 0) + Number(item.quantity || 0)
        );
      }
    }

    this.lines = (this.selectedGrn.items || []).map(item => {
      const received = Number(item.quantity || 0);
      const alreadyReturned = completedByItem.get(item.id) || 0;
      return {
        grnItemId: item.id,
        medicineName: item.medicineName,
        batchNumber: item.batchNumber,
        receivedQuantity: received,
        alreadyReturned,
        remainingQuantity: Math.max(0, received - alreadyReturned),
        returnQty: 0,
        unitPrice: Number(item.purchasePrice || 0),
        reason: this.returnReason
      };
    }).filter(x => x.remainingQuantity > 0);
  }

  get supplierName(): string {
    return this.selectedGrn?.supplierName || '';
  }

  get totalItems(): number {
    return this.lines.filter(x => x.returnQty > 0).length;
  }

  get totalReturnQty(): number {
    return this.lines.reduce((sum, x) => sum + Number(x.returnQty || 0), 0);
  }

  get returnValue(): number {
    return this.lines.reduce(
      (sum, x) => sum + Number(x.returnQty || 0) * x.unitPrice, 0
    );
  }

  get totalRefund(): number {
    return this.returnValue;
  }

  calculateTotal(line: ReturnLine): void {
    if (line.returnQty < 0) line.returnQty = 0;
    if (line.returnQty > line.remainingQuantity) {
      line.returnQty = line.remainingQuantity;
    }
  }

  onReturnReasonChange(reason: string): void {
    this.lines.forEach(item => item.reason = reason);
  }

  saveDraft(): void {
    this.saveReturn(false);
  }

  submitReturn(): void {
    this.saveReturn(true);
  }

  private saveReturn(submit: boolean): void {
    if (!this.selectedGrn || !this.selectedGrnId) {
      this.errorMessage = 'একটি Received GRN নির্বাচন করুন।';
      return;
    }
    if (!this.selectedStoreId) {
      this.errorMessage = 'একটি Active Store নির্বাচন করুন।';
      return;
    }
    if (!this.returnDate || this.returnDate > new Date().toISOString().slice(0, 10)) {
      this.errorMessage = 'সঠিক Return Date নির্বাচন করুন।';
      return;
    }

    const items = this.lines
      .filter(x => x.returnQty > 0)
      .map(x => ({
        grnItemId: x.grnItemId,
        quantity: Number(x.returnQty),
        reason: x.reason
      }));

    if (!items.length) {
      this.errorMessage = 'কমপক্ষে একটি item-এর Return Quantity দিতে হবে।';
      return;
    }

    if (this.lines.some(x =>
      x.returnQty < 0 || x.returnQty > x.remainingQuantity
    )) {
      this.errorMessage = 'Return quantity remaining received quantity অতিক্রম করতে পারবে না।';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.returnApi.create(this.tenantId, {
      grnId: Number(this.selectedGrnId),
      storeId: Number(this.selectedStoreId),
      returnDate: this.returnDate,
      reason: this.returnReason,
      notes: this.notes,
      items
    }).subscribe({
      next: created => {
        if (!submit) {
          this.saving = false;
          this.successMessage = `Draft ${created.returnNumber} সফলভাবে সংরক্ষিত হয়েছে।`;
          this.resetForm();
          this.loadReturns();
          return;
        }

        this.returnApi.submit(this.tenantId, created.id).subscribe({
          next: result => {
            this.saving = false;
            this.successMessage = `${result.returnNumber} submit হয়েছে। এখন এটি Pending approval।`;
            this.resetForm();
            this.loadReturns();
          },
          error: err => {
            this.saving = false;
            this.errorMessage =
              err?.error?.message ||
              'Draft তৈরি হয়েছে, কিন্তু Submit করা যায়নি। History থেকে Draft submit করুন।';
            this.loadReturns();
          }
        });
      },
      error: err => {
        this.saving = false;
        this.errorMessage = err?.error?.message || 'Purchase Return সংরক্ষণ করা যায়নি।';
      }
    });
  }

  submitDraft(id: number): void {
    this.returnApi.submit(this.tenantId, id).subscribe({
      next: () => {
        this.successMessage = 'Return submitted successfully.';
        this.loadReturns();
      },
      error: err => this.errorMessage =
        err?.error?.message || 'Return submit করা যায়নি।'
    });
  }

  completeReturn(id: number): void {
    if (!confirm('এই Return complete করলে selected store-এর stock কমে যাবে। Continue?')) return;
    this.returnApi.complete(this.tenantId, id).subscribe({
      next: () => {
        this.successMessage = 'Purchase Return completed. Stock updated.';
        this.loadReturns();
        this.onGrnChange();
      },
      error: err => this.errorMessage =
        err?.error?.message || 'Return complete করা যায়নি।'
    });
  }

  cancelReturn(id: number): void {
    if (!confirm('এই Purchase Return cancel করতে চান?')) return;
    this.returnApi.cancel(this.tenantId, id).subscribe({
      next: () => {
        this.successMessage = 'Purchase Return cancelled.';
        this.loadReturns();
      },
      error: err => this.errorMessage =
        err?.error?.message || 'Return cancel করা যায়নি।'
    });
  }

  private resetForm(): void {
    this.selectedGrnId = null;
    this.selectedStoreId = null;
    this.selectedGrn = null;
    this.lines = [];
    this.notes = '';
    this.returnDate = new Date().toISOString().slice(0, 10);
  }

  cancel(): void {
    this.router.navigate(['/app/procurement']);
  }

  trackByLine(index: number, item: ReturnLine): number {
    return item.grnItemId;
  }
}
