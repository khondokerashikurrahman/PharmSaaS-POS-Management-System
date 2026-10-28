import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  BranchTransferApiService,
  BranchTransferDto,
  BranchTransferItemDto
} from '../../../core/services/branch-transfer-api.service';

interface TransferItem {
  medicine: string;
  batch: string;
  quantity: number;
  unitPrice: number;
  total: number;
  transferItemId?: number;
  batchId?: number;
}

interface TransferRequest {
  id: string;
  backendId: number;
  fromBranch: string;
  toBranch: string;
  requestedBy: string;
  requestDate: string;
  priority: 'Low' | 'Normal' | 'High' | 'Urgent';
  status: 'Pending' | 'Approved' | 'Rejected' | 'Dispatched' | 'Received';
  totalItems: number;
  totalQuantity: number;
  totalValue: number;
  reason: string;
  items: TransferItem[];
}

@Component({
  selector: 'app-transfer-approval',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transfer-approval.component.html',
  styleUrl: './transfer-approval.component.scss'
})
export class TransferApprovalComponent implements OnInit {
  searchTerm = '';
  selectedPriority = 'All';
  selectedRequest: TransferRequest | null = null;
  rejectionReason = '';
  showRejectModal = false;
  loading = false;
  loadError = '';
  transferRequests: TransferRequest[] = [];

  constructor(
    private router: Router,
    private transferApi: BranchTransferApiService
  ) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  private mapStatus(status: string): TransferRequest['status'] {
    switch ((status || '').toUpperCase()) {
      case 'APPROVED': return 'Approved';
      case 'REJECTED': return 'Rejected';
      case 'DISPATCHED': return 'Dispatched';
      case 'RECEIVED': return 'Received';
      default: return 'Pending';
    }
  }

  private mapItem(item: BranchTransferItemDto): TransferItem {
    return {
      medicine: item.medicineName || item.sku || `Inventory item #${item.inventoryItemId}`,
      batch: item.batchNumber || `Batch #${item.batchId}`,
      quantity: Number(item.quantity || 0),
      unitPrice: 0,
      total: 0,
      transferItemId: item.id,
      batchId: item.batchId
    };
  }

  private mapTransfer(dto: BranchTransferDto): TransferRequest {
    const items = (dto.items || []).map(item => this.mapItem(item));
    const requestedBy =
      dto.requestedByName ||
      dto.requestedBy ||
      (dto.requestedByUserId ? `User #${dto.requestedByUserId}` : 'Staff');

    const date = dto.requestedAt || dto.createdAt;

    return {
      id: dto.transferNumber || String(dto.id),
      backendId: Number(dto.id),
      fromBranch: dto.sourceStoreName || `Store #${dto.sourceStoreId}`,
      toBranch: dto.destinationStoreName || `Store #${dto.destinationStoreId}`,
      requestedBy,
      requestDate: date ? new Date(date).toLocaleDateString() : '—',
      priority: 'Normal',
      status: this.mapStatus(dto.status),
      totalItems: items.length,
      totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
      // The transfer API does not currently return medicine unit prices.
      totalValue: 0,
      reason: dto.reason || dto.actionNote || '',
      items
    };
  }

  loadRequests(): void {
    this.loading = true;
    this.loadError = '';

    this.transferApi.list().subscribe({
      next: records => {
        this.transferRequests = (records || []).map(record =>
          this.mapTransfer(record)
        );
        this.loading = false;
      },
      error: error => {
        this.loading = false;
        this.loadError =
          error?.error?.message ||
          error?.message ||
          'Transfer requests load করা যায়নি।';
      }
    });
  }

  get filteredRequests(): TransferRequest[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.transferRequests.filter(request => {
      const matchesSearch =
        !search ||
        request.id.toLowerCase().includes(search) ||
        request.fromBranch.toLowerCase().includes(search) ||
        request.toBranch.toLowerCase().includes(search) ||
        request.requestedBy.toLowerCase().includes(search);

      const matchesPriority =
        this.selectedPriority === 'All' ||
        request.priority === this.selectedPriority;

      return matchesSearch && matchesPriority;
    });
  }

  get totalRequests(): number {
    return this.transferRequests.length;
  }

  get pendingRequests(): number {
    return this.transferRequests.filter(request => request.status === 'Pending').length;
  }

  get approvedRequests(): number {
    return this.transferRequests.filter(request => request.status === 'Approved').length;
  }

  get rejectedRequests(): number {
    return this.transferRequests.filter(request => request.status === 'Rejected').length;
  }

  get pendingValue(): number {
    return this.transferRequests
      .filter(request => request.status === 'Pending')
      .reduce((total, request) => total + request.totalValue, 0);
  }

  viewRequest(request: TransferRequest): void {
    this.selectedRequest = request;
    this.rejectionReason = '';
    this.showRejectModal = false;
  }

  closeDetails(): void {
    this.selectedRequest = null;
    this.showRejectModal = false;
    this.rejectionReason = '';
  }

  approveRequest(request: TransferRequest): void {
    if (request.status !== 'Pending') {
      alert('Only pending transfer requests can be approved.');
      return;
    }

    if (!confirm(`Are you sure you want to approve ${request.id}?`)) return;

    this.transferApi.approve(request.backendId).subscribe({
      next: () => {
        alert(`${request.id} approved successfully.`);
        this.selectedRequest = null;
        this.loadRequests();
      },
      error: error => {
        alert(
          error?.error?.message ||
          error?.error?.error ||
          error?.message ||
          'Transfer approve করা যায়নি।'
        );
      }
    });
  }

  openRejectModal(request: TransferRequest): void {
    if (request.status !== 'Pending') {
      alert('Only pending transfer requests can be rejected.');
      return;
    }

    this.selectedRequest = request;
    this.rejectionReason = '';
    this.showRejectModal = true;
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.rejectionReason = '';
  }

  rejectRequest(): void {
    if (!this.selectedRequest) return;

    if (!this.rejectionReason.trim()) {
      alert('Please enter a rejection reason.');
      return;
    }

    const request = this.selectedRequest;

    this.transferApi.reject(
      request.backendId,
      this.rejectionReason.trim()
    ).subscribe({
      next: () => {
        alert(`${request.id} rejected successfully.`);
        this.showRejectModal = false;
        this.selectedRequest = null;
        this.rejectionReason = '';
        this.loadRequests();
      },
      error: error => {
        alert(
          error?.error?.message ||
          error?.error?.error ||
          error?.message ||
          'Transfer reject করা যায়নি।'
        );
      }
    });
  }

  viewDetails(request: TransferRequest): void {
    this.router.navigate(['/app/branch-transfer', request.backendId]);
  }

  getPriorityClass(priority: TransferRequest['priority']): string {
    switch (priority) {
      case 'Low': return 'priority-low';
      case 'Normal': return 'priority-normal';
      case 'High': return 'priority-high';
      case 'Urgent': return 'priority-urgent';
      default: return '';
    }
  }

  getStatusClass(status: TransferRequest['status']): string {
    switch (status) {
      case 'Pending': return 'status-pending';
      case 'Approved': return 'status-approved';
      case 'Rejected': return 'status-rejected';
      default: return '';
    }
  }

  trackByRequestId(index: number, request: TransferRequest): string {
    return request.id;
  }

  trackByItem(index: number, item: TransferItem): string {
    return `${item.batch}-${index}`;
  }

  backToTransfers(): void {
    this.router.navigate(['/app/branch-transfer']);
  }
}
