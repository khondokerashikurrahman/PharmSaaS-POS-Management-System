import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

interface SupportTicket {
  id: number;
  ticketNumber: string;
  tenantId: number | null;
  tenantName: string | null;
  requesterName: string;
  requesterEmail: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  assignedToId: number | null;
  assignedTo: string | null;
  createdById: number | null;
  createdAt: string;
  updatedAt: string;
}

interface TicketPayload {
  tenantId: number | null;
  requesterName: string;
  requesterEmail: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  assignedToId: number | null;
}

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './support.component.html',
  styleUrl: './support.component.scss'
})
export class SupportComponent implements OnInit {
  tickets: SupportTicket[] = [];
  filteredTickets: SupportTicket[] = [];
  searchText = '';
  selectedFilter = 'All';
  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';
  showCreateForm = false;
  selectedTicket: SupportTicket | null = null;

  form: TicketPayload = this.emptyForm();

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadTickets();
  }

  private emptyForm(): TicketPayload {
    return {
      tenantId: null,
      requesterName: '',
      requesterEmail: '',
      subject: '',
      description: '',
      category: 'Technical',
      priority: 'Medium',
      assignedToId: null
    };
  }

  loadTickets(): void {
    this.loading = true;
    this.errorMessage = '';

    this.api.get<SupportTicket[]>('/super-admin/support-tickets').subscribe({
      next: (items) => {
        this.tickets = items || [];
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Support ticket loading failed', error);
        this.errorMessage = error?.error?.message || 'Support tickets could not be loaded.';
        this.tickets = [];
        this.filteredTickets = [];
        this.loading = false;
      }
    });
  }

  get totalTickets(): number {
    return this.tickets.length;
  }

  get openTickets(): number {
    return this.tickets.filter(t => t.status === 'Open').length;
  }

  get inProgressTickets(): number {
    return this.tickets.filter(t => t.status === 'In Progress').length;
  }

  get resolvedTickets(): number {
    return this.tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length;
  }

  filterTickets(filter: string): void {
    this.selectedFilter = filter;
    this.applyFilters();
  }

  searchTickets(): void {
    this.applyFilters();
  }

  private applyFilters(): void {
    let result = [...this.tickets];

    if (this.selectedFilter !== 'All') {
      result = result.filter(ticket => ticket.status === this.selectedFilter);
    }

    const search = this.searchText.trim().toLowerCase();
    if (search) {
      result = result.filter(ticket =>
        ticket.ticketNumber.toLowerCase().includes(search) ||
        (ticket.tenantName || '').toLowerCase().includes(search) ||
        ticket.requesterName.toLowerCase().includes(search) ||
        ticket.requesterEmail.toLowerCase().includes(search) ||
        ticket.subject.toLowerCase().includes(search) ||
        ticket.category.toLowerCase().includes(search) ||
        ticket.priority.toLowerCase().includes(search) ||
        (ticket.assignedTo || '').toLowerCase().includes(search)
      );
    }

    this.filteredTickets = result;
  }

  openCreateForm(): void {
    this.form = this.emptyForm();
    this.selectedTicket = null;
    this.successMessage = '';
    this.errorMessage = '';
    this.showCreateForm = true;
  }

  closeCreateForm(): void {
    this.showCreateForm = false;
  }

  createTicket(): void {
    if (this.saving) return;

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload: TicketPayload = {
      ...this.form,
      tenantId: this.form.tenantId || null,
      assignedToId: this.form.assignedToId || null
    };

    this.api.post<SupportTicket>('/super-admin/support-tickets', payload).subscribe({
      next: (created) => {
        this.tickets = [created, ...this.tickets];
        this.applyFilters();
        this.showCreateForm = false;
        this.form = this.emptyForm();
        this.successMessage = `Ticket ${created.ticketNumber} created successfully.`;
        this.saving = false;
      },
      error: (error) => {
        console.error('Ticket creation failed', error);
        this.errorMessage = error?.error?.message || 'Ticket could not be created.';
        this.saving = false;
      }
    });
  }

  viewTicket(ticket: SupportTicket): void {
    this.selectedTicket = ticket;
    this.showCreateForm = false;
  }

  closeDetails(): void {
    this.selectedTicket = null;
  }

  changeStatus(ticket: SupportTicket): void {
    const nextStatus: Record<string, string> = {
      'Open': 'In Progress',
      'In Progress': 'Resolved',
      'Resolved': 'Closed'
    };

    const status = nextStatus[ticket.status];
    if (!status) {
      this.errorMessage = 'Closed tickets cannot be advanced to another status.';
      return;
    }

    this.api.patch<SupportTicket>(
      `/super-admin/support-tickets/${ticket.id}/status`,
      { status }
    ).subscribe({
      next: (updated) => {
        this.replaceTicket(updated);
        this.successMessage = `${updated.ticketNumber} updated to ${updated.status}.`;
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Ticket status update failed.';
      }
    });
  }

  assignTicket(ticket: SupportTicket, assignedToId: number | null): void {
    this.api.patch<SupportTicket>(
      `/super-admin/support-tickets/${ticket.id}/assignment`,
      { assignedToId }
    ).subscribe({
      next: (updated) => {
        this.replaceTicket(updated);
        this.successMessage = `Assignment updated for ${updated.ticketNumber}.`;
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Ticket assignment failed.';
      }
    });
  }

  private replaceTicket(updated: SupportTicket): void {
    this.tickets = this.tickets.map(t => t.id === updated.id ? updated : t);
    if (this.selectedTicket?.id === updated.id) {
      this.selectedTicket = updated;
    }
    this.applyFilters();
  }

  trackById(index: number, ticket: SupportTicket): number {
    return ticket.id;
  }
}
