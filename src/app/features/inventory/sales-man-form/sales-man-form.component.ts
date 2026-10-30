import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SalesmanApiService, SalesmanRequest } from '../../../core/services/salesman-api.service';

interface SalesmanForm {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
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
  loading = false;
  saving = false;
  errorMessage = '';

  salesman: SalesmanForm = {
    id: '',
    name: '',
    phone: '',
    email: '',
    address: '',
    territory: '',
    commission: 0,
    status: 'Active'
  };

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
    private route: ActivatedRoute,
    private salesmanApi: SalesmanApiService
  ) {}

  ngOnInit(): void {
    this.salesmanId = this.route.snapshot.paramMap.get('id') || '';
    this.isEditMode = !!this.salesmanId;

    if (this.isEditMode) {
      this.loadSalesman();
    } else {
      this.salesman.id = 'SM-' + Date.now().toString().slice(-6);
    }
  }

  loadSalesman(): void {
    const id = Number(this.salesmanId);
    if (!Number.isInteger(id) || id <= 0) {
      this.errorMessage = 'Invalid salesman ID.';
      return;
    }

    this.loading = true;
    this.salesmanApi.get(id).subscribe({
      next: (item) => {
        this.salesman = {
          id: item.employeeId,
          name: item.name || '',
          phone: item.phone || '',
          email: item.email || '',
          address: item.address || '',
          territory: item.territory || '',
          commission: Number(item.commissionRate || 0),
          status: item.status
        };
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error?.error?.message ||
          error?.error?.detail ||
          'Unable to load salesman details.';
        this.loading = false;
      }
    });
  }

  saveSalesman(): void {
    this.errorMessage = '';

    if (!this.salesman.name.trim()) {
      this.errorMessage = 'Please enter salesman name.';
      return;
    }

    if (!this.salesman.id.trim()) {
      this.errorMessage = 'Please enter salesman employee ID.';
      return;
    }

    if (!this.salesman.phone.trim()) {
      this.errorMessage = 'Please enter phone number.';
      return;
    }

    if (
      !Number.isFinite(this.salesman.commission) ||
      this.salesman.commission < 0 ||
      this.salesman.commission > 100 ||
      !Number.isInteger(this.salesman.commission * 100)
    ) {
      this.errorMessage = 'Commission must be between 0 and 100, up to two decimal places.';
      return;
    }

    const request: SalesmanRequest = {
      employeeId: this.salesman.id.trim(),
      name: this.salesman.name.trim(),
      phone: this.salesman.phone.trim(),
      email: this.salesman.email.trim(),
      address: this.salesman.address.trim(),
      territory: this.salesman.territory.trim(),
      commissionRate: Number(this.salesman.commission),
      status: this.salesman.status
    };

    this.saving = true;

    const operation = this.isEditMode
      ? this.salesmanApi.update(Number(this.salesmanId), request)
      : this.salesmanApi.create(request);

    operation.subscribe({
      next: () => {
        this.saving = false;
        this.router.navigate(['/app/inventory/salesmen']);
      },
      error: (error) => {
        this.saving = false;
        this.errorMessage = error?.error?.message ||
          error?.error?.detail ||
          'Unable to save salesman. Please check the information and try again.';
      }
    });
  }

  cancel(): void {
    this.goBack();
  }

  goBack(): void {
    this.router.navigate(['/app/inventory/salesmen']);
  }
}
