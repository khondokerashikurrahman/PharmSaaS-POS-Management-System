import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Batch } from '../../../core/models/batch.model';
import { Product } from '../../../core/models/product.model';
import { StoreInventoryApiService } from '../../../core/services/store-inventory-api.service';

@Component({
  selector: 'app-batch-selector-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './batch-selector-modal.component.html',
  styleUrl: './batch-selector-modal.component.scss'
})
export class BatchSelectorModalComponent implements OnChanges {
  @Input() product: Product | null = null;
  @Input() visible = false;
  @Input() tenantId = 0;
  @Input() storeId: number | null = null;

  @Output() batchSelected = new EventEmitter<Batch>();
  @Output() closed = new EventEmitter<void>();

  batches: Batch[] = [];
  loading = false;
  loadError = '';

  private requestVersion = 0;

  constructor(private storeInventoryApi: StoreInventoryApiService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.visible) {
      this.requestVersion++;
      this.loading = false;
      return;
    }

    if (
      changes['visible'] ||
      changes['product'] ||
      changes['tenantId'] ||
      changes['storeId']
    ) {
      this.loadStoreBatches();
    }
  }

  private loadStoreBatches(): void {
    const version = ++this.requestVersion;
    this.batches = [];
    this.loadError = '';

    const product = this.product as any;
    const productId = Number(
      product?.id ?? product?.productId ?? product?.medicineId
    );

    if (!Number.isSafeInteger(this.tenantId) || this.tenantId <= 0) {
      this.loadError = 'Valid tenant পাওয়া যায়নি। আবার login/select tenant করো।';
      this.loading = false;
      return;
    }

    if (!Number.isSafeInteger(this.storeId) || !this.storeId || this.storeId <= 0) {
      this.loadError = 'POS-এ একটি active store নির্বাচন করো।';
      this.loading = false;
      return;
    }

    if (!Number.isSafeInteger(productId) || productId <= 0) {
      this.loadError =
        'Selected medicine-এর database ID পাওয়া যায়নি; inventory batch load করা সম্ভব হয়নি।';
      this.loading = false;
      return;
    }

    this.loading = true;

    this.storeInventoryApi.listForStore(this.tenantId, this.storeId).subscribe({
      next: rows => {
        if (version !== this.requestVersion) return;

        const today = this.todayLocal();
        const sellingPrice = Number(
          product?.sellingPrice ?? product?.price ?? product?.salePrice ?? 0
        );

        this.batches = (Array.isArray(rows) ? rows : [])
          .filter(row =>
            Number(row.inventoryItemId) === productId &&
            Number(row.batchId) > 0 &&
            Number(row.quantity) > 0 &&
            !!row.expiryDate &&
            row.expiryDate > today &&
            ['ACTIVE', 'NEAR_EXPIRY'].includes(
              String(row.batchStatus || '').toUpperCase()
            )
          )
          .map(row => ({
            id: String(row.batchId),
            tenantId: String(row.tenantId),
            branchId: String(row.storeId),
            medicineId: String(row.inventoryItemId),
            batchNumber: row.batchNumber,
            manufacturingDate: '',
            expiryDate: row.expiryDate,
            purchasePrice: 0,
            sellingPrice,
            quantity: Number(row.quantity),
            availableQuantity: Number(row.quantity),
            reorderLevel: 0,
            status: row.batchStatus
          } as Batch))
          .sort((a, b) =>
            a.expiryDate.localeCompare(b.expiryDate)
          );

        this.loading = false;

        if (this.batches.length === 0) {
          this.loadError = '';
        }
      },
      error: error => {
        if (version !== this.requestVersion) return;

        this.batches = [];
        this.loading = false;
        this.loadError =
          error?.error?.message ||
          error?.error?.error ||
          error?.message ||
          'Selected store-এর allocated stock load করা যায়নি।';
      }
    });
  }

  private todayLocal(): string {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 10);
  }

  get sortedBatches(): Batch[] {
    const today = this.todayLocal();

    return [...this.batches]
      .filter(batch =>
        Number(batch.availableQuantity) > 0 &&
        !!batch.expiryDate &&
        batch.expiryDate > today
      )
      .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
  }

  selectBatch(batch: Batch): void {
    if (Number(batch.availableQuantity) <= 0) {
      this.loadError = 'এই batch-এ available stock নেই।';
      return;
    }

    this.batchSelected.emit(batch);
  }

  close(): void {
    this.closed.emit();
  }

  getExpiryStatus(batch: Batch): string {
    const today = new Date(this.todayLocal() + 'T00:00:00');
    const expiry = new Date(batch.expiryDate + 'T00:00:00');
    const days = Math.ceil(
      (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (days <= 0) return 'Expired';
    if (days <= 180) return 'Near Expiry';
    return 'Available';
  }

  getExpiryClass(batch: Batch): string {
    switch (this.getExpiryStatus(batch)) {
      case 'Expired': return 'expired';
      case 'Near Expiry': return 'near-expiry';
      default: return 'available';
    }
  }
}
