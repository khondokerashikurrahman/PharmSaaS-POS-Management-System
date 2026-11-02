import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomerApiService, CustomerResponse, CustomerPurchaseResponse, CustomerLedgerResponse } from '../../../core/services/customer-api.service';

interface Purchase {
  invoice: string;
  date: string;
  items: number;
  amount: number;
  paid: number;
  due: number;
  status: string;
}

interface Customer {
  id: number;
  customerCode: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  status: string;
  totalPurchases: number;
  totalPaid: number;
  dueAmount: number;
  totalOrders: number;
  lastPurchase: string;
  memberSince: string;
  purchases: Purchase[];
}

@Component({
  selector: 'app-customer-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customer-details.component.html',
  styleUrl: './customer-details.component.scss'
})
export class CustomerDetailsComponent implements OnInit {
  customerId = '';
  customer: Customer | null = null;
  loading = true;
  errorMessage = '';

  private tenantId(): number {
    const user = JSON.parse(localStorage.getItem('pharm_user') || '{}');
    return Number(
      localStorage.getItem('tenantId') ||
      localStorage.getItem('tenant_id') ||
      user.tenantId || user.tenant?.id || user.currentTenantId || 0
    );
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private customerApi: CustomerApiService
  ) {}

  ngOnInit(): void {
    this.customerId = this.route.snapshot.paramMap.get('id') || '';
    this.loadCustomer();
  }

  loadCustomer(): void {
    const tenantId = this.tenantId();
    const customerId = Number(this.customerId);

    if (!tenantId || !Number.isInteger(customerId) || customerId <= 0) {
      this.loading = false;
      this.errorMessage = 'Invalid tenant or customer ID.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.customerApi.getById(tenantId, customerId).subscribe({
      next: customer => this.loadCustomerFinancials(tenantId, customer),
      error: err => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Unable to load customer details.';
      }
    });
  }

  private loadCustomerFinancials(tenantId: number, response: CustomerResponse): void {
    const id = response.id;

    this.customerApi.purchases(tenantId, id).subscribe({
      next: purchases => {
        this.customerApi.ledger(tenantId, id).subscribe({
          next: ledger => {
            this.customer = this.mapCustomer(response, purchases, ledger);
            this.loading = false;
          },
          error: err => {
            this.errorMessage = err?.error?.message || 'Unable to load customer ledger.';
            this.loading = false;
          }
        });
      },
      error: err => {
        this.errorMessage = err?.error?.message || 'Unable to load purchase history.';
        this.loading = false;
      }
    });
  }

  private mapCustomer(
    c: CustomerResponse,
    purchases: CustomerPurchaseResponse[],
    ledger: CustomerLedgerResponse
  ): Customer {
    const rows = purchases.map(p => ({
      invoice: p.invoiceNumber,
      date: p.date,
      items: p.itemCount,
      amount: Number(p.amount || 0),
      paid: Number(p.amount || 0),
      due: 0,
      status: p.status?.toUpperCase() === 'COMPLETED' ? 'Paid' : p.status
    }));

    return {
      id: c.id,
      customerCode: c.customerCode,
      name: c.name,
      phone: c.phone || '—',
      email: c.email || '—',
      address: c.address || '—',
      status: c.status,
      totalPurchases: Number(ledger.totalPurchases || 0),
      totalPaid: Number(ledger.totalPaid || 0),
      dueAmount: Number(ledger.currentBalance || 0),
      totalOrders: rows.length,
      lastPurchase: rows.length ? rows[0].date : '—',
      memberSince: c.createdAt || '—',
      purchases: rows
    };
  }

  getInitial(): string {
    return this.customer?.name?.charAt(0).toUpperCase() || 'C';
  }

  goBack(): void {
    this.router.navigate(['/app/stakeholders/customers']);
  }

  openLedger(): void {
    if (!this.customer) return;
    this.router.navigate(['/app/stakeholders/customers/ledger'], {
      queryParams: { customerId: this.customer.id }
    });
  }

  printDetails(): void {
    window.print();
  }

  getStatusClass(status: string): string {
    return status === 'Active' ? 'status-active' : 'status-inactive';
  }

  getPurchaseStatusClass(status: string): string {
    return status === 'Paid' ? 'purchase-paid' : 'purchase-partial';
  }
}
