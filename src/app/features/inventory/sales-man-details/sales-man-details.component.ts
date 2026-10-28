import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

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
export class SalesManDetailsComponent {

  salesmanId = '';

  salesman: Salesman = {
    id: 'SM-001',
    name: 'Rahim Ahmed',
    phone: '+880 1712-345678',
    email: 'rahim.sales@example.com',
    company: 'Square Pharmaceuticals Ltd.',
    territory: 'Dhaka North',
    commission: 3.5,
    status: 'Active',
    joiningDate: '15 Jan 2025',
    address: 'Mirpur, Dhaka, Bangladesh',
    totalSales: 485000,
    totalOrders: 126,
    outstanding: 18500
  };

  salesHistory = [
    {
      invoice: 'INV-2026-1025',
      date: '12 Sep 2026',
      customer: 'Care Pharmacy',
      amount: 12500,
      commission: 437.50,
      status: 'Paid'
    },
    {
      invoice: 'INV-2026-1018',
      date: '10 Sep 2026',
      customer: 'MediPlus Pharmacy',
      amount: 8900,
      commission: 311.50,
      status: 'Paid'
    },
    {
      invoice: 'INV-2026-1007',
      date: '08 Sep 2026',
      customer: 'Health Care Pharmacy',
      amount: 15600,
      commission: 546,
      status: 'Pending'
    },
    {
      invoice: 'INV-2026-0998',
      date: '05 Sep 2026',
      customer: 'Popular Medicine Center',
      amount: 11200,
      commission: 392,
      status: 'Paid'
    }
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.salesmanId =
      this.route.snapshot.paramMap.get('id') || 'SM-001';

    this.loadSalesman();
  }

  loadSalesman(): void {
    const demoSalesmen: Record<string, Salesman> = {

      'SM-001': {
        id: 'SM-001',
        name: 'Rahim Ahmed',
        phone: '+880 1712-345678',
        email: 'rahim.sales@example.com',
        company: 'Square Pharmaceuticals Ltd.',
        territory: 'Dhaka North',
        commission: 3.5,
        status: 'Active',
        joiningDate: '15 Jan 2025',
        address: 'Mirpur, Dhaka, Bangladesh',
        totalSales: 485000,
        totalOrders: 126,
        outstanding: 18500
      },

      'SM-002': {
        id: 'SM-002',
        name: 'Karim Hasan',
        phone: '+880 1812-456789',
        email: 'karim.sales@example.com',
        company: 'Beximco Pharmaceuticals Ltd.',
        territory: 'Dhaka South',
        commission: 4,
        status: 'Active',
        joiningDate: '10 Mar 2025',
        address: 'Dhanmondi, Dhaka, Bangladesh',
        totalSales: 392000,
        totalOrders: 98,
        outstanding: 12400
      },

      'SM-003': {
        id: 'SM-003',
        name: 'Sakib Khan',
        phone: '+880 1912-567890',
        email: 'sakib.sales@example.com',
        company: 'Renata Limited',
        territory: 'Uttara',
        commission: 3,
        status: 'Active',
        joiningDate: '22 May 2025',
        address: 'Uttara, Dhaka, Bangladesh',
        totalSales: 315000,
        totalOrders: 82,
        outstanding: 9600
      },

      'SM-004': {
        id: 'SM-004',
        name: 'Nayeem Islam',
        phone: '+880 1612-678901',
        email: 'nayeem.sales@example.com',
        company: 'ACME Laboratories Ltd.',
        territory: 'Gulshan',
        commission: 3.5,
        status: 'Inactive',
        joiningDate: '05 Aug 2024',
        address: 'Gulshan, Dhaka, Bangladesh',
        totalSales: 278000,
        totalOrders: 71,
        outstanding: 7200
      }
    };

    const existingSalesman = demoSalesmen[this.salesmanId];

    if (existingSalesman) {
      this.salesman = { ...existingSalesman };
    } else {
      alert('Salesman not found.');
      this.goBack();
    }
  }

  getStatusClass(status: Salesman['status']): string {
    return status === 'Active'
      ? 'status-active'
      : 'status-inactive';
  }

  getPaymentStatusClass(status: string): string {
    return status === 'Paid'
      ? 'payment-paid'
      : 'payment-pending';
  }

  editSalesman(): void {
    this.router.navigate([
      '/app/inventory/salesmen',
      this.salesman.id,
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