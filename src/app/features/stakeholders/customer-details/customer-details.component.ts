import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

interface Purchase {
  invoice: string;
  date: string;
  items: number;
  amount: number;
  paid: number;
  due: number;
  status: 'Paid' | 'Partial';
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  status: 'Active' | 'Inactive';
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

  private customers: Record<string, Customer> = {

    'CUS-001': {
      id: 'CUS-001',
      name: 'Abdul Karim',
      phone: '+880 1711-234567',
      email: 'abdul.karim@gmail.com',
      address: 'Dhanmondi, Dhaka',
      status: 'Active',
      totalPurchases: 48500,
      totalPaid: 45000,
      dueAmount: 3500,
      totalOrders: 18,
      lastPurchase: '12 Sep 2026',
      memberSince: '15 Jan 2025',
      purchases: [
        {
          invoice: 'INV-2026-1048',
          date: '12 Sep 2026',
          items: 6,
          amount: 4850,
          paid: 4850,
          due: 0,
          status: 'Paid'
        },
        {
          invoice: 'INV-2026-0987',
          date: '28 Aug 2026',
          items: 8,
          amount: 7250,
          paid: 5000,
          due: 2250,
          status: 'Partial'
        },
        {
          invoice: 'INV-2026-0912',
          date: '14 Aug 2026',
          items: 5,
          amount: 4100,
          paid: 4100,
          due: 0,
          status: 'Paid'
        },
        {
          invoice: 'INV-2026-0845',
          date: '30 Jul 2026',
          items: 9,
          amount: 6800,
          paid: 6800,
          due: 0,
          status: 'Paid'
        }
      ]
    },

    'CUS-002': {
      id: 'CUS-002',
      name: 'Rahim Ahmed',
      phone: '+880 1812-345678',
      email: 'rahim.ahmed@gmail.com',
      address: 'Mirpur, Dhaka',
      status: 'Active',
      totalPurchases: 32600,
      totalPaid: 32600,
      dueAmount: 0,
      totalOrders: 14,
      lastPurchase: '11 Sep 2026',
      memberSince: '20 Mar 2025',
      purchases: [
        {
          invoice: 'INV-2026-1042',
          date: '11 Sep 2026',
          items: 5,
          amount: 3650,
          paid: 3650,
          due: 0,
          status: 'Paid'
        },
        {
          invoice: 'INV-2026-0975',
          date: '25 Aug 2026',
          items: 7,
          amount: 5400,
          paid: 5400,
          due: 0,
          status: 'Paid'
        }
      ]
    },

    'CUS-003': {
      id: 'CUS-003',
      name: 'Sadia Islam',
      phone: '+880 1912-456789',
      email: 'sadia.islam@gmail.com',
      address: 'Uttara, Dhaka',
      status: 'Active',
      totalPurchases: 28750,
      totalPaid: 25000,
      dueAmount: 3750,
      totalOrders: 11,
      lastPurchase: '10 Sep 2026',
      memberSince: '08 Apr 2025',
      purchases: [
        {
          invoice: 'INV-2026-1038',
          date: '10 Sep 2026',
          items: 4,
          amount: 3750,
          paid: 0,
          due: 3750,
          status: 'Partial'
        },
        {
          invoice: 'INV-2026-0962',
          date: '20 Aug 2026',
          items: 6,
          amount: 4900,
          paid: 4900,
          due: 0,
          status: 'Paid'
        }
      ]
    },

    'CUS-004': {
      id: 'CUS-004',
      name: 'Tanvir Hasan',
      phone: '+880 1612-567890',
      email: 'tanvir.hasan@gmail.com',
      address: 'Mohammadpur, Dhaka',
      status: 'Active',
      totalPurchases: 19400,
      totalPaid: 19400,
      dueAmount: 0,
      totalOrders: 9,
      lastPurchase: '09 Sep 2026',
      memberSince: '12 May 2025',
      purchases: [
        {
          invoice: 'INV-2026-1031',
          date: '09 Sep 2026',
          items: 5,
          amount: 2850,
          paid: 2850,
          due: 0,
          status: 'Paid'
        }
      ]
    }

  };

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.customerId =
      this.route.snapshot.paramMap.get('id') || '';

    this.loadCustomer();
  }

  loadCustomer(): void {
    this.customer =
      this.customers[this.customerId] || null;

    if (!this.customer) {
      alert('Customer not found.');
      this.goBack();
    }
  }

  getInitial(): string {
    return this.customer?.name
      ?.charAt(0)
      .toUpperCase() || 'C';
  }

  goBack(): void {
    this.router.navigate(['/app/stakeholders/customers']);
  }

  openLedger(): void {
    this.router.navigate(
      ['/app/stakeholders/customers/ledger'],
      {
        queryParams: {
          customerId: this.customer?.id
        }
      }
    );
  }

  printDetails(): void {
    window.print();
  }

  getStatusClass(status: string): string {
    return status === 'Active'
      ? 'status-active'
      : 'status-inactive';
  }

  getPurchaseStatusClass(status: string): string {
    return status === 'Paid'
      ? 'purchase-paid'
      : 'purchase-partial';
  }
}