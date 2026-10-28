import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { StoreApiService, StoreResponse } from '../../../core/services/store-api.service';
import { BranchTransferApiService } from '../../../core/services/branch-transfer-api.service';

interface StoreStockRow {
  id?: number;
  storeId?: number;
  inventoryItemId?: number;
  itemId?: number;
  medicineName?: string;
  itemName?: string;
  productName?: string;
  name?: string;
  sku?: string;
  batchId: number;
  batchNumber?: string;
  expiryDate?: string;
  quantity?: number;
  availableQuantity?: number;
  unitPrice?: number;
  purchasePrice?: number;
}

interface TransferItem {
  medicine: string;
  batch: string;
  availableQty: number;
  transferQty: number;
  unitPrice: number;
  total: number;
}

@Component({
  selector: 'app-transfer-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transfer-form.component.html',
  styleUrl: './transfer-form.component.scss'
})
export class TransferFormComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly storeApi = inject(StoreApiService);
  private readonly transferApi = inject(BranchTransferApiService);
  private readonly router = inject(Router);

  fromBranch = '';
  toBranch = '';
  transferDate = new Date().toISOString().slice(0, 10);
  priority = 'Normal';
  requestedBy = '';
  notes = '';

  branches: string[] = [];
  priorities = ['Low', 'Normal', 'High', 'Urgent'];
  medicines: string[] = [];
  batches: string[] = [];

  items: TransferItem[] = [{
    medicine: '',
    batch: '',
    availableQty: 0,
    transferQty: 0,
    unitPrice: 0,
    total: 0
  }];

  stores: StoreResponse[] = [];
  sourceStock: StoreStockRow[] = [];
  loadingStores = false;
  loadingStock = false;
  submitting = false;
  loadError = '';

  ngOnInit(): void {
    this.requestedBy = this.getCurrentUserLabel();
    this.loadStores();
  }

  private getTenantId(): number {
    const stored = Number(
      localStorage.getItem('tenantId') ||
      localStorage.getItem('tenant_id') ||
      0
    );
    if (stored > 0) return stored;

    try {
      const user = JSON.parse(localStorage.getItem('pharm_user') || '{}');
      return Number(user.tenantId || user.tenant?.id || 0);
    } catch {
      return 0;
    }
  }

  private getCurrentUserLabel(): string {
    try {
      const user = JSON.parse(localStorage.getItem('pharm_user') || '{}');
      return user.fullName || user.name || user.email || '';
    } catch {
      return '';
    }
  }

  private loadStores(): void {
    const tenantId = this.getTenantId();
    if (!tenantId) {
      this.loadError = 'Tenant ID পাওয়া যায়নি। আবার login/select tenant করো।';
      return;
    }

    this.loadingStores = true;
    this.storeApi.getAll(tenantId).subscribe({
      next: stores => {
        this.stores = (stores || []).filter(store =>
          String(store.status || '').toUpperCase() !== 'INACTIVE' &&
          String(store.status || '').toUpperCase() !== 'SUSPENDED'
        );
        this.branches = this.stores.map(store => store.name);
        this.loadingStores = false;
      },
      error: error => {
        this.loadingStores = false;
        this.loadError = this.errorMessage(error, 'Store list load করা যায়নি।');
      }
    });
  }

  private errorMessage(error: any, fallback: string): string {
    return error?.error?.message ||
      error?.error?.error ||
      error?.message ||
      fallback;
  }

  private selectedSourceStore(): StoreResponse | undefined {
    return this.stores.find(store => store.name === this.fromBranch);
  }

  private stockMedicineName(row: StoreStockRow): string {
    return row.medicineName ||
      row.itemName ||
      row.productName ||
      row.name ||
      row.sku ||
      `Inventory item #${row.inventoryItemId || row.itemId || ''}`;
  }

  private stockBatchName(row: StoreStockRow): string {
    return row.batchNumber || `Batch #${row.batchId}`;
  }

  private stockQuantity(row: StoreStockRow): number {
    return Number(row.quantity ?? row.availableQuantity ?? 0);
  }

  private unwrapStock(value: any): StoreStockRow[] {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.content)) return value.content;
    if (Array.isArray(value?.items)) return value.items;
    if (Array.isArray(value?.data)) return value.data;
    return [];
  }

  private loadSourceStock(): void {
    const tenantId = this.getTenantId();
    const source = this.selectedSourceStore();

    this.sourceStock = [];
    this.medicines = [];
    this.batches = [];

    this.items.forEach(item => {
      item.medicine = '';
      item.batch = '';
      item.availableQty = 0;
      item.transferQty = 0;
      item.unitPrice = 0;
      item.total = 0;
    });

    if (!tenantId || !source) return;

    this.loadingStock = true;
    this.http.get<unknown>(
      `${environment.apiUrl}/tenants/${tenantId}/stores/${source.id}/inventory`
    ).subscribe({
      next: result => {
        this.sourceStock = this.unwrapStock(result).filter(row =>
          Number(row.batchId) > 0 && this.stockQuantity(row) > 0
        );

        this.medicines = [...new Set(
          this.sourceStock.map(row => this.stockMedicineName(row))
        )];

        this.batches = [...new Set(
          this.sourceStock.map(row => this.stockBatchName(row))
        )];

        this.loadingStock = false;
        this.loadError = '';

        if (!this.sourceStock.length) {
          this.loadError = 'এই source store-এ transfer করার মতো allocated stock পাওয়া যায়নি।';
        }
      },
      error: error => {
        this.loadingStock = false;
        this.loadError = this.errorMessage(
          error,
          'Source store inventory load করা যায়নি।'
        );
      }
    });
  }

  onBranchChange(): void {
    if (this.fromBranch === this.toBranch) {
      this.toBranch = '';
    }
    this.loadSourceStock();
  }

  onMedicineChange(item: TransferItem): void {
    item.batch = '';
    item.availableQty = 0;
    item.transferQty = 0;
    item.unitPrice = 0;
    item.total = 0;

    const matching = this.sourceStock.filter(
      row => this.stockMedicineName(row) === item.medicine
    );

    // Select the first available batch by default; users can choose another
    // batch from the existing batch dropdown.
    if (matching.length) {
      item.batch = this.stockBatchName(matching[0]);
      this.updateItemFromSelectedBatch(item);
    }

    this.calculateTotal(item);
  }

  onBatchChange(item: TransferItem): void {
    this.updateItemFromSelectedBatch(item);
    this.calculateTotal(item);
  }

  private updateItemFromSelectedBatch(item: TransferItem): void {
    const row = this.sourceStock.find(candidate =>
      this.stockMedicineName(candidate) === item.medicine &&
      this.stockBatchName(candidate) === item.batch
    );

    item.availableQty = row ? this.stockQuantity(row) : 0;
    item.unitPrice = Number(row?.unitPrice ?? row?.purchasePrice ?? 0);
  }

  addItem(): void {
    this.items.push({
      medicine: '',
      batch: '',
      availableQty: 0,
      transferQty: 0,
      unitPrice: 0,
      total: 0
    });
  }

  removeItem(index: number): void {
    if (this.items.length > 1) this.items.splice(index, 1);
  }

  calculateTotal(item: TransferItem): void {
    item.total = Number(item.transferQty || 0) * Number(item.unitPrice || 0);
  }

  get totalItems(): number {
    return this.items.filter(item => item.medicine && item.batch).length;
  }

  get totalTransferQty(): number {
    return this.items.reduce((total, item) => total + Number(item.transferQty || 0), 0);
  }

  get totalValue(): number {
    return this.items.reduce((total, item) => total + Number(item.total || 0), 0);
  }

  saveDraft(): void {
    alert(
      'Backend-এ Draft save endpoint এখনো নেই। Transfer database-এ save হয়নি; Submit Transfer ব্যবহার করো।'
    );
  }

  submitTransfer(): void {
    if (this.submitting) return;

    if (!this.fromBranch || !this.toBranch) {
      alert('Please select source and destination branch.');
      return;
    }

    if (this.fromBranch === this.toBranch) {
      alert('Source and destination branches cannot be the same.');
      return;
    }

    if (!this.transferDate) {
      alert('Please select transfer date.');
      return;
    }

    if (this.loadingStock) {
      alert('Source stock load হচ্ছে। শেষ হলে আবার submit করো।');
      return;
    }

    const source = this.selectedSourceStore();
    const destination = this.stores.find(store => store.name === this.toBranch);

    if (!source || !destination) {
      alert('Valid source ও destination store পাওয়া যায়নি।');
      return;
    }

    if (!this.notes.trim()) {
      alert('Please enter the transfer reason/notes.');
      return;
    }

    const selectedRows: Array<{ row: StoreStockRow; quantity: number }> = [];

    for (const item of this.items) {
      if (!item.medicine || !item.batch || Number(item.transferQty) <= 0) {
        alert('প্রতিটি item-এর medicine, batch ও positive quantity নির্বাচন করো।');
        return;
      }

      const row = this.sourceStock.find(candidate =>
        this.stockMedicineName(candidate) === item.medicine &&
        this.stockBatchName(candidate) === item.batch
      );

      if (!row) {
        alert(`${item.medicine}: নির্বাচিত batch source store-এর allocated stock-এ পাওয়া যায়নি।`);
        return;
      }

      if (Number(item.transferQty) > this.stockQuantity(row)) {
        alert(
          `${item.medicine} / ${item.batch}: quantity available stock ${this.stockQuantity(row)}-এর বেশি হতে পারবে না।`
        );
        return;
      }

      selectedRows.push({ row, quantity: Number(item.transferQty) });
    }

    const duplicateBatchIds = new Set<number>();
    const seenBatchIds = new Set<number>();

    for (const selected of selectedRows) {
      const batchId = Number(selected.row.batchId);
      if (seenBatchIds.has(batchId)) duplicateBatchIds.add(batchId);
      seenBatchIds.add(batchId);
    }

    if (duplicateBatchIds.size) {
      alert('একই batch একাধিক line-এ দেওয়া হয়েছে। একই batch একবারেই যোগ করো।');
      return;
    }

    this.submitting = true;

    this.transferApi.create({
      sourceStoreId: source.id,
      destinationStoreId: destination.id,
      reason: this.notes.trim(),
      items: selectedRows.map(selected => ({
        batchId: Number(selected.row.batchId),
        quantity: selected.quantity
      }))
    }).subscribe({
      next: transfer => {
        this.submitting = false;
        alert('Branch transfer backend-এ submit হয়েছে। Approval-এর পর dispatch করতে হবে.');
        this.router.navigate([
          '/app/branch-transfer',
          transfer.id
        ]);
      },
      error: error => {
        this.submitting = false;
        alert(this.errorMessage(error, 'Transfer submit করা যায়নি।'));
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/app/branch-transfer']);
  }

  trackByMedicine(index: number, item: TransferItem): string {
    return `${item.medicine}-${item.batch}-${index}`;
  }
}
