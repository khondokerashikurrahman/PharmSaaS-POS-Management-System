import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface BillingLog {
  id: string;
  tenantId: string;
  pharmacyName: string;
  action: string;
  description: string;
  amount: number;
  performedBy: string;
  date: string;
  status: 'Success' | 'Warning' | 'Failed' | 'Info';
}

@Component({
  selector: 'app-billing-logs',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './billing-logs.component.html',
  styleUrl: './billing-logs.component.scss'
})
export class BillingLogsComponent implements OnInit {

  logs: BillingLog[] = [];

  filteredLogs: BillingLog[] = [];

  selectedFilter: string = 'All';

  searchText: string = '';

  ngOnInit(): void {
    this.loadLogs();
    this.filteredLogs = [...this.logs];
  }

  loadLogs(): void {

    this.logs = [

      {
        id: 'LOG-1001',
        tenantId: 'TEN-001',
        pharmacyName: 'Care Pharmacy',
        action: 'Payment Received',
        description: 'Monthly Premium subscription payment received.',
        amount: 4999,
        performedBy: 'System',
        date: '2026-09-10 10:25 AM',
        status: 'Success'
      },

      {
        id: 'LOG-1002',
        tenantId: 'TEN-002',
        pharmacyName: 'Health Plus Pharmacy',
        action: 'Subscription Renewed',
        description: 'Standard plan subscription renewed successfully.',
        amount: 2999,
        performedBy: 'System',
        date: '2026-09-09 09:40 AM',
        status: 'Success'
      },

      {
        id: 'LOG-1003',
        tenantId: 'TEN-003',
        pharmacyName: 'City Medicine',
        action: 'Trial Started',
        description: 'New tenant trial subscription started.',
        amount: 0,
        performedBy: 'Admin',
        date: '2026-09-08 02:15 PM',
        status: 'Info'
      },

      {
        id: 'LOG-1004',
        tenantId: 'TEN-004',
        pharmacyName: 'Medicare Pharmacy',
        action: 'Payment Received',
        description: 'Annual Premium subscription payment received.',
        amount: 49990,
        performedBy: 'System',
        date: '2026-09-07 11:30 AM',
        status: 'Success'
      },

      {
        id: 'LOG-1005',
        tenantId: 'TEN-005',
        pharmacyName: 'Popular Pharmacy',
        action: 'Payment Failed',
        description: 'Card payment failed during subscription renewal.',
        amount: 2999,
        performedBy: 'Payment Gateway',
        date: '2026-09-06 04:45 PM',
        status: 'Failed'
      },

      {
        id: 'LOG-1006',
        tenantId: 'TEN-006',
        pharmacyName: 'Green Life Pharmacy',
        action: 'Payment Received',
        description: 'Basic plan monthly payment received.',
        amount: 1999,
        performedBy: 'System',
        date: '2026-09-05 10:10 AM',
        status: 'Success'
      },

      {
        id: 'LOG-1007',
        tenantId: 'TEN-007',
        pharmacyName: 'Wellness Pharmacy',
        action: 'Payment Pending',
        description: 'Payment is waiting for confirmation.',
        amount: 2999,
        performedBy: 'Payment Gateway',
        date: '2026-09-04 01:20 PM',
        status: 'Warning'
      },

      {
        id: 'LOG-1008',
        tenantId: 'TEN-008',
        pharmacyName: 'Modern Care Pharmacy',
        action: 'Subscription Upgraded',
        description: 'Subscription upgraded from Standard to Premium.',
        amount: 4999,
        performedBy: 'Admin',
        date: '2026-09-03 03:35 PM',
        status: 'Success'
      },

      {
        id: 'LOG-1009',
        tenantId: 'TEN-009',
        pharmacyName: 'Green Valley Medicine',
        action: 'Payment Refunded',
        description: 'Subscription payment refunded to tenant.',
        amount: 1999,
        performedBy: 'Admin',
        date: '2026-09-02 12:05 PM',
        status: 'Warning'
      }

    ];
  }

  get totalLogs(): number {
    return this.logs.length;
  }

  get successfulLogs(): number {
    return this.logs.filter(
      log => log.status === 'Success'
    ).length;
  }

  get warningLogs(): number {
    return this.logs.filter(
      log => log.status === 'Warning'
    ).length;
  }

  get failedLogs(): number {
    return this.logs.filter(
      log => log.status === 'Failed'
    ).length;
  }

  filterLogs(status: string): void {

    this.selectedFilter = status;

    this.applyFilters();
  }

  searchLogs(): void {

    this.applyFilters();
  }

  private applyFilters(): void {

    let result = [...this.logs];

    if (this.selectedFilter !== 'All') {

      result = result.filter(
        log => log.status === this.selectedFilter
      );
    }

    if (this.searchText.trim()) {

      const search = this.searchText
        .toLowerCase()
        .trim();

      result = result.filter(log =>
        log.id.toLowerCase().includes(search) ||
        log.tenantId.toLowerCase().includes(search) ||
        log.pharmacyName.toLowerCase().includes(search) ||
        log.action.toLowerCase().includes(search) ||
        log.description.toLowerCase().includes(search) ||
        log.performedBy.toLowerCase().includes(search)
      );
    }

    this.filteredLogs = result;
  }

  viewLog(log: BillingLog): void {

    alert(
      `Billing Log Details\n\n` +
      `Log ID: ${log.id}\n` +
      `Pharmacy: ${log.pharmacyName}\n` +
      `Action: ${log.action}\n` +
      `Description: ${log.description}\n` +
      `Amount: ৳${log.amount}\n` +
      `Performed By: ${log.performedBy}\n` +
      `Date: ${log.date}\n` +
      `Status: ${log.status}`
    );
  }

}