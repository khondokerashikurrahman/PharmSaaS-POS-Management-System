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

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  status: 'Active' | 'Inactive';
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

  customer: Customer = {
    id: '',
    name: '',
    phone: '',
    email: '',
    address: '',
    status: 'Active'
  };

  transactions: LedgerTransaction[] = [];

  private customers: Record<string, Customer> = {
    'CUS-001': {
      id: 'CUS-001',
      name: 'Abdul Karim',
      phone: '+880 1712-345678',
      email: 'abdul.karim@gmail.com',
      address: 'Dhanmondi, Dhaka',
      status: 'Active'
    },
    'CUS-002': {
      id: 'CUS-002',
      name: 'Rahim Ahmed',
      phone: '+880 1812-456789',
      email: 'rahim.ahmed@gmail.com',
      address: 'Mirpur, Dhaka',
      status: 'Active'
    },
    'CUS-003': {
      id: 'CUS-003',
      name: 'Sadia Islam',
      phone: '+880 1912-567890',
      email: 'sadia.islam@gmail.com',
      address: 'Uttara, Dhaka',
      status: 'Active'
    },
    'CUS-004': {
      id: 'CUS-004',
      name: 'Tanvir Hasan',
      phone: '+880 1612-678901',
      email: 'tanvir.hasan@gmail.com',
      address: 'Gulshan, Dhaka',
      status: 'Active'
    }
  };

  private ledgerData: Record<string, LedgerTransaction[]> = {

    'CUS-001': [
      {
        id: 'LED-001',
        date: '2026-09-12',
        reference: 'INV-2026-1045',
        description: 'Medicine purchase',
        debit: 2850,
        credit: 2000,
        balance: 850,
        type: 'Purchase'
      },
      {
        id: 'LED-002',
        date: '2026-09-08',
        reference: 'PAY-2026-0088',
        description: 'Customer payment',
        debit: 0,
        credit: 1000,
        balance: 0,
        type: 'Payment'
      },
      {
        id: 'LED-003',
        date: '2026-09-05',
        reference: 'INV-2026-1018',
        description: 'Medicine purchase',
        debit: 3200,
        credit: 2500,
        balance: 1000,
        type: 'Purchase'
      },
      {
        id: 'LED-004',
        date: '2026-09-01',
        reference: 'PAY-2026-0065',
        description: 'Customer payment',
        debit: 0,
        credit: 1500,
        balance: 300,
        type: 'Payment'
      }
    ],

    'CUS-002': [
      {
        id: 'LED-005',
        date: '2026-09-11',
        reference: 'INV-2026-1038',
        description: 'Medicine purchase',
        debit: 4500,
        credit: 3000,
        balance: 1500,
        type: 'Purchase'
      },
      {
        id: 'LED-006',
        date: '2026-09-07',
        reference: 'PAY-2026-0079',
        description: 'Customer payment',
        debit: 0,
        credit: 2000,
        balance: 500,
        type: 'Payment'
      },
      {
        id: 'LED-007',
        date: '2026-09-02',
        reference: 'INV-2026-0988',
        description: 'Medicine purchase',
        debit: 2800,
        credit: 1800,
        balance: 500,
        type: 'Purchase'
      }
    ],

    'CUS-003': [
      {
        id: 'LED-008',
        date: '2026-09-10',
        reference: 'INV-2026-1029',
        description: 'Medicine purchase',
        debit: 1950,
        credit: 1950,
        balance: 0,
        type: 'Purchase'
      },
      {
        id: 'LED-009',
        date: '2026-09-04',
        reference: 'PAY-2026-0061',
        description: 'Customer payment',
        debit: 0,
        credit: 1200,
        balance: 750,
        type: 'Payment'
      }
    ],

    'CUS-004': [
      {
        id: 'LED-010',
        date: '2026-09-09',
        reference: 'INV-2026-1021',
        description: 'Medicine purchase',
        debit: 5600,
        credit: 4000,
        balance: 1600,
        type: 'Purchase'
      },
      {
        id: 'LED-011',
        date: '2026-09-03',
        reference: 'PAY-2026-0054',
        description: 'Customer payment',
        debit: 0,
        credit: 2000,
        balance: 0,
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
      this.customerId = params.get('customerId') || 'CUS-001';

      this.loadCustomer();
      this.loadLedger();
    });
  }

  loadCustomer(): void {
    const customer = this.customers[this.customerId];

    if (customer) {
      this.customer = { ...customer };
    }
  }

  loadLedger(): void {
    this.transactions = this.ledgerData[this.customerId] || [];
  }

  get filteredTransactions(): LedgerTransaction[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.transactions.filter(transaction => {

      const matchesSearch =
        !search ||
        transaction.reference.toLowerCase().includes(search) ||
        transaction.description.toLowerCase().includes(search);

      const matchesType =
        this.typeFilter === 'All' ||
        transaction.type === this.typeFilter;

      return matchesSearch && matchesType;
    });
  }

  get totalDebit(): number {
    return this.transactions.reduce(
      (total, transaction) => total + transaction.debit,
      0
    );
  }

  get totalCredit(): number {
    return this.transactions.reduce(
      (total, transaction) => total + transaction.credit,
      0
    );
  }

  get currentBalance(): number {
    if (!this.transactions.length) {
      return 0;
    }

    return this.transactions[this.transactions.length - 1].balance;
  }

  get totalTransactions(): number {
    return this.transactions.length;
  }

  get balanceLabel(): string {
    return this.currentBalance > 0 ? 'Due Amount' : 'No Due';
  }

  getBalanceClass(): string {
    return this.currentBalance > 0
      ? 'balance-due'
      : 'balance-clear';
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

  goBack(): void {
    this.router.navigate(['/app/stakeholders/customers']);
  }

  viewCustomer(): void {
    this.router.navigate([
      '/app/stakeholders/customers',
      this.customerId
    ]);
  }

  printLedger(): void {
    window.print();
  }
}