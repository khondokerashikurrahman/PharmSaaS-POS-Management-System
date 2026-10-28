import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { TenantInventoryApiService, TenantInventoryItem } from '../../../core/services/tenant-inventory-api.service';
import { GrnApiService } from '../../../core/services/grn-api.service';
import { PurchaseOrderApiService, PurchaseOrderResponse } from '../../../core/services/purchase-order-api.service';
import { StoreApiService, StoreResponse } from '../../../core/services/store-api.service';

interface GrnItem {
  inventoryItemId: number | '';
  orderedQty: number;
  previouslyReceivedQty: number;
  remainingQty: number;
  receivedQty: number;
  batchNumber: string;
  manufactureDate: string;
  expiryDate: string;
  purchasePrice: number;
  sellingPrice: number;
}

@Component({
  selector: 'app-grn-entry',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './grn-entry.component.html',
  styleUrl: './grn-entry.component.scss'
})
export class GrnEntryComponent implements OnInit {
  purchaseOrder = '';
  supplier = '';
  receivedDate = this.todayLocal();
  invoiceNumber = '';
  receivedBy = 'Pharmacy Admin';
  notes = '';
  barcodeSearch = '';
  medicines: TenantInventoryItem[] = [];
  loadingMedicines = false;
  saving = false;
  loadError = '';
  message = '';
  messageType: 'success' | 'error' | 'info' = 'info';

  stores: StoreResponse[] = [];
  selectedStoreId: number | '' = '';
  loadingStores = false;
  storeLoadError = '';

  purchaseOrders: PurchaseOrderResponse[] = [];
  loadingPurchaseOrders = false;
  purchaseOrderError = '';
  previouslyReceivedQuantities: Record<string, number> = {};
  loadingExistingGrns = true;
  existingGrnsLoadError = '';
  suppliers = ['Square Pharmaceuticals', 'Beximco Pharmaceuticals', 'Incepta Pharmaceuticals', 'Renata Limited', 'ACI Limited'];
  items: GrnItem[] = [this.emptyItem()];

  constructor(
    private router: Router,
    private inventoryApi: TenantInventoryApiService,
    private grnApi: GrnApiService,
    private storeApi: StoreApiService,
    private purchaseOrderApi: PurchaseOrderApiService
  ) {}

