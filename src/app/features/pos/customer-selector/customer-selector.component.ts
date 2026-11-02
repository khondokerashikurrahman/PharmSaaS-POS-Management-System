import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Customer } from '../../../core/models/customer.model';
import { CustomerApiService, CustomerResponse } from '../../../core/services/customer-api.service';

@Component({
  selector: 'app-customer-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customer-selector.component.html',
  styleUrl: './customer-selector.component.scss'
})
export class CustomerSelectorComponent implements OnInit {
  @Input() selectedCustomerName = 'Walk-in Customer';
  @Output() customerSelected = new EventEmitter<Customer>();
  @Output() customerNameChanged = new EventEmitter<string>();

  searchTerm = '';
  customers: Customer[] = [];
  showCustomerList = false;
  loading = false;
  loadError = '';

  constructor(private readonly customerApi: CustomerApiService) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  private getTenantId(): number | null {
    const userRaw = localStorage.getItem('pharm_user');
    let user: any = null;
    try {
      user = userRaw ? JSON.parse(userRaw) : null;
    } catch {
      user = null;
    }

    const raw = localStorage.getItem('tenantId')
      || localStorage.getItem('tenant_id')
      || user?.tenantId
      || user?.tenant?.id
      || user?.currentTenantId;

    const id = Number(raw);
    return Number.isInteger(id) && id > 0 ? id : null;
  }

  loadCustomers(): void {
    const tenantId = this.getTenantId();
    if (!tenantId) {
      this.loadError = 'Tenant information not found. Please login again.';
      return;
    }

    this.loading = true;
    this.loadError = '';

    this.customerApi.list(tenantId).subscribe({
      next: (response: CustomerResponse[]) => {
        this.customers = response
          .filter(item => item.status?.toLowerCase() === 'active')
          .map(item => ({
            id: item.id,
            name: item.name,
            phone: item.phone || '',
            email: item.email || undefined,
            address: item.address || undefined,
            customerType: 'Regular' as const,
            isActive: true,
            createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
            updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined
          }));
        this.loading = false;
      },
      error: error => {
        this.loadError = error?.error?.message || 'Unable to load customers.';
        this.loading = false;
      }
    });
  }

  get filteredCustomers(): Customer[] {
    const term = this.searchTerm.trim().toLowerCase();
    const registered = this.customers.filter(customer =>
      customer.name.toLowerCase().includes(term) ||
      customer.phone.toLowerCase().includes(term)
    );

    const walkIn: Customer = {
      id: 'WALK-IN',
      name: 'Walk-in Customer',
      phone: 'N/A',
      customerType: 'Regular',
      isActive: true,
      createdAt: new Date()
    };

    return !term || walkIn.name.toLowerCase().includes(term)
      ? [walkIn, ...registered]
      : registered;
  }

  selectCustomer(customer: Customer): void {
    this.selectedCustomerName = customer.name;
    this.customerSelected.emit(customer);
    this.customerNameChanged.emit(customer.name);
    this.showCustomerList = false;
    this.searchTerm = '';
  }

  openCustomerList(): void {
    this.showCustomerList = !this.showCustomerList;
    if (this.showCustomerList && !this.customers.length) this.loadCustomers();
  }

  closeCustomerList(): void {
    this.showCustomerList = false;
  }

  clearSearch(): void {
    this.searchTerm = '';
  }
}
