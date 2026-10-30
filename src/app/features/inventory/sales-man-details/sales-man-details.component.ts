import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { SalesmanApiService } from '../../../core/services/salesman-api.service';

interface Salesman {
  id: string;
  name: string;
  phone: string;
  email: string;
  company: string;
  territory: string;
  commission: number;
  status: 'Active' | 'Inactive';
  joiningDate: string;
  address: string;
  totalSales: number;
  totalOrders: number;
  outstanding: number;
}

@Component({
  selector: 'app-sales-man-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sales-man-details.component.html',
  styleUrl: './sales-man-details.component.scss'
})
export class SalesManDetailsComponent implements OnInit {
  salesmanId = '';
  loading = false;
  errorMessage = '';

  salesman: Salesman = {
    id: '',
    name: '',
    phone: '',
    email: '',
    company: '',
    territory: '',
    commission: 0,
    status: 'Active',
    joiningDate: '',
    address: '',
    totalSales: 0,
    totalOrders: 0,
    outstanding: 0
  };

  salesHistory: Array<{
    invoice: string;
    date: string;
    customer: string;
    amount: number;
    commission: number;
    status: string;
  }> = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private salesmanApi: SalesmanApiService
  ) {}

  ngOnInit(): void {
    this.salesmanId = this.route.snapshot.paramMap.get('id') || '';
    this.loadSalesman();
  }

  loadSalesman(): void {
    const id = Number(this.salesmanId);
    if (!Number.isInteger(id) || id <= 0) {
      this.errorMessage = 'Invalid salesman ID.';
      return;
    }

    this.loading = true;
    this.salesmanApi.get(id).subscribe({
      next: (item) => {
        this.salesman = {
          id: item.employeeId,
          name: item.name || '',
          phone: item.phone || '',
          email: item.email || '',
          company: '',
          territory: item.territory || '',
          commission: Number(item.commissionRate || 0),
          status: item.status,
          joiningDate: item.createdAt
            ? new Date(item.createdAt).toLocaleDateString()
            : '',
          address: item.address || '',
          totalSales: 0,
          totalOrders: 0,
          outstanding: 0
        };
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error?.error?.message ||
          error?.error?.detail ||
          'Unable to load salesman details.';
        this.loading = false;
      }
    });
  }

  getStatusClass(status: Salesman['status']): string {
    return status === 'Active' ? 'status-active' : 'status-inactive';
  }

  getPaymentStatusClass(status: string): string {
    return status === 'Paid' ? 'payment-paid' : 'payment-pending';
  }

  editSalesman(): void {
    this.router.navigate([
      '/app/inventory/salesmen',
      this.salesmanId,
      'edit'
    ]);
  }

  goBack(): void {
    this.router.navigate(['/app/inventory/salesmen']);
  }

  printDetails(): void {
    window.print();
  }
}