  ngOnInit(): void {
    const tenantId = this.getTenantId();
    if (!tenantId) {
      this.loadError = 'Tenant ID পাওয়া যায়নি। Tenant account দিয়ে আবার login করুন।';
      return;
    }
    this.loadingExistingGrns = true;
    this.grnApi.list(tenantId).subscribe({
      next: records => {
        this.previouslyReceivedQuantities = {};

        for (const grn of (records || []) as any[]) {
          const orderNumber = String(grn.purchaseOrderNumber || '').trim();
          if (!orderNumber) continue;

          for (const line of (grn.items || []) as any[]) {
            const itemId = Number(line.inventoryItemId);
            const quantity = Number(line.quantity || 0);

            if (!Number.isSafeInteger(itemId) || itemId <= 0 ||
                !Number.isFinite(quantity) || quantity <= 0) continue;

            const key = this.receiptKey(orderNumber, itemId);
            this.previouslyReceivedQuantities[key] =
              (this.previouslyReceivedQuantities[key] || 0) + quantity;
          }
        }

        this.loadingExistingGrns = false;
        this.existingGrnsLoadError = '';
      },
      error: err => {
        this.loadingExistingGrns = false;
        this.existingGrnsLoadError =
          err?.error?.message || 'আগের GRN records load করা যায়নি।';
      }
    });

    this.loadingStores = true;
    this.storeApi.getAll(tenantId).subscribe({
      next: stores => {
        this.stores = (stores || []).filter(
          store => String(store.status || '').toUpperCase() === 'ACTIVE'
        );
        this.loadingStores = false;
        if (!this.stores.length) {
          this.storeLoadError =
            'কোনো active store পাওয়া যায়নি। আগে Store Management থেকে active store তৈরি করুন।';
        }
      },
      error: err => {
        this.loadingStores = false;
        this.stores = [];
        this.storeLoadError =
          err?.error?.message || 'Store list load করা যায়নি।';
      }
    });


    this.loadingPurchaseOrders = true;
    this.purchaseOrderApi.list(tenantId).subscribe({
      next: orders => {
        this.purchaseOrders = (orders || []).filter(
          order => (order.status || '').toUpperCase() === 'PENDING'
        );
        this.loadingPurchaseOrders = false;
        if (!this.purchaseOrders.length) {
          this.purchaseOrderError =
            'কোনো submitted Purchase Order পাওয়া যায়নি। আগে Purchase Order তৈরি করে Submit করুন।';
        }
      },
      error: err => {
        this.loadingPurchaseOrders = false;
        this.purchaseOrders = [];
        this.purchaseOrderError =
          err?.error?.message || 'Purchase Order list load হয়নি।';
      }
    });

    this.loadingMedicines = true;
    this.inventoryApi.list(tenantId).subscribe({
      next: medicines => {
        this.medicines = (medicines || []).filter(m => (m.status || '').toUpperCase() === 'ACTIVE');
        this.loadingMedicines = false;
        if (!this.medicines.length) this.loadError = 'কোনো active medicine পাওয়া যায়নি। আগে Inventory থেকে medicine যোগ করুন।';
      },
      error: err => {
        this.loadingMedicines = false;
        this.loadError = err?.error?.message || 'Medicine list load হয়নি। Tenant status, login এবং permission যাচাই করুন।';
      }
    });
  }

  private todayLocal(): string {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }

  private emptyItem(): GrnItem {
    return { inventoryItemId: '', orderedQty: 0, previouslyReceivedQty: 0, remainingQty: 0, receivedQty: 0, batchNumber: '', manufactureDate: '', expiryDate: '', purchasePrice: 0, sellingPrice: 0 };
  }

  private getTenantId(): number {
    for (const key of ['tenantId', 'tenant_id']) {
      const id = Number(localStorage.getItem(key) || 0);
      if (Number.isSafeInteger(id) && id > 0) return id;
    }

    try {
      const user = JSON.parse(localStorage.getItem('pharm_user') || '{}');
      const candidates = [
        user.tenantId,
        user.tenant?.id,
        user.currentTenantId
      ];

      for (const candidate of candidates) {
        const id = Number(candidate || 0);
        if (Number.isSafeInteger(id) && id > 0) return id;
      }
    } catch {
      // Invalid or missing stored user data.
    }

    return 0;
  }

  private receiptKey(orderNumber: string, inventoryItemId: number): string {
    return `${orderNumber.trim().toUpperCase()}|${inventoryItemId}`;
  }

  getPreviouslyReceived(orderNumber: string, inventoryItemId: number): number {
    return this.previouslyReceivedQuantities[
      this.receiptKey(orderNumber, inventoryItemId)
    ] || 0;
  }

