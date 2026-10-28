import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  InventoryBatchApiService,
  InventoryBatch
} from '../../../core/services/inventory-batch-api.service';
import {
  InventoryMovementApiService,
  InventoryMovementResponse
} from '../../../core/services/inventory-movement-api.service';
import { StockAdjustmentApiService } from '../../../core/services/stock-adjustment-api.service';
import {
  TenantInventoryApiService
} from '../../../core/services/tenant-inventory-api.service';
import {
  StockRequestApiService,
  StockRequestRecord
} from '../../../core/services/stock-request-api.service';

interface Medicine {
  id: number;
  name: string;
  generic: string;
  company: string;
  category: string;
  strength: string;
  dosageForm?: string;
  unitPrice: number;
  stock: number;
  reorderLevel: number;
  status?: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

interface Adjustment {
  id: number;
  date: string;
  medicineId: number;
  medicineName: string;
  batchNumber: string;
  type: 'Increase' | 'Decrease';
  quantity: number;
  reason: string;
  note: string;
  user: string;
  status: string;
  requesterUserId: number;
  source?: 'REQUEST' | 'LEDGER';
  requestId?: number;
}

@Component({
  selector: 'app-stock-adjustment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stock-adjustment.component.html',
  styleUrl: './stock-adjustment.component.scss'
})
export class StockAdjustmentComponent implements OnInit {
  medicines: Medicine[] = [];
  batches: InventoryBatch[] = [];
  adjustments: Adjustment[] = [];
  loading = false;
  saving = false;
  batchesLoading = false;

  selectedMedicineId: number | null = null;
  selectedBatchId: number | null = null;
  selectedType: 'Increase' | 'Decrease' = 'Increase';
  adjustmentQuantity = 1;
  selectedReason = '';
  note = '';
  searchTerm = '';

  reasons = [
    'Purchase Received',
    'Damaged Stock',
    'Expired Stock',
    'Stock Correction',
    'Return from Customer',
    'Return to Supplier',
    'Free Sample',
    'Other'
  ];

  constructor(
    private inventoryApi: TenantInventoryApiService,
    private batchApi: InventoryBatchApiService,
    private requestApi: StockRequestApiService,
    private adjustmentApi: StockAdjustmentApiService,
    private movementApi: InventoryMovementApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadMedicines();
    this.loadAdjustments();
  }

  private getTenantId(): number {
    const id = Number(localStorage.getItem('tenantId'));
    return Number.isSafeInteger(id) && id > 0 ? id : 0;
  }

  get canReviewRequests(): boolean {
    const role = (
      localStorage.getItem('membershipRole') ||
      localStorage.getItem('userRole') ||
      ''
    ).replace(/[\s-]/g, '_').toUpperCase();

    return [
      'TENANT_OWNER',
      'PHARMACY_ADMIN',
      'TENANT_ADMIN',
      'MANAGER'
    ].includes(role);
  }

  loadMedicines(): void {
    const tenantId = this.getTenantId();

    if (!tenantId) {
      this.medicines = [];
      alert('Tenant ID পাওয়া যায়নি। আবার login করুন।');
      return;
    }

    this.inventoryApi.list(tenantId).subscribe({
      next: items => {
        this.medicines = items.map(item => {
          const stock = Number(item.stockQuantity ?? 0);
          const reorderLevel = Number(item.reorderLevel ?? 0);

          let status: Medicine['status'] = 'In Stock';
          if (stock <= 0) {
            status = 'Out of Stock';
          } else if (stock <= reorderLevel) {
            status = 'Low Stock';
          }

          return {
            id: item.id,
            name: item.name,
            generic: item.genericName || '',
            company: item.brandName || '',
            category: item.category || 'Other',
            strength: item.strength || '',
            dosageForm: item.dosageForm || '',
            unitPrice: Number(item.sellingPrice ?? 0),
            stock,
            reorderLevel,
            status
          };
        });
      },
      error: error => {
        console.error('Failed to load inventory medicines', error);
        this.medicines = [];
        alert(error?.error?.message || 'Medicine list load হয়নি।');
      }
    });
  }

