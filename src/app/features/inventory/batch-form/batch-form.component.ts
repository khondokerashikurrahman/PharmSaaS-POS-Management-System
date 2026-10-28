import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TenantInventoryApiService, TenantInventoryItem } from '../../../core/services/tenant-inventory-api.service';
import { InventoryBatchApiService } from '../../../core/services/inventory-batch-api.service';

interface BatchForm {
  medicine: number | '';
  batchNumber: string;
  manufacturingDate: string;
  expiryDate: string;
  purchasePrice: number;
  sellingPrice: number;
  quantity: number;
  supplier: string;
  location: string;
  status: 'Active' | 'Expired' | 'Near Expiry';
}

@Component({
  selector: 'app-batch-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './batch-form.component.html',
  styleUrl: './batch-form.component.scss'
})
export class BatchFormComponent implements OnInit {
  isEditMode = false;
  batchId: string | null = null;
  submitted = false;
  saving = false;
  loadError = '';
  medicines: TenantInventoryItem[] = [];

  suppliers = [
    'Square Pharmaceuticals',
    'Beximco Pharmaceuticals',
    'Renata Limited',
    'Incepta Pharmaceuticals',
    'ACI Limited'
  ];

  locations = ['Main Store', 'Counter 01', 'Counter 02', 'Warehouse'];

  batch: BatchForm = this.emptyBatch();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private inventoryApi: TenantInventoryApiService,
    private batchApi: InventoryBatchApiService
  ) {}

  ngOnInit(): void {
    this.batchId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.batchId;

    const tenantId = this.getTenantId();
    if (!tenantId) {
      this.loadError = 'Tenant ID পাওয়া যায়নি। আবার login করুন।';
      return;
    }

    this.inventoryApi.list(tenantId).subscribe({
      next: items => {
        this.medicines = items.filter(item => item.status?.toUpperCase() === 'ACTIVE');
        if (!this.medicines.length) {
          this.loadError = 'এই tenant-এর কোনো active medicine পাওয়া যায়নি। আগে Medicine List থেকে medicine যোগ করুন।';
        }
      },
      error: error => {
        this.loadError = error?.error?.message ||
          'Medicine list load হয়নি। Tenant Active কি না এবং login token ঠিক আছে কি না যাচাই করুন।';
      }
    });

    if (this.isEditMode) {
      this.loadError = 'Batch edit endpoint এখনো তৈরি হয়নি। নতুন stock যোগ করতে Add Batch ব্যবহার করুন।';
    }
  }

  private getTenantId(): number {
    const value = Number(localStorage.getItem('tenantId'));
    return Number.isSafeInteger(value) && value > 0 ? value : 0;
  }

  private emptyBatch(): BatchForm {
    return {
      medicine: '',
      batchNumber: '',
      manufacturingDate: '',
      expiryDate: '',
      purchasePrice: 0,
      sellingPrice: 0,
      quantity: 0,
      supplier: '',
      location: 'Main Store',
      status: 'Active'
    };
  }

  calculateMargin(): number {
    if (this.batch.purchasePrice <= 0 || this.batch.sellingPrice <= 0) return 0;
    return ((this.batch.sellingPrice - this.batch.purchasePrice) / this.batch.purchasePrice) * 100;
  }

  calculateStockValue(): number {
    return this.batch.quantity * this.batch.purchasePrice;
  }

  calculateSellingValue(): number {
    return this.batch.quantity * this.batch.sellingPrice;
  }

  updateStatus(): void {
    if (!this.batch.expiryDate) {
      this.batch.status = 'Active';
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(`${this.batch.expiryDate}T00:00:00`);

    if (expiry < today) {
      this.batch.status = 'Expired';
      return;
    }

    const days = (expiry.getTime() - today.getTime()) / 86400000;
    this.batch.status = days <= 90 ? 'Near Expiry' : 'Active';
  }

  saveBatch(): void {
    this.submitted = true;
    this.updateStatus();

    if (this.isEditMode) {
      alert('Batch editing is not available yet. Please use Add Batch for new stock.');
      return;
    }

    if (
      !this.batch.medicine ||
      !this.batch.batchNumber.trim() ||
      !this.batch.manufacturingDate ||
      !this.batch.expiryDate ||
      this.batch.quantity <= 0 ||
      this.batch.purchasePrice <= 0 ||
      this.batch.sellingPrice <= 0
    ) {
      return;
    }

    if (new Date(`${this.batch.expiryDate}T00:00:00`) <= new Date(`${this.batch.manufacturingDate}T00:00:00`)) {
      alert('Expiry date must be later than manufacturing date.');
      return;
    }

    if (new Date(`${this.batch.expiryDate}T00:00:00`) <= new Date(new Date().toDateString())) {
      alert('Expired medicine cannot be received into stock.');
      return;
    }

    if (this.batch.sellingPrice < this.batch.purchasePrice &&
        !confirm('Selling price is lower than purchase price. Do you want to continue?')) {
      return;
    }

    const tenantId = this.getTenantId();
    if (!tenantId) {
      alert('Tenant ID পাওয়া যায়নি। আবার login করুন।');
      return;
    }

    this.saving = true;
    this.batchApi.create(tenantId, {
      inventoryItemId: Number(this.batch.medicine),
      batchNumber: this.batch.batchNumber.trim(),
      manufactureDate: this.batch.manufacturingDate,
      expiryDate: this.batch.expiryDate,
      quantity: Number(this.batch.quantity),
      purchasePrice: Number(this.batch.purchasePrice),
      sellingPrice: Number(this.batch.sellingPrice)
    }).subscribe({
      next: result => {
        this.saving = false;
        alert(`Stock received successfully. Batch: ${result.batchNumber}; quantity: ${result.quantity}.`);
        this.router.navigate(['/app/inventory']);
      },
      error: error => {
        this.saving = false;
        alert(error?.error?.message || 'Stock-In failed. Check tenant status, permissions and batch number.');
      }
    });
  }

  resetForm(): void {
    this.submitted = false;
    this.batch = this.emptyBatch();
  }

  cancel(): void {
    this.router.navigate(['/app/inventory']);
  }

  getStatusClass(): string {
    switch (this.batch.status) {
      case 'Active': return 'status-active';
      case 'Expired': return 'status-expired';
      case 'Near Expiry': return 'status-warning';
      default: return '';
    }
  }
}
