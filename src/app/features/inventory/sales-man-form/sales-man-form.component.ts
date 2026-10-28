import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

interface Salesman {
  id: string;
  name: string;
  phone: string;
  email: string;
  company: string;
  territory: string;
  commission: number;
  status: 'Active' | 'Inactive';
}

@Component({
  selector: 'app-sales-man-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sales-man-form.component.html',
  styleUrl: './sales-man-form.component.scss'
})
export class SalesManFormComponent implements OnInit {

  isEditMode = false;
  salesmanId = '';

  salesman: Salesman = {
    id: '',
    name: '',
    phone: '',
    email: '',
    company: '',
    territory: '',
    commission: 3,
    status: 'Active'
  };

  companies: string[] = [
    'Square Pharmaceuticals Ltd.',
    'Beximco Pharmaceuticals Ltd.',
    'Renata Limited',
    'ACME Laboratories Ltd.',
    'Incepta Pharmaceuticals Ltd.',
    'Aristopharma Ltd.'
  ];

  territories: string[] = [
    'Dhaka North',
    'Dhaka South',
    'Mirpur',
    'Uttara',
    'Gulshan',
    'Mohammadpur',
    'Dhanmondi',
    'Banani'
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.salesmanId = this.route.snapshot.paramMap.get('id') || '';
    this.isEditMode = !!this.salesmanId;

    if (this.isEditMode) {
      this.loadSalesman();
    } else {
      this.salesman.id = this.generateSalesmanId();
    }
  }

  generateSalesmanId(): string {
    return 'SM-' + String(Date.now()).slice(-3);
  }

  loadSalesman(): void {

    const demoSalesmen: Record<string, Salesman> = {

      'SM-001': {
        id: 'SM-001',
        name: 'Rahim Ahmed',
        phone: '+880 1712-345678',
        email: 'rahim@pharmsaas.com',
        company: 'Square Pharmaceuticals Ltd.',
        territory: 'Dhaka North',
        commission: 3.5,
        status: 'Active'
      },

      'SM-002': {
        id: 'SM-002',
        name: 'Karim Hasan',
        phone: '+880 1812-456789',
        email: 'karim@pharmsaas.com',
        company: 'Beximco Pharmaceuticals Ltd.',
        territory: 'Dhaka South',
        commission: 4,
        status: 'Active'
      },

      'SM-003': {
        id: 'SM-003',
        name: 'Sakib Khan',
        phone: '+880 1912-567890',
        email: 'sakib@pharmsaas.com',
        company: 'Renata Limited',
        territory: 'Mirpur',
        commission: 3,
        status: 'Active'
      },

      'SM-004': {
        id: 'SM-004',
        name: 'Tanvir Hasan',
        phone: '+880 1612-678901',
        email: 'tanvir@pharmsaas.com',
        company: 'ACME Laboratories Ltd.',
        territory: 'Uttara',
        commission: 3.5,
        status: 'Inactive'
      },

      'SM-005': {
        id: 'SM-005',
        name: 'Nayeem Islam',
        phone: '+880 1512-789012',
        email: 'nayeem@pharmsaas.com',
        company: 'Incepta Pharmaceuticals Ltd.',
        territory: 'Gulshan',
        commission: 4,
        status: 'Active'
      },

      'SM-006': {
        id: 'SM-006',
        name: 'Fahim Rahman',
        phone: '+880 1812-890123',
        email: 'fahim@pharmsaas.com',
        company: 'Aristopharma Ltd.',
        territory: 'Mohammadpur',
        commission: 3,
        status: 'Inactive'
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

  saveSalesman(): void {

    if (!this.salesman.name.trim()) {
      alert('Please enter salesman name.');
      return;
    }

    if (!this.salesman.phone.trim()) {
      alert('Please enter phone number.');
      return;
    }

    if (!this.salesman.email.trim()) {
      alert('Please enter email address.');
      return;
    }

    if (!this.salesman.company) {
      alert('Please select company.');
      return;
    }

    if (!this.salesman.territory) {
      alert('Please select territory.');
      return;
    }

    if (
      this.salesman.commission === null ||
      this.salesman.commission === undefined ||
      this.salesman.commission < 0
    ) {
      alert('Please enter a valid commission.');
      return;
    }

    if (this.isEditMode) {
      alert('Salesman updated successfully.');
    } else {
      alert('Salesman added successfully.');
    }

    this.router.navigate(['/app/inventory/salesmen']);
  }

  cancel(): void {
    this.goBack();
  }

  goBack(): void {
    this.router.navigate(['/app/inventory/salesmen']);
  }
}