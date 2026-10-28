import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  totalPurchases: number;
  totalPaid: number;
  dueAmount: number;
  status: 'Active' | 'Inactive';
  lastPurchase: string;
}

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customer-list.component.html',
  styleUrl: './customer-list.component.scss'
})
export class CustomerListComponent {

  searchTerm = '';
  statusFilter = 'All';

  customers: Customer[] = [
    {
      id: 'CUS-001',
      name: 'Abdul Karim',
      phone: '+880 1711-234567',
      email: 'abdul.karim@gmail.com',
      address: 'Dhanmondi, Dhaka',
      totalPurchases: 48500,
      totalPaid: 45000,
      dueAmount: 3500,
      status: 'Active',
      lastPurchase: '12 Sep 2026'
    },
    {
      id: 'CUS-002',
      name: 'Rahim Ahmed',
      phone: '+880 1812-345678',
      email: 'rahim.ahmed@gmail.com',
      address: 'Mirpur, Dhaka',
      totalPurchases: 32600,
      totalPaid: 32600,
      dueAmount: 0,
      status: 'Active',
      lastPurchase: '11 Sep 2026'
    },
    {
      id: 'CUS-003',
      name: 'Sadia Islam',
      phone: '+880 1912-456789',
      email: 'sadia.islam@gmail.com',
      address: 'Uttara, Dhaka',
      totalPurchases: 28750,
      totalPaid: 25000,
      dueAmount: 3750,
      status: 'Active',
      lastPurchase: '10 Sep 2026'
    },
    {
      id: 'CUS-004',
      name: 'Tanvir Hasan',
      phone: '+880 1612-567890',
      email: 'tanvir.hasan@gmail.com',
      address: 'Mohammadpur, Dhaka',
      totalPurchases: 19400,
      totalPaid: 19400,
      dueAmount: 0,
      status: 'Active',
      lastPurchase: '09 Sep 2026'
    },
    {
      id: 'CUS-005',
      name: 'Nusrat Jahan',
      phone: '+880 1512-678901',
      email: 'nusrat.jahan@gmail.com',
      address: 'Gulshan, Dhaka',
      totalPurchases: 41200,
      totalPaid: 38000,
      dueAmount: 3200,
      status: 'Active',
      lastPurchase: '08 Sep 2026'
    },
    {
      id: 'CUS-006',
      name: 'Fahim Rahman',
      phone: '+880 1812-789012',
      email: 'fahim.rahman@gmail.com',
      address: 'Banani, Dhaka',
      totalPurchases: 15600,
      totalPaid: 15600,
      dueAmount: 0,
      status: 'Inactive',
      lastPurchase: '25 Aug 2026'
    },
    {
      id: 'CUS-007',
      name: 'Mst. Shirin Akter',
      phone: '+880 1715-890123',
      email: 'shirin.akter@gmail.com',
      address: 'Bashundhara, Dhaka',
      totalPurchases: 52300,
      totalPaid: 47000,
      dueAmount: 5300,
      status: 'Active',
      lastPurchase: '07 Sep 2026'
    },
    {
      id: 'CUS-008',
      name: 'Mehedi Hasan',
      phone: '+880 1915-901234',
      email: 'mehedi.hasan@gmail.com',
      address: 'Wari, Dhaka',
      totalPurchases: 22100,
      totalPaid: 22100,
      dueAmount: 0,
      status: 'Active',
      lastPurchase: '06 Sep 2026'
    }
  ];

  constructor(private router: Router) {}

  get filteredCustomers(): Customer[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.customers.filter(customer => {

      const matchesSearch =
        !search ||
        customer.id.toLowerCase().includes(search) ||
        customer.name.toLowerCase().includes(search) ||
        customer.phone.toLowerCase().includes(search) ||
        customer.email.toLowerCase().includes(search) ||
        customer.address.toLowerCase().includes(search);

      const matchesStatus =
        this.statusFilter === 'All' ||
        customer.status === this.statusFilter;

      return matchesSearch && matchesStatus;
    });
  }

  get totalCustomers(): number {
    return this.customers.length;
  }

  get activeCustomers(): number {
    return this.customers.filter(
      customer => customer.status === 'Active'
    ).length;
  }

  get inactiveCustomers(): number {
    return this.customers.filter(
      customer => customer.status === 'Inactive'
    ).length;
  }

  get totalDue(): number {
    return this.customers.reduce(
      (total, customer) => total + customer.dueAmount,
      0
    );
  }

  get totalPurchases(): number {
    return this.customers.reduce(
      (total, customer) => total + customer.totalPurchases,
      0
    );
  }

  getInitial(name: string): string {
    return name.charAt(0).toUpperCase();
  }

  viewCustomer(id: string): void {
    this.router.navigate(['/app/stakeholders/customers', id]);
  }

  viewLedger(id: string): void {
    this.router.navigate(
      ['/app/stakeholders/customers/ledger'],
      { queryParams: { customerId: id } }
    );
  }

  addCustomer(): void {
    alert('Customer form will be connected with backend later.');
  }

  getStatusClass(status: string): string {
    return status === 'Active'
      ? 'status-active'
      : 'status-inactive';
  }
}