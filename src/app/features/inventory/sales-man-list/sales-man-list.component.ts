import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface Salesman {
  id: string;
  name: string;
  phone: string;
  email: string;
  company: string;
  territory: string;
  commission: number;
  totalSales: number;
  status: 'Active' | 'Inactive';
}

@Component({
  selector: 'app-sales-man-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sales-man-list.component.html',
  styleUrl: './sales-man-list.component.scss'
})
export class SalesManListComponent {

  searchTerm = '';
  statusFilter = 'All';

  salesmen: Salesman[] = [
    {
      id: 'SM-001',
      name: 'Rahim Ahmed',
      phone: '+880 1712-345678',
      email: 'rahim@pharmsaas.com',
      company: 'Square Pharmaceuticals Ltd.',
      territory: 'Dhaka North',
      commission: 3.5,
      totalSales: 485000,
      status: 'Active'
    },
    {
      id: 'SM-002',
      name: 'Karim Hasan',
      phone: '+880 1812-456789',
      email: 'karim@pharmsaas.com',
      company: 'Beximco Pharmaceuticals Ltd.',
      territory: 'Dhaka South',
      commission: 4,
      totalSales: 392500,
      status: 'Active'
    },
    {
      id: 'SM-003',
      name: 'Sakib Khan',
      phone: '+880 1912-567890',
      email: 'sakib@pharmsaas.com',
      company: 'Renata Limited',
      territory: 'Mirpur',
      commission: 3,
      totalSales: 275800,
      status: 'Active'
    },
    {
      id: 'SM-004',
      name: 'Tanvir Hasan',
      phone: '+880 1612-678901',
      email: 'tanvir@pharmsaas.com',
      company: 'ACME Laboratories Ltd.',
      territory: 'Uttara',
      commission: 3.5,
      totalSales: 198500,
      status: 'Inactive'
    },
    {
      id: 'SM-005',
      name: 'Nayeem Islam',
      phone: '+880 1512-789012',
      email: 'nayeem@pharmsaas.com',
      company: 'Incepta Pharmaceuticals Ltd.',
      territory: 'Gulshan',
      commission: 4,
      totalSales: 346200,
      status: 'Active'
    },
    {
      id: 'SM-006',
      name: 'Fahim Rahman',
      phone: '+880 1812-890123',
      email: 'fahim@pharmsaas.com',
      company: 'Aristopharma Ltd.',
      territory: 'Mohammadpur',
      commission: 3,
      totalSales: 154750,
      status: 'Inactive'
    }
  ];

  constructor(
    private router: Router
  ) {}

  get filteredSalesmen(): Salesman[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.salesmen.filter(salesman => {

      const matchesSearch =
        !search ||
        salesman.name.toLowerCase().includes(search) ||
        salesman.id.toLowerCase().includes(search) ||
        salesman.phone.toLowerCase().includes(search) ||
        salesman.company.toLowerCase().includes(search) ||
        salesman.territory.toLowerCase().includes(search);

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
    return this.salesmen.filter(
      salesman => salesman.status === 'Active'
    ).length;
  }

  get inactiveSalesmen(): number {
    return this.salesmen.filter(
      salesman => salesman.status === 'Inactive'
    ).length;
  }

  get totalSales(): number {
    return this.salesmen.reduce(
      (total, salesman) => total + salesman.totalSales,
      0
    );
  }

  getInitial(name: string): string {
    return name.charAt(0).toUpperCase();
  }

  viewSalesman(id: string): void {
    this.router.navigate([
      '/app/inventory/salesmen',
      id
    ]);
  }

  editSalesman(id: string): void {
    this.router.navigate([
      '/app/inventory/salesmen',
      id,
      'edit'
    ]);
  }

  addSalesman(): void {
    this.router.navigate([
      '/app/inventory/salesmen/new'
    ]);
  }

  getStatusClass(status: string): string {
    return status === 'Active'
      ? 'status-active'
      : 'status-inactive';
  }

}