  loadAdjustments(): void {
    const tenantId = this.getTenantId();

    if (!tenantId) {
      this.adjustments = [];
      return;
    }

    this.loading = true;

    forkJoin({
      requests: this.requestApi.list(tenantId),
      movements: this.movementApi.list(tenantId)
    }).subscribe({
      next: ({ requests, movements }) => {
        const requestRows = requests.map(request => this.mapRequest(request));

        const ledgerRows = movements
          .filter(record => {
            const type = String(record.movementType || '').toUpperCase();
            const reference = String(record.referenceType || '').toUpperCase();
            return reference === 'STOCK_ADJUSTMENT' || type === 'ADJUSTMENT';
          })
          .map(record => this.mapMovement(record));

        this.adjustments = [...requestRows, ...ledgerRows].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        this.loading = false;
      },
      error: error => {
        console.error('Failed to load stock adjustment history:', error);
        this.adjustments = [];
        this.loading = false;
        alert(error?.error?.message || 'Stock adjustment history load হয়নি।');
      }
    });
  }

  private mapRequest(request: StockRequestRecord): Adjustment {
    const parts = (request.reason || '').split(' | ');
    const reason = parts.shift() || request.reason || 'Other';

    const batchPart = parts.find(part => part.startsWith('Batch: '));
    const notePart = parts.find(part => part.startsWith('Note: '));

    return {
      id: request.id,
      date: request.createdAt,
      medicineId: request.inventoryItemId,
      medicineName: request.medicineName || 'Unknown medicine',
      batchNumber: request.batchNumber || (batchPart ? batchPart.substring(7) : 'N/A'),
      type: request.movementType === 'STOCK_IN' ? 'Increase' : 'Decrease',
      quantity: Number(request.quantity || 0),
      reason,
      note: notePart ? notePart.substring(6) : '',
      user: `User #${request.requesterUserId}`,
      status: (request.status || 'PENDING').toUpperCase(),
      requesterUserId: request.requesterUserId,
      source: 'REQUEST',
      requestId: request.id
    };
  }

  private mapMovement(record: InventoryMovementResponse): Adjustment {
    const change = Number(record.quantityChange || 0);

    return {
      id: record.id,
      date: record.createdAt || '',
      medicineId: Number(record.productId || 0),
      medicineName: record.productName || 'Unknown medicine',
      batchNumber: record.batchNumber || 'N/A',
      type: change >= 0 ? 'Increase' : 'Decrease',
      quantity: Math.abs(change),
      reason: record.reason || 'Manual stock adjustment',
      note: '',
      user: record.actorUserId != null
        ? `User #${record.actorUserId}`
        : 'Not recorded',
      status: 'COMPLETED',
      requesterUserId: record.actorUserId ?? 0,
      source: 'LEDGER'
    };
  }

  loadBatches(medicineId: number): void {
    const tenantId = this.getTenantId();

    if (!tenantId) {
      this.batches = [];
      return;
    }

    this.batchesLoading = true;
    this.batches = [];

    this.batchApi.list(tenantId, medicineId).subscribe({
      next: batches => {
        this.batches = Array.isArray(batches) ? batches : [];
        this.batchesLoading = false;
      },
      error: error => {
        console.error('Failed to load medicine batches:', error);
        this.batches = [];
        this.batchesLoading = false;
        alert(error?.error?.message || 'Medicine batch list load হয়নি।');
      }
    });
  }

  get selectableBatches(): InventoryBatch[] {
    const today = new Date();
    const todayText = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0')
    ].join('-');

