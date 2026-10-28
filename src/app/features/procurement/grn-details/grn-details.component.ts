import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GrnApiService, GrnResponse } from '../../../core/services/grn-api.service';

@Component({
  selector: 'app-grn-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './grn-details.component.html',
  styleUrl: './grn-details.component.scss'
})
export class GrnDetailsComponent implements OnInit {
  grn: GrnResponse | null = null;
  loading = true;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private grnApi: GrnApiService
  ) {}

  ngOnInit(): void {
    const tenantId = Number(localStorage.getItem('tenantId'));
    const grnId = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isSafeInteger(tenantId) || tenantId <= 0 ||
        !Number.isSafeInteger(grnId) || grnId <= 0) {
      this.loading = false;
      this.errorMessage = 'Tenant ID অথবা GRN ID সঠিক নয়।';
      return;
    }

    this.grnApi.getById(tenantId, grnId).subscribe({
      next: response => {
        this.grn = response;
        this.loading = false;
      },
      error: err => {
        this.loading = false;
        this.errorMessage =
          err?.error?.message ||
          'GRN details load করা যায়নি। Backend API ও permission পরীক্ষা করুন।';
      }
    });
  }

  get itemCount(): number {
    return this.grn?.items?.length ?? 0;
  }

  get totalQuantity(): number {
    return (this.grn?.items ?? []).reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0
    );
  }

  get totalAmount(): number {
    return (this.grn?.items ?? []).reduce(
      (sum, item) => sum + Number(
        item.lineTotal ?? (Number(item.quantity || 0) * Number(item.purchasePrice || 0))
      ),
      0
    );
  }

  statusClass(status: string | null | undefined): string {
    switch ((status || '').toLowerCase()) {
      case 'received': return 'received';
      case 'draft': return 'draft';
      case 'cancelled': return 'cancelled';
      case 'partial':
      case 'partially received': return 'partial';
      default: return 'default';
    }
  }

  backToList(): void {
    this.router.navigate(['/app/procurement/grn']);
  }
}
