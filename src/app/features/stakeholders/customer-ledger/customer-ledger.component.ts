import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CustomerApiService, CustomerResponse, CustomerLedgerResponse, CustomerLedgerTransaction } from '../../../core/services/customer-api.service';

type LedgerTransaction = CustomerLedgerTransaction;

interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  status: string;
}

@Component({
  selector: 'app-customer-ledger',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customer-ledger.component.html',
  styleUrl: './customer-ledger.component.scss'
})
export class CustomerLedgerComponent implements OnInit {
  customerId = '';
  searchTerm = '';
  typeFilter = 'All';
  loading = true;
  errorMessage = '';

  customer: Customer = {
    id: 0, name: '', phone: '', email: '', address: '', status: 'Active'
  };

  transactions: LedgerTransaction[] = [];
  ledgerSummary: CustomerLedgerResponse | null = null;

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
    this.route.queryParamMap.subscribe(params => {
      this.customerId = params.get('customerId') || '';
      this.loadData();
    });
  }

  loadData(): void {
    const tenantId = this.tenantId();
    const customerId = Number(this.customerId);

    this.loading = true;
    this.errorMessage = '';

    if (!tenantId || !Number.isInteger(customerId) || customerId <= 0) {
      this.loading = false;
      this.errorMessage = 'Please select a valid customer.';
      return;
    }

    this.customerApi.getById(tenantId, customerId).subscribe({
      next: (c: CustomerResponse) => {
        this.customer = {
          id: c.id,
          name: c.name,
          phone: c.phone || '—',
          email: c.email || '—',
          address: c.address || '—',
          status: c.status
        };

        this.customerApi.ledger(tenantId, customerId).subscribe({
          next: ledger => {
            this.ledgerSummary = ledger;
            this.transactions = ledger.transactions || [];
            this.loading = false;
          },
          error: err => {
            this.loading = false;
            this.errorMessage = err?.error?.message || 'Unable to load customer ledger.';
          }
        });
      },
      error: err => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Unable to load customer.';
      }
    });
  }

  get filteredTransactions(): LedgerTransaction[] {
    const search = this.searchTerm.trim().toLowerCase();
    return this.transactions.filter(t => {
      const matchesSearch = !search ||
        (t.reference || '').toLowerCase().includes(search) ||
        (t.description || '').toLowerCase().includes(search);
      const matchesType = this.typeFilter === 'All' || t.type === this.typeFilter;
      return matchesSearch && matchesType;
    });
  }

  get totalDebit(): number {
    return this.ledgerSummary?.totalPurchases || 0;
  }

  get totalCredit(): number {
    return (this.ledgerSummary?.totalPaid || 0) +
      (this.ledgerSummary?.totalRefunded || 0);
  }

  get currentBalance(): number {
    return this.ledgerSummary?.currentBalance || 0;
  }

  get totalTransactions(): number {
    return this.transactions.length;
  }

  get balanceLabel(): string {
    if (this.currentBalance > 0) return 'Due Amount';
    if (this.currentBalance < 0) return 'Customer Credit';
    return 'No Due';
  }

  getBalanceClass(): string {
    return this.currentBalance > 0 ? 'balance-due' : 'balance-clear';
  }

  getTypeClass(type: string): string {
    switch (type) {
      case 'Purchase': return 'type-purchase';
      case 'Payment': return 'type-payment';
      case 'Return': return 'type-return';
      default: return 'type-adjustment';
    }
  }

  goBack(): void {
    this.router.navigate(['/app/stakeholders/customers']);
  }

  viewCustomer(): void {
    this.router.navigate(['/app/stakeholders/customers', this.customerId]);
  }

  printLedger(): void {
    window.print();
  }
}
