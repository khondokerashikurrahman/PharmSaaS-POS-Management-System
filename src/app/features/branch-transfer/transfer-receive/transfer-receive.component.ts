import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  BranchTransferApiService,
  BranchTransferDto,
  BranchTransferItemDto
} from '../../../core/services/branch-transfer-api.service';

interface ReceiveItem {
  medicine: string;
  generic: string;
  batch: string;
  expiryDate: string;
  transferredQty: number;
  receivedQty: number;
  damagedQty: number;
  unitPrice: number;
  total: number;
  condition: 'Good' | 'Damaged' | 'Short';
  transferItemId?: number;
}

interface TransferReceive {
  id: string;
  backendId: number;
  fromBranch: string;
  toBranch: string;
  transferDate: string;
  receivedDate: string;
  transferredBy: string;
  receivedBy: string;
  status: 'In Transit' | 'Received' | 'Partial';
  items: ReceiveItem[];
  notes: string;
}

@Component({
  selector: 'app-transfer-receive',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transfer-receive.component.html',
  styleUrl: './transfer-receive.component.scss'
})
export class TransferReceiveComponent implements OnInit {
  searchTerm = '';
  selectedStatus = 'All';
  selectedTransfer: TransferReceive | null = null;
  receiveDate = new Date().toISOString().slice(0, 10);
  receiveNotes = '';
  loading = false;
  loadError = '';
  transfers: TransferReceive[] = [];

  constructor(
    private router: Router,
    private transferApi: BranchTransferApiService
  ) {}

  ngOnInit(): void {
    this.loadTransfers();
  }

  private asDate(value?: string): string {
    return value ? new Date(value).toLocaleDateString() : '';
  }

  private mapItem(item: BranchTransferItemDto, status: string): ReceiveItem {
    const transferredQty = Number(item.quantity || 0);
    const savedReceived = item.receivedQuantity;
    const receivedQty =
      status === 'RECEIVED' && savedReceived != null
        ? Number(savedReceived)
        : transferredQty;

    const damagedQty = Number(item.damagedQuantity || 0);
    const condition: ReceiveItem['condition'] =
      damagedQty > 0
        ? 'Damaged'
        : receivedQty < transferredQty
          ? 'Short'
          : 'Good';

    return {
      medicine: item.medicineName || item.sku || `Inventory item #${item.inventoryItemId}`,
      generic: '',
      batch: item.batchNumber || `Batch #${item.batchId}`,
      expiryDate: item.expiryDate || '—',
      transferredQty,
      receivedQty,
      damagedQty,
      unitPrice: 0,
      total: 0,
      condition,
      transferItemId: item.id
    };
  }

  private mapTransfer(dto: BranchTransferDto): TransferReceive | null {
    const backendStatus = (dto.status || '').toUpperCase();

    // The receiving queue shows dispatched transfers and completed records.
    if (!['DISPATCHED', 'RECEIVED'].includes(backendStatus)) return null;

    const items = (dto.items || []).map(item =>
      this.mapItem(item, backendStatus)
    );

    const hasDiscrepancy = items.some(item =>
      item.receivedQty < item.transferredQty || item.damagedQty > 0
    );

    const status: TransferReceive['status'] =
      backendStatus === 'DISPATCHED'
        ? 'In Transit'
        : hasDiscrepancy
          ? 'Partial'
          : 'Received';

    const transferDate = dto.dispatchedAt || dto.requestedAt || dto.createdAt;

    return {
      id: dto.transferNumber || String(dto.id),
      backendId: Number(dto.id),
      fromBranch: dto.sourceStoreName || `Store #${dto.sourceStoreId}`,
      toBranch: dto.destinationStoreName || `Store #${dto.destinationStoreId}`,
      transferDate: this.asDate(transferDate),
      receivedDate: this.asDate(dto.receivedAt),
      transferredBy: dto.requestedByName ||
        dto.requestedBy ||
        (dto.requestedByUserId ? `User #${dto.requestedByUserId}` : 'Staff'),
      receivedBy: dto.receivedByUserId
        ? `User #${dto.receivedByUserId}`
        : '',
      status,
      items,
      notes: dto.actionNote || dto.reason || ''
    };
  }

  loadTransfers(): void {
    this.loading = true;
    this.loadError = '';

    this.transferApi.list().subscribe({
      next: records => {
        this.transfers = (records || [])
          .map(record => this.mapTransfer(record))
          .filter((record): record is TransferReceive => record !== null);
        this.loading = false;
      },
      error: error => {
        this.loading = false;
        this.loadError =
          error?.error?.message ||
          error?.message ||
          'Transfer receiving records load করা যায়নি।';
      }
    });
  }

