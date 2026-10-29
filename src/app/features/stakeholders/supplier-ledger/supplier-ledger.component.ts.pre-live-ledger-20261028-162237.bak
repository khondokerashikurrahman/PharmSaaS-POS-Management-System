import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface LedgerTransaction {
  id: string;
  date: string;
  reference: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  type: 'Purchase' | 'Payment' | 'Adjustment';
}

interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  status: 'Active' | 'Inactive';
}

@Component({
  selector: 'app-supplier-ledger',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './supplier-ledger.component.html',
  styleUrl: './supplier-ledger.component.scss'
})
export class SupplierLedgerComponent implements OnInit {

  supplierId = '';
  searchTerm = '';
  typeFilter = 'All';

  supplier: Supplier = {
    id: '',
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    status: 'Active'
  };

  transactions: LedgerTransaction[] = [];

  private suppliers: Record<string, Supplier> = {
    'SUP-001': {
      id: 'SUP-001',
      name: 'Square Pharmaceuticals Ltd.',
      contactPerson: 'Abdul Karim',
      phone: '+880 1712-345678',
      email: 'contact@squarepharma.com',
      address: 'Mohakhali, Dhaka',
      status: 'Active'
    },
    'SUP-002': {
      id: 'SUP-002',
      name: 'Beximco Pharmaceuticals Ltd.',
      contactPerson: 'Rahim Ahmed',
      phone: '+880 1812-456789',
      email: 'info@beximco.com',
      address: 'Dhanmondi, Dhaka',
      status: 'Active'
    },
    'SUP-003': {
      id: 'SUP-003',
      name: 'Renata Limited',
      contactPerson: 'Karim Hasan',
      phone: '+880 1912-567890',
      email: 'contact@renata-ltd.com',
      address: 'Mirpur, Dhaka',
      status: 'Active'
    },
    'SUP-004': {
      id: 'SUP-004',
      name: 'ACME Laboratories Ltd.',
      contactPerson: 'Sakib Khan',
      phone: '+880 1612-678901',
      email: 'info@acme.com.bd',
      address: 'Tongi, Gazipur',
      status: 'Active'
    }
  };

  private ledgerData: Record<string, LedgerTransaction[]> = {

    'SUP-001': [
      {
        id: 'SL-001',
        date: '2026-09-12',
        reference: 'PO-2026-1045',
        description: 'Medicine purchase',
        debit: 28500,
        credit: 20000,
        balance: 8500,
        type: 'Purchase'
      },
      {
        id: 'SL-002',
        date: '2026-09-09',
        reference: 'PAY-2026-0088',
        description: 'Supplier payment',
        debit: 0,
        credit: 10000,
        balance: 8500,
        type: 'Payment'
      },
      {
        id: 'SL-003',
        date: '2026-09-05',
        reference: 'PO-2026-1018',
        description: 'Medicine purchase',
        debit: 32000,
        credit: 25000,
        balance: 18500,
        type: 'Purchase'
      },
      {
        id: 'SL-004',
        date: '2026-09-01',
        reference: 'PAY-2026-0065',
        description: 'Supplier payment',
        debit: 0,
        credit: 15000,
        balance: 11500,
        type: 'Payment'
      }
    ],

    'SUP-002': [
      {
        id: 'SL-005',
        date: '2026-09-10',
        reference: 'PO-2026-1038',
        description: 'Medicine purchase',
        debit: 45000,
        credit: 30000,
        balance: 15000,
        type: 'Purchase'
      },
      {
        id: 'SL-006',
        date: '2026-09-07',
        reference: 'PAY-2026-0079',
        description: 'Supplier payment',
        debit: 0,
        credit: 20000,
        balance: 15000,
        type: 'Payment'
      },
      {
        id: 'SL-007',
        date: '2026-09-02',
        reference: 'PO-2026-0988',
        description: 'Medicine purchase',
        debit: 28000,
        credit: 18000,
        balance: 25000,
        type: 'Purchase'
      }
    ],

    'SUP-003': [
      {
        id: 'SL-008',
        date: '2026-09-08',
        reference: 'PO-2026-1029',
        description: 'Medicine purchase',
        debit: 19500,
        credit: 19500,
        balance: 0,
        type: 'Purchase'
      },
      {
        id: 'SL-009',
        date: '2026-09-04',
        reference: 'PAY-2026-0061',
        description: 'Supplier payment',
        debit: 0,
        credit: 12000,
        balance: 0,
        type: 'Payment'
      }
    ],

    'SUP-004': [
      {
        id: 'SL-010',
        date: '2026-09-06',
        reference: 'PO-2026-1021',
        description: 'Medicine purchase',
        debit: 56000,
        credit: 40000,
        balance: 16000,
        type: 'Purchase'
      },
      {
        id: 'SL-011',
        date: '2026-09-03',
        reference: 'PAY-2026-0054',
        description: 'Supplier payment',
        debit: 0,
        credit: 20000,
        balance: 16000,
        type: 'Payment'
      }
    ]
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {

      this.supplierId =
        params.get('supplierId') || 'SUP-001';

      this.loadSupplier();
      this.loadLedger();
    });
  }

  loadSupplier(): void {
    const supplier = this.suppliers[this.supplierId];

    if (supplier) {
      this.supplier = { ...supplier };
    }
  }

  loadLedger(): void {
    this.transactions =
      this.ledgerData[this.supplierId] || [];
  }

  get filteredTransactions(): LedgerTransaction[] {

    const search =
      this.searchTerm.trim().toLowerCase();

    return this.transactions.filter(transaction => {

      const matchesSearch =
        !search ||
        transaction.reference
          .toLowerCase()
          .includes(search) ||
        transaction.description
          .toLowerCase()
          .includes(search);

      const matchesType =
        this.typeFilter === 'All' ||
        transaction.type === this.typeFilter;

      return matchesSearch && matchesType;
    });
  }

  get totalPurchases(): number {
    return this.transactions.reduce(
      (total, transaction) =>
        total + transaction.debit,
      0
    );
  }

  get totalPayments(): number {
    return this.transactions.reduce(
      (total, transaction) =>
        total + transaction.credit,
      0
    );
  }

  get currentBalance(): number {

    if (!this.transactions.length) {
      return 0;
    }

    return this.transactions[
      this.transactions.length - 1
    ].balance;
  }

  get totalTransactions(): number {
    return this.transactions.length;
  }

  get balanceLabel(): string {
    return this.currentBalance > 0
      ? 'Payable Due'
      : 'No Due';
  }

  getTypeClass(type: string): string {

    switch (type) {

      case 'Purchase':
        return 'type-purchase';

      case 'Payment':
        return 'type-payment';

      default:
        return 'type-adjustment';
    }
  }

  getBalanceClass(): string {
    return this.currentBalance > 0
      ? 'balance-due'
      : 'balance-clear';
  }

  goBack(): void {
    this.router.navigate([
      '/app/stakeholders/suppliers'
    ]);
  }

  printLedger(): void {
    window.print();
  }
}