import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface SupportTicket {
  id: string;
  subject: string;
  tenant: string;
  requester: string;
  email: string;
  category: 'Technical' | 'Billing' | 'Account' | 'General';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './support.component.html',
  styleUrl: './support.component.scss'
})
export class SupportComponent implements OnInit {

  tickets: SupportTicket[] = [];
  filteredTickets: SupportTicket[] = [];

  searchText = '';
  selectedFilter = 'All';

  ngOnInit(): void {
    this.loadTickets();
    this.filteredTickets = [...this.tickets];
  }

  loadTickets(): void {

    this.tickets = [

      {
        id: 'TKT-1001',
        subject: 'Unable to process POS payment',
        tenant: 'Care Pharmacy',
        requester: 'Karim Ahmed',
        email: 'karim@carepharmacy.com',
        category: 'Technical',
        priority: 'Urgent',
        status: 'Open',
        assignedTo: 'Nusrat Jahan',
        createdAt: '2026-09-11 09:10 AM',
        updatedAt: '2026-09-11 09:25 AM'
      },

      {
        id: 'TKT-1002',
        subject: 'Subscription renewal issue',
        tenant: 'Health Plus Pharmacy',
        requester: 'Sabbir Hossain',
        email: 'sabbir@healthplus.com',
        category: 'Billing',
        priority: 'High',
        status: 'In Progress',
        assignedTo: 'Sadia Islam',
        createdAt: '2026-09-11 08:35 AM',
        updatedAt: '2026-09-11 09:00 AM'
      },

      {
        id: 'TKT-1003',
        subject: 'Need help adding new pharmacy branch',
        tenant: 'Medicare Pharmacy',
        requester: 'Rashed Khan',
        email: 'rashed@medicare.com',
        category: 'Account',
        priority: 'Medium',
        status: 'Open',
        assignedTo: 'Nusrat Jahan',
        createdAt: '2026-09-10 05:20 PM',
        updatedAt: '2026-09-10 05:20 PM'
      },

      {
        id: 'TKT-1004',
        subject: 'Invoice download problem',
        tenant: 'Popular Pharmacy',
        requester: 'Imran Hossain',
        email: 'imran@popularpharmacy.com',
        category: 'Billing',
        priority: 'Medium',
        status: 'Resolved',
        assignedTo: 'Tanvir Hasan',
        createdAt: '2026-09-10 03:15 PM',
        updatedAt: '2026-09-10 04:40 PM'
      },

      {
        id: 'TKT-1005',
        subject: 'Medicine inventory not updating',
        tenant: 'Green Life Pharmacy',
        requester: 'Fahad Rahman',
        email: 'fahad@greenlife.com',
        category: 'Technical',
        priority: 'High',
        status: 'In Progress',
        assignedTo: 'Rahim Ahmed',
        createdAt: '2026-09-10 11:30 AM',
        updatedAt: '2026-09-10 01:10 PM'
      },

      {
        id: 'TKT-1006',
        subject: 'Account verification question',
        tenant: 'Wellness Pharmacy',
        requester: 'Nadia Akter',
        email: 'nadia@wellness.com',
        category: 'Account',
        priority: 'Low',
        status: 'Closed',
        assignedTo: 'Sadia Islam',
        createdAt: '2026-09-09 04:20 PM',
        updatedAt: '2026-09-09 05:05 PM'
      },

      {
        id: 'TKT-1007',
        subject: 'Request for payment receipt',
        tenant: 'Modern Care Pharmacy',
        requester: 'Shakil Ahmed',
        email: 'shakil@moderncare.com',
        category: 'Billing',
        priority: 'Low',
        status: 'Resolved',
        assignedTo: 'Tanvir Hasan',
        createdAt: '2026-09-09 02:40 PM',
        updatedAt: '2026-09-09 03:15 PM'
      },

      {
        id: 'TKT-1008',
        subject: 'Dashboard showing incorrect sales data',
        tenant: 'City Medicine',
        requester: 'Mahfuz Alam',
        email: 'mahfuz@citymedicine.com',
        category: 'Technical',
        priority: 'High',
        status: 'Open',
        assignedTo: 'Rahim Ahmed',
        createdAt: '2026-09-08 12:10 PM',
        updatedAt: '2026-09-08 12:25 PM'
      },

      {
        id: 'TKT-1009',
        subject: 'General product inquiry',
        tenant: 'Green Valley Medicine',
        requester: 'Arif Hasan',
        email: 'arif@greenvalley.com',
        category: 'General',
        priority: 'Low',
        status: 'Closed',
        assignedTo: 'Nusrat Jahan',
        createdAt: '2026-09-08 10:20 AM',
        updatedAt: '2026-09-08 11:00 AM'
      }

    ];
  }

  get totalTickets(): number {
    return this.tickets.length;
  }

  get openTickets(): number {
    return this.tickets.filter(
      ticket => ticket.status === 'Open'
    ).length;
  }

  get inProgressTickets(): number {
    return this.tickets.filter(
      ticket => ticket.status === 'In Progress'
    ).length;
  }

  get resolvedTickets(): number {
    return this.tickets.filter(
      ticket =>
        ticket.status === 'Resolved' ||
        ticket.status === 'Closed'
    ).length;
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

      result = result.filter(
        ticket => ticket.status === this.selectedFilter
      );

    }

    if (this.searchText.trim()) {

      const search = this.searchText
        .toLowerCase()
        .trim();

      result = result.filter(ticket =>
        ticket.id.toLowerCase().includes(search) ||
        ticket.subject.toLowerCase().includes(search) ||
        ticket.tenant.toLowerCase().includes(search) ||
        ticket.requester.toLowerCase().includes(search) ||
        ticket.category.toLowerCase().includes(search) ||
        ticket.priority.toLowerCase().includes(search) ||
        ticket.assignedTo.toLowerCase().includes(search)
      );

    }

    this.filteredTickets = result;
  }

  viewTicket(ticket: SupportTicket): void {

    alert(
      `Support Ticket Details\n\n` +
      `Ticket: ${ticket.id}\n` +
      `Subject: ${ticket.subject}\n` +
      `Tenant: ${ticket.tenant}\n` +
      `Requester: ${ticket.requester}\n` +
      `Email: ${ticket.email}\n` +
      `Category: ${ticket.category}\n` +
      `Priority: ${ticket.priority}\n` +
      `Status: ${ticket.status}\n` +
      `Assigned To: ${ticket.assignedTo}`
    );

  }

  changeStatus(ticket: SupportTicket): void {

    if (ticket.status === 'Open') {
      ticket.status = 'In Progress';
    } else if (ticket.status === 'In Progress') {
      ticket.status = 'Resolved';
    } else if (ticket.status === 'Resolved') {
      ticket.status = 'Closed';
    } else {
      ticket.status = 'Open';
    }

    ticket.updatedAt = new Date().toLocaleString();

    this.applyFilters();
  }

}