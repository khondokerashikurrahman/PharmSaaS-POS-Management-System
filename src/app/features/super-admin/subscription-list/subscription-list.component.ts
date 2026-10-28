import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Subscription {
  id: string;
  tenantId: string;
  pharmacyName: string;
  owner: string;
  plan: 'Basic' | 'Standard' | 'Premium';
  billingCycle: 'Monthly' | 'Yearly';
  amount: number;
  startDate: string;
  nextBillingDate: string;
  status: 'Active' | 'Trial' | 'Expired' | 'Cancelled';
}

@Component({
  selector: 'app-subscription-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './subscription-list.component.html',
  styleUrl: './subscription-list.component.scss'
})
export class SubscriptionListComponent implements OnInit {

  subscriptions: Subscription[] = [];

  filteredSubscriptions: Subscription[] = [];

  selectedFilter: string = 'All';

  searchText: string = '';

  ngOnInit(): void {
    this.loadSubscriptions();
    this.filteredSubscriptions = [...this.subscriptions];
  }

  loadSubscriptions(): void {

    this.subscriptions = [

      {
        id: 'SUB-001',
        tenantId: 'TEN-001',
        pharmacyName: 'Care Pharmacy',
        owner: 'Md. Rahim',
        plan: 'Premium',
        billingCycle: 'Monthly',
        amount: 4999,
        startDate: '2026-01-10',
        nextBillingDate: '2026-10-10',
        status: 'Active'
      },

      {
        id: 'SUB-002',
        tenantId: 'TEN-002',
        pharmacyName: 'Health Plus Pharmacy',
        owner: 'Abdul Karim',
        plan: 'Standard',
        billingCycle: 'Monthly',
        amount: 2999,
        startDate: '2026-02-15',
        nextBillingDate: '2026-10-15',
        status: 'Active'
      },

      {
        id: 'SUB-003',
        tenantId: 'TEN-003',
        pharmacyName: 'City Medicine',
        owner: 'Sakib Hasan',
        plan: 'Basic',
        billingCycle: 'Monthly',
        amount: 1999,
        startDate: '2026-09-01',
        nextBillingDate: '2026-10-01',
        status: 'Trial'
      },

      {
        id: 'SUB-004',
        tenantId: 'TEN-004',
        pharmacyName: 'Medicare Pharmacy',
        owner: 'Mohammad Ali',
        plan: 'Premium',
        billingCycle: 'Yearly',
        amount: 49990,
        startDate: '2026-03-20',
        nextBillingDate: '2027-03-20',
        status: 'Active'
      },

      {
        id: 'SUB-005',
        tenantId: 'TEN-005',
        pharmacyName: 'Popular Pharmacy',
        owner: 'Tanvir Ahmed',
        plan: 'Standard',
        billingCycle: 'Monthly',
        amount: 2999,
        startDate: '2026-04-12',
        nextBillingDate: '2026-10-12',
        status: 'Cancelled'
      },

      {
        id: 'SUB-006',
        tenantId: 'TEN-006',
        pharmacyName: 'Green Life Pharmacy',
        owner: 'Hasan Mahmud',
        plan: 'Basic',
        billingCycle: 'Monthly',
        amount: 1999,
        startDate: '2026-05-05',
        nextBillingDate: '2026-10-05',
        status: 'Active'
      },

      {
        id: 'SUB-007',
        tenantId: 'TEN-007',
        pharmacyName: 'Wellness Pharmacy',
        owner: 'Imran Hossain',
        plan: 'Standard',
        billingCycle: 'Monthly',
        amount: 2999,
        startDate: '2026-08-10',
        nextBillingDate: '2026-10-10',
        status: 'Trial'
      },

      {
        id: 'SUB-008',
        tenantId: 'TEN-008',
        pharmacyName: 'Modern Care Pharmacy',
        owner: 'Nayeem Islam',
        plan: 'Premium',
        billingCycle: 'Monthly',
        amount: 4999,
        startDate: '2026-06-18',
        nextBillingDate: '2026-10-18',
        status: 'Active'
      }

    ];
  }

  get totalSubscriptions(): number {
    return this.subscriptions.length;
  }

  get activeSubscriptions(): number {
    return this.subscriptions.filter(
      subscription => subscription.status === 'Active'
    ).length;
  }

  get trialSubscriptions(): number {
    return this.subscriptions.filter(
      subscription => subscription.status === 'Trial'
    ).length;
  }

  get cancelledSubscriptions(): number {
    return this.subscriptions.filter(
      subscription => subscription.status === 'Cancelled'
    ).length;
  }

  get monthlyRecurringRevenue(): number {
    return this.subscriptions
      .filter(subscription => subscription.status === 'Active')
      .reduce((total, subscription) => {

        if (subscription.billingCycle === 'Yearly') {
          return total + (subscription.amount / 12);
        }

        return total + subscription.amount;

      }, 0);
  }

  filterSubscriptions(status: string): void {

    this.selectedFilter = status;

    this.applyFilters();
  }

  searchSubscriptions(): void {

    this.applyFilters();
  }

  private applyFilters(): void {

    let result = [...this.subscriptions];

    if (this.selectedFilter !== 'All') {

      result = result.filter(
        subscription =>
          subscription.status === this.selectedFilter
      );
    }

    if (this.searchText.trim()) {

      const search = this.searchText
        .toLowerCase()
        .trim();

      result = result.filter(subscription =>
        subscription.pharmacyName.toLowerCase().includes(search) ||
        subscription.owner.toLowerCase().includes(search) ||
        subscription.id.toLowerCase().includes(search) ||
        subscription.tenantId.toLowerCase().includes(search) ||
        subscription.plan.toLowerCase().includes(search)
      );
    }

    this.filteredSubscriptions = result;
  }

  viewSubscription(subscription: Subscription): void {

    alert(
      `Subscription: ${subscription.id}\n` +
      `Pharmacy: ${subscription.pharmacyName}\n` +
      `Plan: ${subscription.plan}\n` +
      `Status: ${subscription.status}`
    );
  }

  cancelSubscription(subscription: Subscription): void {

    const confirmed = confirm(
      `Are you sure you want to cancel the subscription for ${subscription.pharmacyName}?`
    );

    if (!confirmed) {
      return;
    }

    subscription.status = 'Cancelled';

    this.applyFilters();
  }

  activateSubscription(subscription: Subscription): void {

    subscription.status = 'Active';

    this.applyFilters();
  }

}