  onPurchaseOrderChange(): void {
    const order = this.purchaseOrders.find(
      item => item.orderNumber === this.purchaseOrder
    );

    this.supplier = order?.supplierName || '';

    if (!order) {
      this.items = [this.emptyItem()];
      this.clearMessage();
      return;
    }

    const orderLines = order.items || [];
    const hasUnlinkedLine = orderLines.some(line =>
      !Number.isSafeInteger(Number(line.inventoryItemId)) ||
      Number(line.inventoryItemId) <= 0
    );

    if (hasUnlinkedLine) {
      this.items = [this.emptyItem()];
      this.setMessage(
        'এই Purchase Order-এর কোনো medicine inventory ID-এর সঙ্গে linked নয়। Inventory-linked medicine দিয়ে নতুন PO তৈরি করুন।',
        'error'
      );
      return;
    }

    const grouped = new Map<number, {
      quantity: number;
      extendedCost: number;
    }>();

    for (const line of orderLines) {
      const id = Number(line.inventoryItemId);
      const quantity = Number(line.quantity || 0);
      const group = grouped.get(id) || {
        quantity: 0,
        extendedCost: 0
      };

      group.quantity += quantity;
      group.extendedCost += quantity * Number(line.unitPrice || 0);
      grouped.set(id, group);
    }

    this.items = Array.from(grouped.entries()).map(([id, group]) => {
      const medicine = this.medicines.find(m => Number(m.id) === id);
      const previouslyReceivedQty = this.getPreviouslyReceived(
        order.orderNumber, id
      );

      return {
        inventoryItemId: id,
        orderedQty: group.quantity,
        previouslyReceivedQty,
        remainingQty: Math.max(0, group.quantity - previouslyReceivedQty),
        receivedQty: 0,
        batchNumber: '',
        manufactureDate: '',
        expiryDate: '',
        purchasePrice: group.quantity > 0
          ? Number((group.extendedCost / group.quantity).toFixed(2))
          : Number(medicine?.purchasePrice || 0),
        sellingPrice: Number(medicine?.sellingPrice || 0)
      };
    }).filter(item => item.remainingQty > 0);

    if (!this.items.length) {
      this.items = [this.emptyItem()];
      this.setMessage(
        'এই Purchase Order-এর কোনো remaining quantity নেই।',
        'error'
      );
      return;
    }

    this.clearMessage();
  }

  onMedicineChange(item: GrnItem): void {
    const id = Number(item.inventoryItemId);
    const medicine = this.medicines.find(m => Number(m.id) === id);
    const order = this.purchaseOrders.find(
      order => order.orderNumber === this.purchaseOrder
    );

    const orderedQty = order
      ? (order.items || [])
          .filter(line => Number(line.inventoryItemId) === id)
          .reduce((sum, line) => sum + Number(line.quantity || 0), 0)
      : 0;

    item.orderedQty = orderedQty;
    item.previouslyReceivedQty = order && id > 0
      ? this.getPreviouslyReceived(order.orderNumber, id)
      : 0;
    item.remainingQty = Math.max(
      0, orderedQty - item.previouslyReceivedQty
    );

    if (medicine) {
      item.purchasePrice = Number(medicine.purchasePrice || item.purchasePrice || 0);
      item.sellingPrice = Number(medicine.sellingPrice || item.sellingPrice || 0);
    }

    if (order && id > 0 && orderedQty === 0) {
      this.setMessage(
        'এই medicine নির্বাচিত Purchase Order-এর অংশ নয়।',
        'error'
      );
    } else {
      this.clearMessage();
    }
  }

  isMedicineInPurchaseOrder(medicineId: number): boolean {
    const order = this.purchaseOrders.find(
      item => item.orderNumber === this.purchaseOrder
    );
    return !!order && (order.items || []).some(
      line => Number(line.inventoryItemId) === Number(medicineId)
    );
  }

  getMedicineStock(item: GrnItem): number | null {
    const medicine = this.medicines.find(m => m.id === Number(item.inventoryItemId));
    return medicine ? Number(medicine.stockQuantity || 0) : null;
  }

  scanBarcode(): void {
    const code = this.barcodeSearch.trim().toLowerCase();
    if (!code) return;
    const medicine = this.medicines.find(m =>
      (m.barcode || '').trim().toLowerCase() === code ||
      (m.sku || '').trim().toLowerCase() === code
    );
    if (!medicine) {
      this.setMessage('এই barcode/SKU দিয়ে কোনো active medicine পাওয়া যায়নি।', 'error');
      return;
    }
    const target = this.items[this.items.length - 1];
    target.inventoryItemId = medicine.id;
    this.onMedicineChange(target);
    this.barcodeSearch = '';
    this.setMessage(`${medicine.name} নির্বাচন করা হয়েছে।`, 'success');
  }

