import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  BranchTransferApiService,
  BranchTransferDto,
  BranchTransferItemDto
} from '../../../core/services/branch-transfer-api.service';

interface TransferItem {
  medicine: string;
  generic: string;
  batch: string;
  expiryDate: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Transfer {
  id: string;
  backendId: number;
  fromBranch: string;
  toBranch: string;
  transferDate: string;
  requestedBy: string;
  priority: 'Low' | 'Normal' | 'High' | 'Urgent';
  status: 'Draft' | 'Pending' | 'Approved' | 'In Transit' | 'Received' | 'Cancelled' | 'Rejected';
  createdAt: string;
  approvedBy: string;
  notes: string;
  items: TransferItem[];
}

@Component({
  selector: 'app-transfer-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './transfer-details.component.html',
  styleUrl: './transfer-details.component.scss'
})
export class TransferDetailsComponent implements OnInit {
  loading = false;
  loadError = '';

  transfer: Transfer = {
    id: '',
    backendId: 0,
    fromBranch: '',
    toBranch: '',
    transferDate: '',
    requestedBy: '',
    priority: 'Normal',
    status: 'Pending',
    createdAt: '',
    approvedBy: '',
    notes: '',
    items: []
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private transferApi: BranchTransferApiService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');

      if (!id || id === 'new' || id === 'edit') {
        this.loadError = 'Valid transfer ID পাওয়া যায়নি।';
        return;
      }

      this.loadTransfer(id);
    });
  }

  private mapStatus(value: string): Transfer['status'] {
    switch ((value || '').toUpperCase().replace(/[\s-]/g, '_')) {
      case 'DRAFT': return 'Draft';
      case 'PENDING': return 'Pending';
      case 'APPROVED': return 'Approved';
      case 'DISPATCHED':
      case 'IN_TRANSIT': return 'In Transit';
      case 'RECEIVED': return 'Received';
      case 'CANCELLED':
      case 'CANCELED': return 'Cancelled';
      case 'REJECTED': return 'Rejected';
      default: return 'Pending';
    }
  }

  private mapItem(item: BranchTransferItemDto): TransferItem {
    return {
      medicine: item.medicineName || item.sku || `Inventory item #${item.inventoryItemId}`,
      generic: '',
      batch: item.batchNumber || `Batch #${item.batchId}`,
      expiryDate: item.expiryDate || '—',
      quantity: Number(item.quantity || 0),
      // The current transfer API response does not provide unit prices.
      unitPrice: 0,
      total: 0
    };
  }

  private loadTransfer(id: string): void {
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      this.loadError = 'Transfer ID numeric হতে হবে।';
      return;
    }

    this.loading = true;
    this.loadError = '';

    this.transferApi.getById(numericId).subscribe({
      next: dto => {
        this.transfer = this.mapTransfer(dto);
        this.loading = false;
      },
      error: error => {
        this.loading = false;
        this.loadError =
          error?.error?.message ||
          error?.error?.error ||
          error?.message ||
          'Transfer details load করা যায়নি।';
      }
    });
  }

  private mapTransfer(dto: BranchTransferDto): Transfer {
    const date = dto.requestedAt || dto.createdAt;

    return {
      id: dto.transferNumber || String(dto.id),
      backendId: Number(dto.id),
      fromBranch: dto.sourceStoreName || `Store #${dto.sourceStoreId}`,
      toBranch: dto.destinationStoreName || `Store #${dto.destinationStoreId}`,
      transferDate: date ? new Date(date).toLocaleDateString() : '—',
      requestedBy: dto.requestedByName ||
        dto.requestedBy ||
        (dto.requestedByUserId ? `User #${dto.requestedByUserId}` : 'Staff'),
      priority: 'Normal',
      status: this.mapStatus(dto.status),
      createdAt: date ? new Date(date).toLocaleString() : '—',
      approvedBy: '—',
      notes: dto.actionNote || dto.reason || '',
      items: (dto.items || []).map(item => this.mapItem(item))
    };
  }

  get totalItems(): number {
    return this.transfer.items.length;
  }

  get totalQuantity(): number {
    return this.transfer.items.reduce((total, item) => total + item.quantity, 0);
  }

  get totalValue(): number {
    return this.transfer.items.reduce((total, item) => total + item.total, 0);
  }

  getStatusClass(status: Transfer['status']): string {
    switch (status) {
      case 'Draft': return 'status-draft';
      case 'Pending': return 'status-pending';
      case 'Approved': return 'status-approved';
      case 'In Transit': return 'status-transit';
      case 'Received': return 'status-received';
      case 'Cancelled': return 'status-cancelled';
      case 'Rejected': return 'status-rejected';
      default: return '';
    }
  }

  getPriorityClass(priority: Transfer['priority']): string {
    switch (priority) {
      case 'Low': return 'priority-low';
      case 'Normal': return 'priority-normal';
      case 'High': return 'priority-high';
      case 'Urgent': return 'priority-urgent';
      default: return '';
    }
  }

  backToTransfers(): void {
    this.router.navigate(['/app/branch-transfer']);
  }

  editTransfer(): void {
    alert('Backend-এ transfer edit endpoint এখনো নেই; কোনো পরিবর্তন save করা হয়নি।');
  }

  printTransfer(): void {
    window.print();
  }

  approveTransfer(): void {
    if (this.transfer.status !== 'Pending') {
      alert('Only pending transfers can be approved.');
      return;
    }

    this.transferApi.approve(this.transfer.backendId).subscribe({
      next: () => {
        alert(`${this.transfer.id} approved successfully.`);
        this.loadTransfer(String(this.transfer.backendId));
      },
      error: error => alert(
        error?.error?.message ||
        error?.error?.error ||
        error?.message ||
        'Transfer approve করা যায়নি।'
      )
    });
  }

  dispatchTransfer(): void {
    if (this.transfer.status !== 'Approved') {
      alert('Only approved transfers can be dispatched.');
      return;
    }

    if (!confirm(`Dispatch ${this.transfer.id}? Source store allocation will be reduced.`)) {
      return;
    }

    this.transferApi.dispatch(this.transfer.backendId).subscribe({
      next: () => {
        alert(`${this.transfer.id} dispatched successfully.`);
        this.loadTransfer(String(this.transfer.backendId));
      },
      error: error => alert(
        error?.error?.message ||
        error?.error?.error ||
        error?.message ||
        'Transfer dispatch করা যায়নি।'
      )
    });
  }

  cancelTransfer(): void {
    if (
      this.transfer.status === 'Received' ||
      this.transfer.status === 'Cancelled' ||
      this.transfer.status === 'Rejected'
    ) {
      alert('This transfer cannot be cancelled.');
      return;
    }

    alert(
      'Backend-এ cancellation endpoint এখনো নেই। Status পরিবর্তন করা হয়নি; ভুল status দেখানো এড়াতে transfer অপরিবর্তিত রাখা হয়েছে।'
    );
  }

  trackByMedicine(index: number, item: TransferItem): string {
    return `${item.batch}-${index}`;
  }
}