    return this.batches
      .filter(batch => {
        const status = String(batch.status || '').toUpperCase();

        if (this.selectedType === 'Decrease') {
          return Number(batch.quantity || 0) > 0;
        }

        return Boolean(batch.expiryDate)
          && batch.expiryDate > todayText
          && ['ACTIVE', 'NEAR_EXPIRY'].includes(status);
      })
      .sort((a, b) =>
        String(a.expiryDate || '').localeCompare(String(b.expiryDate || ''))
      );
  }

  get selectedBatch(): InventoryBatch | undefined {
    return this.batches.find(batch => batch.id === this.selectedBatchId);
  }

  getMedicineStatus(
    stock: number,
    reorderLevel: number
  ): Medicine['status'] {
    if (stock <= 0) return 'Out of Stock';
    if (stock <= reorderLevel) return 'Low Stock';
    return 'In Stock';
  }

  get selectedMedicine(): Medicine | undefined {
    return this.medicines.find(
      medicine => medicine.id === this.selectedMedicineId
    );
  }

  get filteredAdjustments(): Adjustment[] {
    const term = this.searchTerm.toLowerCase().trim();

    return this.adjustments.filter(adjustment =>
      !term ||
      adjustment.medicineName.toLowerCase().includes(term) ||
      adjustment.batchNumber.toLowerCase().includes(term) ||
      adjustment.reason.toLowerCase().includes(term) ||
      adjustment.status.toLowerCase().includes(term)
    );
  }

  get totalAdjustments(): number {
    return this.adjustments.length;
  }

  get totalIncreases(): number {
    return this.adjustments
      .filter(item =>
        item.type === 'Increase' &&
        ['APPROVED', 'COMPLETED'].includes(item.status)
      )
      .reduce((total, item) => total + item.quantity, 0);
  }

  get totalDecreases(): number {
    return this.adjustments
      .filter(item =>
        item.type === 'Decrease' &&
        ['APPROVED', 'COMPLETED'].includes(item.status)
      )
      .reduce((total, item) => total + item.quantity, 0);
  }

  selectMedicine(medicineId: number): void {
    this.selectedMedicineId = medicineId;
    this.selectedBatchId = null;
    this.batches = [];

    if (medicineId) {
      this.loadBatches(medicineId);
    }
  }

  setAdjustmentType(type: 'Increase' | 'Decrease'): void {
    this.selectedType = type;
    this.selectedBatchId = null;
  }

