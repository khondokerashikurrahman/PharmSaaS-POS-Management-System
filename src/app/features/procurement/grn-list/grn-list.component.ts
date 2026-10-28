import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GrnApiService, GrnResponse } from '../../../core/services/grn-api.service';

interface Grn {
  id: string;
  databaseId: number;
  purchaseOrder: string;
  supplier: string;
  receivedDate: string;
  invoiceNumber: string;
  items: number;
  total: number;
  status: string;
  notes: string;
}

@Component({
  selector: 'app-grn-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './grn-list.component.html',
  styleUrl: './grn-list.component.scss'
})
export class GrnListComponent implements OnInit {
  searchTerm = '';
  selectedStatus = 'All';
  grns: Grn[] = [];
  loading = false;
  loadError = '';

  constructor(
    private router: Router,
    private grnApi: GrnApiService
  ) {}

  ngOnInit(): void {
    this.loadGrns();
  }

  private getTenantId(): number {
    const id = Number(localStorage.getItem('tenantId'));
    return Number.isSafeInteger(id) && id > 0 ? id : 0;
  }

  loadGrns(): void {
    const tenantId = this.getTenantId();

    if (!tenantId) {
      this.grns = [];
      this.loadError = 'Tenant ID পাওয়া যায়নি। Tenant account দিয়ে login করুন।';
      return;
    }

    this.loading = true;
    this.loadError = '';

    this.grnApi.list(tenantId).subscribe({
      next: (response: GrnResponse[]) => {
        this.grns = (Array.isArray(response) ? response : []).map(grn => ({
          id: grn.grnNumber || `GRN-${grn.id}`,
          databaseId: grn.id,
          purchaseOrder: grn.purchaseOrderNumber || '—',
          supplier: grn.supplierName || '—',
          receivedDate: grn.receivedDate || '',
          invoiceNumber: grn.supplierInvoiceNumber || '—',
          items: Array.isArray(grn.items) ? grn.items.length : 0,
          total: Array.isArray(grn.items)
            ? grn.items.reduce(
                (sum, item) => sum + Number(
                  item.lineTotal ??
                  (Number(item.quantity || 0) * Number(item.purchasePrice || 0))
                ),
                0
              )
            : 0,
          status: grn.status || 'Unknown',
          notes: grn.notes || ''
        }));

        this.loading = false;
      },
      error: err => {
        this.loading = false;
        this.loadError =
          err?.error?.message ||
          'GRN list load হয়নি। Backend, login এবং tenant permission পরীক্ষা করুন।';
      }
    });
  }

  get filteredGrns(): Grn[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.grns.filter(grn => {
      const matchesSearch =
        !search ||
        grn.id.toLowerCase().includes(search) ||
        grn.purchaseOrder.toLowerCase().includes(search) ||
        grn.supplier.toLowerCase().includes(search) ||
        grn.invoiceNumber.toLowerCase().includes(search);

      const matchesStatus =
        this.selectedStatus === 'All' ||
        grn.status.toLowerCase() === this.selectedStatus.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }

  get totalGrns(): number {
    return this.grns.length;
  }

  get receivedGrns(): number {
    return this.grns.filter(grn =>
      grn.status.toLowerCase() === 'received'
    ).length;
  }

  get partialGrns(): number {
    return this.grns.filter(grn =>
      ['partially received', 'partial'].includes(grn.status.toLowerCase())
    ).length;
  }

  get draftGrns(): number {
    return this.grns.filter(grn =>
      grn.status.toLowerCase() === 'draft'
    ).length;
  }

  get totalReceivedValue(): number {
    return this.grns
      .filter(grn => grn.status.toLowerCase() !== 'cancelled')
      .reduce((sum, grn) => sum + grn.total, 0);
  }

  createGrn(): void {
    this.router.navigate(['/app/procurement/grn/new']);
  }

  viewGrn(grn: Grn): void {
    this.router.navigate([
      '/app/procurement/grn/details',
      grn.databaseId
    ]);
  }

  editGrn(grn: Grn): void {
    alert('GRN edit endpoint এখনো যুক্ত করা হয়নি।');
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'received':
        return 'status-received';
      case 'partially received':
      case 'partial':
        return 'status-partial';
      case 'draft':
        return 'status-draft';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return '';
    }
  }

  trackByGrnId(index: number, grn: Grn): string {
    return grn.id;
  }
}
