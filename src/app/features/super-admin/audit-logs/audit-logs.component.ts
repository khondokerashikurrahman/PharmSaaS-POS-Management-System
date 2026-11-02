import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

interface BackendAuditLog {
  id: number;
  actorId: number | null;
  actorName: string;
  action: string;
  module: string;
  targetType: string | null;
  targetId: string | null;
  description: string;
  ipAddress: string | null;
  status: string;
  createdAt: string;
}

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  description: string;
  ipAddress: string;
  date: string;
  status: string;
}

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './audit-logs.component.html',
  styleUrl: './audit-logs.component.scss'
})
export class AuditLogsComponent implements OnInit {
  logs: AuditLog[] = [];
  filteredLogs: AuditLog[] = [];
  searchText = '';
  selectedFilter = 'All';
  loading = false;
  errorMessage = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading = true;
    this.errorMessage = '';

    this.api.get<BackendAuditLog[]>('/super-admin/audit-logs').subscribe({
      next: (items) => {
        this.logs = (items || []).map(item => ({
          id: `AUD-${item.id}`,
          userId: item.actorId !== null ? `USR-${item.actorId}` : 'Unknown',
          userName: item.actorName || 'Unknown User',
          action: item.action,
          module: item.module,
          description: item.description,
          ipAddress: item.ipAddress || 'Not captured',
          date: item.createdAt || '',
          status: item.status || 'Unknown'
        }));
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load audit logs', error);
        this.errorMessage = error?.error?.message || 'Audit logs could not be loaded from the server.';
        this.logs = [];
        this.filteredLogs = [];
        this.loading = false;
      }
    });
  }

  get totalLogs(): number {
    return this.logs.length;
  }

  get successLogs(): number {
    return this.logs.filter(log => log.status.toLowerCase() === 'success').length;
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
      result = result.filter(log => log.status.toLowerCase() === this.selectedFilter.toLowerCase());
    }

    const search = this.searchText.trim().toLowerCase();
    if (search) {
      result = result.filter(log =>
        log.id.toLowerCase().includes(search) ||
        log.userId.toLowerCase().includes(search) ||
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
      `User ID: ${log.userId}\n` +
      `Action: ${log.action}\n` +
      `Module: ${log.module}\n` +
      `Description: ${log.description}\n` +
      `IP Address: ${log.ipAddress}\n` +
      `Date: ${log.date}\n` +
      `Status: ${log.status}`
    );
  }

  exportLogs(): void {
    if (!this.filteredLogs.length) return;

    const columns = ['Log ID', 'User ID', 'User', 'Action', 'Module', 'Description', 'IP Address', 'Date', 'Status'];
    const rows = this.filteredLogs.map(log => [
      log.id, log.userId, log.userName, log.action, log.module,
      log.description, log.ipAddress, log.date, log.status
    ]);

    const escapeCsv = (value: string) => '"' + String(value ?? '').replace(/"/g, '""') + '"';
    const csv = [columns, ...rows].map(row => row.map(escapeCsv).join(',')).join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'pharmsaas-audit-logs.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
