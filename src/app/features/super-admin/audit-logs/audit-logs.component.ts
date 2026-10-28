import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  description: string;
  ipAddress: string;
  date: string;
  status: 'Success' | 'Warning' | 'Failed';
}

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './audit-logs.component.html',
  styleUrl: './audit-logs.component.scss'
})
export class AuditLogsComponent implements OnInit {

  logs: AuditLog[] = [];
  filteredLogs: AuditLog[] = [];

  searchText = '';
  selectedFilter = 'All';

  ngOnInit(): void {
    this.loadLogs();
    this.filteredLogs = [...this.logs];
  }

  loadLogs(): void {

    this.logs = [

      {
        id: 'AUD-1001',
        userId: 'USR-001',
        userName: 'Md. Ashikur Rahman',
        action: 'Tenant Approved',
        module: 'Tenant Management',
        description: 'Approved Care Pharmacy tenant registration.',
        ipAddress: '103.45.12.101',
        date: '2026-09-11 09:20 AM',
        status: 'Success'
      },

      {
        id: 'AUD-1002',
        userId: 'USR-002',
        userName: 'Rahim Ahmed',
        action: 'Plan Updated',
        module: 'Plan Manager',
        description: 'Updated Standard subscription plan pricing.',
        ipAddress: '103.45.12.102',
        date: '2026-09-11 08:55 AM',
        status: 'Success'
      },

      {
        id: 'AUD-1003',
        userId: 'USR-003',
        userName: 'Nusrat Jahan',
        action: 'Support Ticket Updated',
        module: 'Support',
        description: 'Updated customer support ticket status.',
        ipAddress: '103.45.12.103',
        date: '2026-09-10 05:35 PM',
        status: 'Success'
      },

      {
        id: 'AUD-1004',
        userId: 'USR-004',
        userName: 'Tanvir Hasan',
        action: 'Refund Processed',
        module: 'Billing',
        description: 'Processed refund for Green Valley Medicine.',
        ipAddress: '103.45.12.104',
        date: '2026-09-10 04:10 PM',
        status: 'Success'
      },

      {
        id: 'AUD-1005',
        userId: 'USR-005',
        userName: 'Sadia Islam',
        action: 'Login Failed',
        module: 'Authentication',
        description: 'Multiple unsuccessful login attempts detected.',
        ipAddress: '103.45.12.105',
        date: '2026-09-10 02:45 PM',
        status: 'Warning'
      },

      {
        id: 'AUD-1006',
        userId: 'USR-002',
        userName: 'Rahim Ahmed',
        action: 'Tenant Suspended',
        module: 'Tenant Management',
        description: 'Suspended Popular Pharmacy account.',
        ipAddress: '103.45.12.102',
        date: '2026-09-09 03:30 PM',
        status: 'Success'
      },

      {
        id: 'AUD-1007',
        userId: 'USR-007',
        userName: 'Fahim Khan',
        action: 'Payment Failed',
        module: 'Billing',
        description: 'Payment processing failed for subscription.',
        ipAddress: '103.45.12.107',
        date: '2026-09-09 01:15 PM',
        status: 'Failed'
      },

      {
        id: 'AUD-1008',
        userId: 'USR-001',
        userName: 'Md. Ashikur Rahman',
        action: 'User Created',
        module: 'Platform Users',
        description: 'Created a new support agent account.',
        ipAddress: '103.45.12.101',
        date: '2026-09-08 11:40 AM',
        status: 'Success'
      },

      {
        id: 'AUD-1009',
        userId: 'USR-004',
        userName: 'Tanvir Hasan',
        action: 'Billing Log Viewed',
        module: 'Billing Logs',
        description: 'Viewed platform billing activity logs.',
        ipAddress: '103.45.12.104',
        date: '2026-09-08 10:25 AM',
        status: 'Success'
      }

    ];
  }

  get totalLogs(): number {
    return this.logs.length;
  }

  get successLogs(): number {
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

  filterLogs(filter: string): void {
    this.selectedFilter = filter;
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
        log.userName.toLowerCase().includes(search) ||
        log.action.toLowerCase().includes(search) ||
        log.module.toLowerCase().includes(search) ||
        log.description.toLowerCase().includes(search) ||
        log.ipAddress.toLowerCase().includes(search)
      );

    }

    this.filteredLogs = result;
  }

  viewLog(log: AuditLog): void {

    alert(
      `Audit Log Details\n\n` +
      `Log ID: ${log.id}\n` +
      `User: ${log.userName}\n` +
      `Action: ${log.action}\n` +
      `Module: ${log.module}\n` +
      `Description: ${log.description}\n` +
      `IP Address: ${log.ipAddress}\n` +
      `Date: ${log.date}\n` +
      `Status: ${log.status}`
    );

  }

}