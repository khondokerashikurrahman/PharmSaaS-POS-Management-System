import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SalesmanApiService, SalesmanResponse } from '../../../core/services/salesman-api.service';

interface Salesman extends SalesmanResponse {
  company: string;
  totalSales: number;
}

@Component({
  selector: 'app-sales-man-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sales-man-list.component.html',
  styleUrl: './sales-man-list.component.scss'
})
export class SalesManListComponent implements OnInit {
  searchTerm = '';
  statusFilter = 'All';
  salesmen: Salesman[] = [];
  loading = false;
  errorMessage = '';

  constructor(
    private router: Router,
    private salesmanApi: SalesmanApiService
  ) {}

  ngOnInit(): void {
    this.loadSalesmen();
  }

  loadSalesmen(): void {
    this.loading = true;
    this.errorMessage = '';

    this.salesmanApi.list().subscribe({
      next: (items) => {
        this.salesmen = items.map(item => ({
          ...item,
          company: '',
          totalSales: 0
        }));
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error?.error?.message ||
          error?.error?.detail ||
          'Unable to load salesmen. Please check your login and tenant access.';
        this.loading = false;
      }
    });
  }

  get filteredSalesmen(): Salesman[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.salesmen.filter(salesman => {
      const matchesSearch =
        !search ||
        salesman.name.toLowerCase().includes(search) ||
        salesman.employeeId.toLowerCase().includes(search) ||
        (salesman.phone || '').toLowerCase().includes(search) ||
        (salesman.email || '').toLowerCase().includes(search) ||
        (salesman.territory || '').toLowerCase().includes(search);

      const matchesStatus =
        this.statusFilter === 'All' ||
        salesman.status === this.statusFilter;

      return matchesSearch && matchesStatus;
    });
  }

  get totalSalesmen(): number {
    return this.salesmen.length;
  }

  get activeSalesmen(): number {
    return this.salesmen.filter(item => item.status === 'Active').length;
  }

  get inactiveSalesmen(): number {
    return this.salesmen.filter(item => item.status === 'Inactive').length;
  }

  get totalSales(): number {
    return 0;
  }

  getInitial(name: string): string {
    return name?.charAt(0).toUpperCase() || '?';
  }

  viewSalesman(id: number): void {
    this.router.navigate(['/app/inventory/salesmen', id]);
  }

  editSalesman(id: number): void {
    this.router.navigate(['/app/inventory/salesmen', id, 'edit']);
  }

  addSalesman(): void {
    this.router.navigate(['/app/inventory/salesmen/new']);
  }

  getStatusClass(status: string): string {
    return status === 'Active' ? 'status-active' : 'status-inactive';
  }
}
