import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

interface Plan {
  id: number;
  code: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  durationDays: number;
  active: boolean;
  activeTenants: number;
  maxBranches: number | null;
  maxTeamMembers: number | null;
  maxInventoryItems: number | null;
  maxInventoryBatches: number | null;
}

interface PlanRequest {
  code: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  durationDays: number;
  maxBranches: number | null;
  maxTeamMembers: number | null;
  maxInventoryItems: number | null;
  maxInventoryBatches: number | null;
}

@Component({
  selector: 'app-plan-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './plan-manager.component.html',
  styleUrl: './plan-manager.component.scss'
})
export class PlanManagerComponent implements OnInit {
  plans: Plan[] = [];
  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';

  showAddModal = false;
  showEditModal = false;
  selectedPlan: Plan | null = null;

  newPlan: PlanRequest = this.emptyPlan();

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadPlans();
  }

  loadPlans(): void {
    this.loading = true;
    this.errorMessage = '';

    this.api.get<Plan[]>('/super-admin/subscription-plans').subscribe({
      next: response => {
        this.plans = (response || []).map(plan => ({
          ...plan,
          price: Number(plan.price || 0),
          activeTenants: Number(plan.activeTenants || 0)
        }));
        this.loading = false;
      },
      error: error => {
        this.loading = false;
        this.errorMessage = error?.error?.message ||
          'Unable to load subscription plans.';
      }
    });
  }

  get totalPlans(): number {
    return this.plans.length;
  }

  get activePlans(): number {
    return this.plans.filter(plan => plan.active).length;
  }

  get totalTenants(): number {
    return this.plans.reduce((sum, plan) => sum + plan.activeTenants, 0);
  }

  openAddModal(): void {
    this.newPlan = this.emptyPlan();
    this.errorMessage = '';
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  addPlan(): void {
    if (!this.validate(this.newPlan)) return;

    this.saving = true;
    this.api.post<Plan>('/super-admin/subscription-plans', this.payload(this.newPlan))
      .subscribe({
        next: () => {
          this.saving = false;
          this.showAddModal = false;
          this.successMessage = 'Subscription plan created successfully.';
          this.loadPlans();
        },
        error: error => {
          this.saving = false;
          this.errorMessage = error?.error?.message || 'Unable to create plan.';
        }
      });
  }

  editPlan(plan: Plan): void {
    this.selectedPlan = { ...plan };
    this.errorMessage = '';
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedPlan = null;
  }

  updatePlan(): void {
    if (!this.selectedPlan || !this.validate(this.selectedPlan)) return;

    const plan = this.selectedPlan;
    this.saving = true;

    this.api.put<Plan>(
      `/super-admin/subscription-plans/${plan.id}`,
      this.payload(plan)
    ).subscribe({
      next: () => {
        this.saving = false;
        this.showEditModal = false;
        this.selectedPlan = null;
        this.successMessage = 'Subscription plan updated successfully.';
        this.loadPlans();
      },
      error: error => {
        this.saving = false;
        this.errorMessage = error?.error?.message || 'Unable to update plan.';
      }
    });
  }

  togglePlanStatus(plan: Plan): void {
    const nextStatus = !plan.active;
    const action = nextStatus ? 'activate' : 'deactivate';

    if (!confirm(`Are you sure you want to ${action} ${plan.name}?`)) return;

    this.api.patch<Plan>(
      `/super-admin/subscription-plans/${plan.id}/active`,
      { active: nextStatus }
    ).subscribe({
      next: () => {
        this.successMessage = `Plan ${action}d successfully.`;
        this.loadPlans();
      },
      error: error => {
        this.errorMessage = error?.error?.message ||
          `Unable to ${action} plan.`;
      }
    });
  }

  private validate(plan: PlanRequest | Plan): boolean {
    if (!plan.code?.trim() || !/^[A-Za-z0-9_-]{2,30}$/.test(plan.code.trim())) {
      this.errorMessage = 'Plan code is required (2–30 letters, numbers, _ or -).';
      return false;
    }
    if (!plan.name?.trim()) {
      this.errorMessage = 'Plan name is required.';
      return false;
    }
    if (!Number.isFinite(Number(plan.price)) || Number(plan.price) < 0) {
      this.errorMessage = 'Enter a valid non-negative price.';
      return false;
    }
    if (!plan.currency?.trim() || !/^[A-Za-z]{3}$/.test(plan.currency.trim())) {
      this.errorMessage = 'Currency must be a 3-letter code, such as BDT.';
      return false;
    }
    if (!Number.isInteger(Number(plan.durationDays)) || Number(plan.durationDays) <= 0) {
      this.errorMessage = 'Duration must be a positive number of days.';
      return false;
    }
    for (const key of ['maxBranches', 'maxTeamMembers', 'maxInventoryItems', 'maxInventoryBatches'] as const) {
      const value = plan[key];
      if (value !== null && (!Number.isInteger(Number(value)) || Number(value) < -1)) {
        this.errorMessage = 'Quota must be blank (not configured), -1 (unlimited), or a non-negative whole number.';
        return false;
      }
    }
    this.errorMessage = '';
    return true;
  }

  private payload(plan: PlanRequest | Plan): PlanRequest {
    return {
      code: plan.code.trim().toUpperCase(),
      name: plan.name.trim(),
      description: plan.description || '',
      price: Number(plan.price),
      currency: plan.currency.trim().toUpperCase(),
      durationDays: Number(plan.durationDays),
      maxBranches: this.quotaValue(plan.maxBranches),
      maxTeamMembers: this.quotaValue(plan.maxTeamMembers),
      maxInventoryItems: this.quotaValue(plan.maxInventoryItems),
      maxInventoryBatches: this.quotaValue(plan.maxInventoryBatches)
    };
  }

  private quotaValue(value: number | null): number | null {
    return value === null || value === undefined || value === ('' as any) ? null : Number(value);
  }

  private emptyPlan(): PlanRequest {
    return {
      code: '',
      name: '',
      description: '',
      price: 0,
      currency: 'BDT',
      durationDays: 30,
      maxBranches: null, maxTeamMembers: null, maxInventoryItems: null, maxInventoryBatches: null
    };
  }
}
