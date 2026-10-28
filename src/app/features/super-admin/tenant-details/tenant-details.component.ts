import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface Tenant {
  id: string;
  name: string;
  owner: string;
  email: string;
  phone: string;

  address: string;

  plan: 'Basic' | 'Standard' | 'Premium';
  status: 'Active' | 'Pending' | 'Suspended';

  registrationDate: string;

  subscriptionStart: string;
  subscriptionEnd: string;

  branches: number;
  employees: number;

  monthlyBilling: number;
}

@Component({
  selector: 'app-tenant-details',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './tenant-details.component.html',
  styleUrl: './tenant-details.component.scss'
})
export class TenantDetailsComponent implements OnInit {

  tenant: Tenant = {
    id: 'TEN-001',
    name: 'MediCare Pharmacy',
    owner: 'Md. Rahim Uddin',
    email: 'medicare@example.com',
    phone: '+880 1712-345678',

    address: 'Dhaka, Bangladesh',

    plan: 'Premium',
    status: 'Active',

    registrationDate: '12 August 2026',

    subscriptionStart: '12 August 2026',
    subscriptionEnd: '12 August 2027',

    branches: 1,
    employees: 5,

    monthlyBilling: 4999
  };

  constructor(private router: Router) {}

  ngOnInit(): void {

    const stateTenant = history.state?.tenant as Partial<Tenant> | undefined;

    if (stateTenant) {

      this.tenant = {
        ...this.tenant,

        ...stateTenant,

        address:
          stateTenant.address ??
          'Dhaka, Bangladesh',

        subscriptionStart:
          stateTenant.subscriptionStart ??
          stateTenant.registrationDate ??
          '',

        subscriptionEnd:
          stateTenant.subscriptionEnd ??
          '12 September 2027',

        branches:
          stateTenant.branches ??
          1,

        employees:
          stateTenant.employees ??
          5,

        monthlyBilling:
          stateTenant.monthlyBilling ??
          this.getPlanPrice(stateTenant.plan)
      };
    }
  }

  // =========================
  // PLAN PRICE
  // =========================

  private getPlanPrice(
    plan?: 'Basic' | 'Standard' | 'Premium'
  ): number {

    switch (plan) {

      case 'Basic':
        return 1999;

      case 'Standard':
        return 2999;

      case 'Premium':
        return 4999;

      default:
        return 1999;
    }
  }

  // =========================
  // BACK
  // =========================

  goBack(): void {
    this.router.navigate(['/admin/tenants']);
  }

  // =========================
  // EDIT
  // =========================

  editTenant(): void {
    alert(`Edit Tenant: ${this.tenant.name}`);
  }

  // =========================
  // STATUS
  // =========================

  changeStatus(): void {

    if (this.tenant.status === 'Active') {

      this.tenant.status = 'Suspended';

    } else {

      this.tenant.status = 'Active';

    }
  }

}