  adjustStock(): void {
    if (this.saving) return;

    const medicine = this.selectedMedicine;
    const batch = this.selectedBatch;

    if (!medicine) {
      alert('Please select a medicine.');
      return;
    }

    if (this.batchesLoading) {
      alert('Batch list load হচ্ছে। একটু পরে আবার চেষ্টা করুন।');
      return;
    }

    if (!batch) {
      alert('এই medicine-এর জন্য একটি batch select করুন।');
      return;
    }

    if (
      !Number.isInteger(this.adjustmentQuantity) ||
      this.adjustmentQuantity <= 0
    ) {
      alert('Quantity must be a positive whole number.');
      return;
    }

    if (!this.selectedReason) {
      alert('Please select an adjustment reason.');
      return;
    }

    if (
      this.selectedType === 'Decrease' &&
      this.adjustmentQuantity > Number(batch.quantity || 0)
    ) {
      alert('Decrease quantity batch-এর বর্তমান stock-এর বেশি হতে পারবে না।');
      return;
    }

    if (
      this.selectedType === 'Increase' &&
      this.selectedReason === 'Purchase Received'
    ) {
      alert('Purchase stock-এর জন্য GRN / Batch receiving ব্যবহার করুন, যাতে expiry ও purchase details সংরক্ষিত হয়।');
      this.router.navigate(['/app/procurement/grn']);
      return;
    }

    const tenantId = this.getTenantId();

    if (!tenantId) {
      alert('Tenant ID পাওয়া যায়নি। আবার login করুন।');
      return;
    }

    let reason = this.selectedReason;
    if (this.note.trim()) {
      reason += ` | Note: ${this.note.trim()}`;
    }

    if (reason.trim().length > 250) {
      alert('Reason ও note মিলিয়ে সর্বোচ্চ 250 characters হতে পারবে।');
      return;
    }

    this.saving = true;

    const role = (
      localStorage.getItem('membershipRole') ||
      localStorage.getItem('userRole') ||
      ''
    ).replace(/[\\s-]/g, '_').toUpperCase();

    if (role === 'STORE_KEEPER') {
      this.requestApi.create(tenantId, {
        inventoryItemId: medicine.id,
        batchId: batch.id,
        movementType: this.selectedType === 'Increase' ? 'STOCK_IN' : 'STOCK_OUT',
        quantity: this.adjustmentQuantity,
        reason: reason.trim()
      }).subscribe({
        next: request => {
          this.saving = false;
          this.adjustments.unshift(this.mapRequest(request));
          alert(
            `Stock request submitted. Status: ${request.status}. ` +
            'Approval না হওয়া পর্যন্ত stock পরিবর্তন হবে না।'
          );
          this.resetForm();
          this.loadAdjustments();
        },
        error: error => {
          this.saving = false;
          console.error('Failed to submit stock request:', error);
          alert(error?.error?.message || 'Stock request submit করা যায়নি।');
        }
      });
      return;
    }

    const quantityChange = this.selectedType === 'Increase'
      ? this.adjustmentQuantity
      : -this.adjustmentQuantity;

    this.adjustmentApi.adjust(tenantId, {
      batchId: batch.id,
      quantityChange,
      reason: reason.trim()
    }).subscribe({
      next: result => {
        this.saving = false;

        alert(
          `Stock adjustment successful: ${result.adjustmentNumber}\n` +
          `Batch stock after: ${result.batchQuantityAfter}\n` +
          `Medicine total stock after: ${result.inventoryQuantityAfter}`
        );

        this.resetForm();
        this.loadMedicines();
        this.loadAdjustments();
      },
      error: error => {
        this.saving = false;
        console.error('Stock adjustment failed:', error);
        alert(error?.error?.message || 'Stock adjustment করা যায়নি।');
      }
    });
  }

  approveAdjustment(adjustment: Adjustment): void {
    if (adjustment.source === 'LEDGER' || adjustment.status !== 'PENDING') return;

    if (!confirm(`Request #${adjustment.id} approve করবেন?`)) return;

    const tenantId = this.getTenantId();
    if (!tenantId) return;

    this.requestApi.approve(tenantId, adjustment.id).subscribe({
      next: result => {
        alert(`Request ${result.status.toLowerCase()} হয়েছে।`);
        this.loadAdjustments();
        this.loadMedicines();
      },
      error: error => {
        alert(error?.error?.message || 'Request approve করা যায়নি।');
      }
    });
  }

  rejectAdjustment(adjustment: Adjustment): void {
    if (adjustment.source === 'LEDGER' || adjustment.status !== 'PENDING') return;

    const note = prompt('Rejection note লিখুন (optional):');
    if (note === null) return;

    const tenantId = this.getTenantId();
    if (!tenantId) return;

    this.requestApi.reject(tenantId, adjustment.id, note).subscribe({
      next: result => {
        alert(`Request ${result.status.toLowerCase()} হয়েছে।`);
        this.loadAdjustments();
      },
      error: error => {
        alert(error?.error?.message || 'Request reject করা যায়নি।');
      }
    });
  }

  resetForm(): void {
    this.selectedMedicineId = null;
    this.selectedType = 'Increase';
    this.adjustmentQuantity = 1;
    this.selectedReason = '';
    this.selectedBatchId = null;
    this.batches = [];
    this.note = '';
  }

  getAdjustmentClass(type: Adjustment['type']): string {
    return type === 'Increase' ? 'increase' : 'decrease';
  }

  formatDate(date: string): string {
    if (!date) return '—';

    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return '—';

    return parsed.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  goBack(): void {
    this.router.navigate(['/app/inventory/medicines']);
  }
}