  get filteredTransfers(): TransferReceive[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.transfers.filter(transfer => {
      const matchesSearch =
        !search ||
        transfer.id.toLowerCase().includes(search) ||
        transfer.fromBranch.toLowerCase().includes(search) ||
        transfer.toBranch.toLowerCase().includes(search) ||
        transfer.transferredBy.toLowerCase().includes(search);

      const matchesStatus =
        this.selectedStatus === 'All' ||
        transfer.status === this.selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }

  get totalTransfers(): number {
    return this.transfers.length;
  }

  get inTransitTransfers(): number {
    return this.transfers.filter(transfer => transfer.status === 'In Transit').length;
  }

  get receivedTransfers(): number {
    return this.transfers.filter(transfer => transfer.status === 'Received').length;
  }

  get partialTransfers(): number {
    return this.transfers.filter(transfer => transfer.status === 'Partial').length;
  }

  get totalPendingQuantity(): number {
    return this.transfers
      .filter(transfer => transfer.status === 'In Transit')
      .reduce(
        (total, transfer) =>
          total + transfer.items.reduce((qty, item) => qty + item.transferredQty, 0),
        0
      );
  }

  selectTransfer(transfer: TransferReceive): void {
    this.selectedTransfer = transfer;
    this.receiveDate = new Date().toISOString().slice(0, 10);
    this.receiveNotes = transfer.notes;

    if (transfer.status === 'In Transit') {
      transfer.items.forEach(item => {
        item.receivedQty = item.transferredQty;
        item.damagedQty = 0;
        item.condition = 'Good';
        this.calculateItemTotal(item);
      });
    }
  }

  closeReceivePanel(): void {
    this.selectedTransfer = null;
  }

  calculateItemTotal(item: ReceiveItem): void {
    item.total = Number(item.receivedQty || 0) * Number(item.unitPrice || 0);
  }

  updateCondition(item: ReceiveItem): void {
    if (item.damagedQty > 0) {
      item.condition = 'Damaged';
    } else if (item.receivedQty < item.transferredQty) {
      item.condition = 'Short';
    } else {
      item.condition = 'Good';
    }
    this.calculateItemTotal(item);
  }

  getSelectedTransferredQty(): number {
    return this.selectedTransfer
      ? this.selectedTransfer.items.reduce((total, item) => total + item.transferredQty, 0)
      : 0;
  }

  getSelectedReceivedQty(): number {
    return this.selectedTransfer
      ? this.selectedTransfer.items.reduce((total, item) => total + Number(item.receivedQty || 0), 0)
      : 0;
  }

  getSelectedDamagedQty(): number {
    return this.selectedTransfer
      ? this.selectedTransfer.items.reduce((total, item) => total + Number(item.damagedQty || 0), 0)
      : 0;
  }

  getSelectedValue(): number {
    return this.selectedTransfer
      ? this.selectedTransfer.items.reduce((total, item) => total + Number(item.total || 0), 0)
      : 0;
  }

  receiveTransfer(): void {
    const transfer = this.selectedTransfer;
    if (!transfer) return;

    if (transfer.status !== 'In Transit') {
      alert('Only dispatched transfers can be received.');
      return;
    }

    if (!this.receiveDate) {
      alert('Please select the receiving date.');
      return;
    }

    const invalidQuantity = transfer.items.some(item =>
      item.receivedQty < 0 ||
      item.receivedQty > item.transferredQty ||
      item.damagedQty < 0 ||
      item.damagedQty > item.receivedQty
    );

    if (invalidQuantity) {
      alert('Received/damaged quantities are invalid. Please check the values.');
      return;
    }

    if (!transfer.items.some(item => item.receivedQty > 0)) {
      alert('Please enter received quantity.');
      return;
    }

    const hasShortOrDamaged = transfer.items.some(item =>
      item.receivedQty < item.transferredQty || item.damagedQty > 0
    );

    const payload = {
      note: this.receiveNotes.trim(),
      items: transfer.items.map(item => ({
        transferItemId: Number(item.transferItemId),
        // Backend records the quantity accepted into destination stock.
        // Damaged quantity is excluded from the accepted quantity.
        receivedQuantity: Math.max(
          0,
          Number(item.receivedQty || 0) - Number(item.damagedQty || 0)
        )
      }))
    };

    this.transferApi.receive(transfer.backendId, payload).subscribe({
      next: () => {
        alert(
          hasShortOrDamaged
            ? `${transfer.id} received with quantity discrepancy.`
            : `${transfer.id} received successfully.`
        );
        this.selectedTransfer = null;
        this.loadTransfers();
      },
      error: error => {
        alert(
          error?.error?.message ||
          error?.error?.error ||
          error?.message ||
          'Transfer receive করা যায়নি।'
        );
      }
    });
  }

  markAllGood(): void {
    if (!this.selectedTransfer) return;

    this.selectedTransfer.items.forEach(item => {
      item.receivedQty = item.transferredQty;
      item.damagedQty = 0;
      item.condition = 'Good';
      this.calculateItemTotal(item);
    });
  }

  getStatusClass(status: TransferReceive['status']): string {
    switch (status) {
      case 'In Transit': return 'status-transit';
      case 'Received': return 'status-received';
      case 'Partial': return 'status-partial';
      default: return '';
    }
  }

  getConditionClass(condition: ReceiveItem['condition']): string {
    switch (condition) {
      case 'Good': return 'condition-good';
      case 'Damaged': return 'condition-damaged';
      case 'Short': return 'condition-short';
      default: return '';
    }
  }

  viewDetails(transfer: TransferReceive): void {
    this.router.navigate(['/app/branch-transfer', transfer.backendId]);
  }

  backToTransfers(): void {
    this.router.navigate(['/app/branch-transfer']);
  }

  trackByTransferId(index: number, transfer: TransferReceive): string {
    return transfer.id;
  }

  trackByItem(index: number, item: ReceiveItem): string {
    return `${item.batch}-${index}`;
  }

  get totalTransferredQty(): number {
    return this.transfers.reduce(
      (total, transfer) =>
        total + transfer.items.reduce((sum, item) => sum + item.transferredQty, 0),
      0
    );
  }
}
