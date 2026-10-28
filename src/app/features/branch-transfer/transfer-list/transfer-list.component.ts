import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  BranchTransferApiService,
  BranchTransferDto
} from '../../../core/services/branch-transfer-api.service';

interface Transfer {
  id: string;
  backendId: number;
  fromBranch: string;
  toBranch: string;
  transferDate: string;
  items: number;
  totalQty: number;
  requestedBy: string;
  status: 'Draft' | 'Pending' | 'Approved' | 'In Transit' | 'Received' | 'Cancelled' | 'Rejected';
}

@Component({
  selector: 'app-transfer-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transfer-list.component.html',
  styleUrl: './transfer-list.component.scss'
})
export class TransferListComponent implements OnInit {
  searchTerm = '';
  selectedStatus = 'All';
  loading = false;
  loadError = '';
  transfers: Transfer[] = [];

  constructor(
    private router: Router,
    private transferApi: BranchTransferApiService
  ) {}

  ngOnInit(): void {
    this.loadTransfers();
  }

  private mapStatus(value: string): Transfer['status'] {
    switch ((value || '').toUpperCase().replace(/[\s-]/g, '_')) {
      case 'PENDING': return 'Pending';
      case 'APPROVED': return 'Approved';
      case 'DISPATCHED':
      case 'IN_TRANSIT': return 'In Transit';
      case 'RECEIVED': return 'Received';
      case 'CANCELLED':
      case 'CANCELED': return 'Cancelled';
      case 'REJECTED': return 'Rejected';
      case 'DRAFT': return 'Draft';
      default: return 'Pending';
    }
  }

  private mapTransfer(dto: BranchTransferDto): Transfer {
    const items = dto.items || [];
    const date = dto.dispatchedAt || dto.requestedAt || dto.createdAt;

    return {
      id: dto.transferNumber || String(dto.id),
      backendId: Number(dto.id),
      fromBranch: dto.sourceStoreName || `Store #${dto.sourceStoreId}`,
      toBranch: dto.destinationStoreName || `Store #${dto.destinationStoreId}`,
      transferDate: date ? new Date(date).toLocaleDateString() : '—',
      items: items.length,
      totalQty: items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
      requestedBy: dto.requestedByName ||
        dto.requestedBy ||
        (dto.requestedByUserId ? `User #${dto.requestedByUserId}` : 'Staff'),
      status: this.mapStatus(dto.status)
    };
  }

  loadTransfers(): void {
    this.loading = true;
    this.loadError = '';

    this.transferApi.list().subscribe({
      next: records => {
        this.transfers = (records || []).map(record => this.mapTransfer(record));
        this.loading = false;
      },
      error: error => {
        this.loading = false;
        this.loadError =
          error?.error?.message ||
          error?.error?.error ||
          error?.message ||
          'Transfer list load করা যায়নি।';
      }
    });
  }

  get filteredTransfers(): Transfer[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.transfers.filter(transfer => {
      const matchesSearch =
        !search ||
        transfer.id.toLowerCase().includes(search) ||
        transfer.fromBranch.toLowerCase().includes(search) ||
        transfer.toBranch.toLowerCase().includes(search) ||
        transfer.requestedBy.toLowerCase().includes(search);

      const matchesStatus =
        this.selectedStatus === 'All' ||
        transfer.status === this.selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }

  get totalTransfers(): number {
    return this.transfers.length;
  }

  get pendingTransfers(): number {
    return this.transfers.filter(transfer => transfer.status === 'Pending').length;
  }

  get inTransitTransfers(): number {
    return this.transfers.filter(transfer => transfer.status === 'In Transit').length;
  }

  get receivedTransfers(): number {
    return this.transfers.filter(transfer => transfer.status === 'Received').length;
  }

  get totalQuantity(): number {
    return this.transfers.reduce((total, transfer) => total + transfer.totalQty, 0);
  }

  createTransfer(): void {
    this.router.navigate(['/app/branch-transfer/new']);
  }

  viewTransfer(transfer: Transfer): void {
    this.router.navigate(['/app/branch-transfer', transfer.backendId]);
  }

  editTransfer(transfer: Transfer): void {
    alert(
      `Transfer ${transfer.id} edit করা যায়নি: backend-এ transfer update endpoint এখনো নেই।`
    );
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

  trackByTransferId(index: number, transfer: Transfer): string {
    return transfer.id;
  }
}