  addItem(): void {
    this.items.push(this.emptyItem());
    this.clearMessage();
  }

  removeItem(index: number): void {
    if (this.items.length > 1 && !this.saving) this.items.splice(index, 1);
  }

  lineTotal(item: GrnItem): number {
    return Number(item.receivedQty || 0) * Number(item.purchasePrice || 0);
  }

  get totalItems(): number { return this.items.length; }
  get totalReceivedQty(): number { return this.items.reduce((sum, item) => sum + Number(item.receivedQty || 0), 0); }
  get subtotal(): number { return this.items.reduce((sum, item) => sum + this.lineTotal(item), 0); }
  get tax(): number { return this.subtotal * 0.05; }
  get grandTotal(): number { return this.subtotal + this.tax; }

  saveDraft(): void {
    this.setMessage('Draft-এর জন্য backend endpoint নেই; draft database-এ save হয়নি।', 'info');
  }

  async receiveGoods(): Promise<void> {
    if (this.saving) return;
    const tenantId = this.getTenantId();
    if (!tenantId) return this.setMessage('Tenant ID পাওয়া যায়নি। আবার login করুন।', 'error');
    if (!this.selectedStoreId ||
        !this.stores.some(store => store.id === Number(this.selectedStoreId))) {
      return this.setMessage('যে store-এ stock receive হবে সেটি নির্বাচন করুন।', 'error');
    }
    if (!this.purchaseOrder) return this.setMessage('Purchase order নির্বাচন করুন।', 'error');
    if (this.loadingExistingGrns) {
      return this.setMessage('আগের GRN records load হওয়া পর্যন্ত অপেক্ষা করুন।', 'info');
    }
    if (this.existingGrnsLoadError) {
      return this.setMessage(
        'আগের GRN records যাচাই করা যায়নি। Reload করে আবার চেষ্টা করুন।',
        'error'
      );
    }
    const selectedOrder = this.purchaseOrders.find(
      order => order.orderNumber === this.purchaseOrder
    );
    if (!selectedOrder) {
      return this.setMessage('সঠিক Purchase Order নির্বাচন করুন।', 'error');
    }
    if ((selectedOrder.items || []).some(line =>
      !Number.isSafeInteger(Number(line.inventoryItemId)) ||
      Number(line.inventoryItemId) <= 0
    )) {
      return this.setMessage(
        'Purchase Order-এর সব medicine inventory-এর সঙ্গে linked হতে হবে।',
        'error'
      );
    }
    if (!this.supplier) return this.setMessage('Supplier নির্বাচন করুন।', 'error');
    if (!this.receivedDate) return this.setMessage('Received date দিন।', 'error');
    if (!this.invoiceNumber.trim()) return this.setMessage('Supplier invoice number দিন।', 'error');
    if (!this.items.length) return this.setMessage('কমপক্ষে একটি medicine যোগ করুন।', 'error');

    const today = this.todayLocal();
    const receiptRows = this.items.filter(
      item => Number(item.receivedQty || 0) > 0
    );

    if (!receiptRows.length) {
      return this.setMessage('কমপক্ষে একটি medicine-এর received quantity দিন।', 'error');
    }

    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      const row = i + 1;
      const quantity = Number(item.receivedQty || 0);

      if (!Number.isFinite(quantity) || !Number.isInteger(quantity) || quantity < 0) {
        return this.setMessage(`Row ${row}: received quantity শূন্য বা ধনাত্মক পূর্ণসংখ্যা হতে হবে।`, 'error');
      }

      if (quantity === 0) continue;

      if (!item.inventoryItemId ||
          !this.medicines.some(m => Number(m.id) === Number(item.inventoryItemId))) {
        return this.setMessage(`Row ${row}: active medicine নির্বাচন করুন।`, 'error');
      }
      if (!item.batchNumber.trim()) {
        return this.setMessage(`Row ${row}: batch number দিন।`, 'error');
      }
      if (!item.manufactureDate || !item.expiryDate) {
        return this.setMessage(`Row ${row}: manufacturing ও expiry date দিন।`, 'error');
      }
      if (item.manufactureDate >= item.expiryDate) {
        return this.setMessage(`Row ${row}: expiry date manufacturing date-এর পরে হতে হবে।`, 'error');
      }
      if (item.expiryDate <= today) {
        return this.setMessage(`Row ${row}: expired medicine stock-এ নেওয়া যাবে না।`, 'error');
      }
      if (Number(item.purchasePrice) <= 0 || Number(item.sellingPrice) <= 0) {
        return this.setMessage(`Row ${row}: purchase ও selling price শূন্যের বেশি হতে হবে।`, 'error');
      }
    }

