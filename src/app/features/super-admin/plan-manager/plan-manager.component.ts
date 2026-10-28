import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Plan {
  id: number;
  name: string;
  price: number;
  yearlyPrice: number;
  description: string;
  tenants: number;
  status: 'Active' | 'Inactive';
  popular: boolean;
  features: string[];
}

@Component({
  selector: 'app-plan-manager',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './plan-manager.component.html',
  styleUrl: './plan-manager.component.scss'
})
export class PlanManagerComponent {

  billingCycle: 'Monthly' | 'Yearly' = 'Monthly';

  showAddModal = false;
  showEditModal = false;

  selectedPlan: Plan | null = null;

  plans: Plan[] = [
    {
      id: 1,
      name: 'Basic',
      price: 499,
      yearlyPrice: 4990,
      description: 'Essential tools for small pharmacies.',
      tenants: 24,
      status: 'Active',
      popular: false,
      features: [
        '1 Pharmacy Branch',
        '2 Staff Accounts',
        'POS & Sales',
        'Inventory Management',
        'Basic Reports'
      ]
    },
    {
      id: 2,
      name: 'Standard',
      price: 999,
      yearlyPrice: 9990,
      description: 'Complete solution for growing pharmacies.',
      tenants: 38,
      status: 'Active',
      popular: true,
      features: [
        '3 Pharmacy Branches',
        '10 Staff Accounts',
        'POS & Sales',
        'Inventory & Batch Tracking',
        'Purchase & Procurement',
        'Advanced Reports',
        'Customer & Supplier Ledger'
      ]
    },
    {
      id: 3,
      name: 'Premium',
      price: 1999,
      yearlyPrice: 19990,
      description: 'Advanced features for large pharmacy businesses.',
      tenants: 17,
      status: 'Active',
      popular: false,
      features: [
        'Unlimited Branches',
        'Unlimited Staff Accounts',
        'Advanced POS',
        'Inventory & FEFO',
        'Procurement & Stock Transfer',
        'Advanced Analytics',
        'Customer & Supplier Ledger',
        'Priority Support'
      ]
    }
  ];

  newPlan: Plan = this.createEmptyPlan();

  get totalPlans(): number {
    return this.plans.length;
  }

  get activePlans(): number {
    return this.plans.filter(plan => plan.status === 'Active').length;
  }

  get totalTenants(): number {
    return this.plans.reduce((total, plan) => total + plan.tenants, 0);
  }

  get monthlyRevenue(): number {
    return this.plans.reduce(
      (total, plan) => total + (plan.price * plan.tenants),
      0
    );
  }

  openAddModal(): void {
    this.newPlan = this.createEmptyPlan();
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  addPlan(): void {
    if (!this.newPlan.name.trim() || this.newPlan.price <= 0) {
      alert('Please enter a valid plan name and price.');
      return;
    }

    const plan: Plan = {
      ...this.newPlan,
      id: this.plans.length + 1,
      yearlyPrice: this.newPlan.price * 10,
      tenants: 0,
      status: 'Active',
      popular: false,
      features: this.newPlan.features
        .filter(feature => feature.trim() !== '')
    };

    this.plans.push(plan);
    this.showAddModal = false;

    alert('Plan added successfully.');
  }

  editPlan(plan: Plan): void {
    this.selectedPlan = {
      ...plan,
      features: [...plan.features]
    };

    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedPlan = null;
  }

  updatePlan(): void {
    if (!this.selectedPlan) {
      return;
    }

    const index = this.plans.findIndex(
      plan => plan.id === this.selectedPlan?.id
    );

    if (index !== -1) {
      this.plans[index] = {
        ...this.selectedPlan,
        yearlyPrice: this.selectedPlan.price * 10
      };
    }

    this.showEditModal = false;
    this.selectedPlan = null;

    alert('Plan updated successfully.');
  }

  togglePlanStatus(plan: Plan): void {
    plan.status = plan.status === 'Active'
      ? 'Inactive'
      : 'Active';
  }

  deletePlan(plan: Plan): void {
    const confirmed = confirm(
      `Are you sure you want to delete the ${plan.name} plan?`
    );

    if (!confirmed) {
      return;
    }

    this.plans = this.plans.filter(
      item => item.id !== plan.id
    );
  }

  setBillingCycle(cycle: 'Monthly' | 'Yearly'): void {
    this.billingCycle = cycle;
  }

  getPrice(plan: Plan): number {
    return this.billingCycle === 'Monthly'
      ? plan.price
      : plan.yearlyPrice;
  }

  private createEmptyPlan(): Plan {
    return {
      id: 0,
      name: '',
      price: 0,
      yearlyPrice: 0,
      description: '',
      tenants: 0,
      status: 'Active',
      popular: false,
      features: []
    };
  }

}