    const orderedByMedicine = new Map<number, number>();
    for (const line of selectedOrder.items || []) {
      const id = Number(line.inventoryItemId);
      orderedByMedicine.set(
        id,
        (orderedByMedicine.get(id) || 0) + Number(line.quantity || 0)
      );
    }

    const receivingByMedicine = new Map<number, number>();
    for (const item of receiptRows) {
      const id = Number(item.inventoryItemId);
      receivingByMedicine.set(
        id,
        (receivingByMedicine.get(id) || 0) + Number(item.receivedQty || 0)
      );
    }

    for (const [id, quantityNow] of receivingByMedicine.entries()) {
      const ordered = orderedByMedicine.get(id);
      if (ordered === undefined) {
        return this.setMessage(
          'নির্বাচিত medicine Purchase Order-এর অংশ নয়।',
          'error'
        );
      }

      const alreadyReceived = this.getPreviouslyReceived(
        selectedOrder.orderNumber, id
      );
      const remaining = Math.max(0, ordered - alreadyReceived);

      if (quantityNow > remaining) {
        const medicine = this.medicines.find(m => Number(m.id) === id);
        return this.setMessage(
          `${medicine?.name || 'Medicine'}: remaining quantity ${remaining}; আপনি ${quantityNow} দিতে চেয়েছেন।`,
          'error'
        );
      }
    }

    if (receiptRows.some(i => Number(i.sellingPrice) < Number(i.purchasePrice)) &&
        !confirm('Selling price purchase price-এর চেয়ে কম। Continue করবেন?')) return;

    this.saving = true;
    this.clearMessage();
    try {
      const result = await firstValueFrom(this.grnApi.create(tenantId, {
        supplierName: this.supplier.trim(),
        purchaseOrderNumber: this.purchaseOrder.trim(),
        supplierInvoiceNumber: this.invoiceNumber.trim(),
        receivedDate: this.receivedDate,
        notes: this.notes.trim(),
        storeId: Number(this.selectedStoreId),
        items: this.items.filter(item => Number(item.receivedQty) > 0).map(item => ({
          inventoryItemId: Number(item.inventoryItemId),
          batchNumber: item.batchNumber.trim(),
          manufactureDate: item.manufactureDate,
          expiryDate: item.expiryDate,
          quantity: Number(item.receivedQty),
          purchasePrice: Number(item.purchasePrice),
          sellingPrice: Number(item.sellingPrice)
        }))
      }));

      this.setMessage(
        `GRN ${result.grnNumber} সফলভাবে save হয়েছে।`,
        'success'
      );
      alert(`GRN saved successfully!\nGRN Number: ${result.grnNumber}`);
      this.router.navigate(['/app/procurement/grn']);
    } catch (err: any) {
      const reason =
        err?.error?.message ||
        err?.error?.error ||
        err?.message ||
        'অজানা API error';
      this.setMessage(`GRN save হয়নি: ${reason}`, 'error');
    } finally {
      this.saving = false;
    }
  }

  cancel(): void { this.router.navigate(['/app/procurement/grn']); }
  private clearMessage(): void { this.message = ''; }
  private setMessage(text: string, type: 'success' | 'error' | 'info'): void {
    this.message = text;
    this.messageType = type;
  }
}
