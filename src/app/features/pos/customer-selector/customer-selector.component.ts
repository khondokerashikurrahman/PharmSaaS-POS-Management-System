import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Customer } from '../../../core/models/customer.model';

@Component({
  selector: 'app-customer-selector',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './customer-selector.component.html',
  styleUrl: './customer-selector.component.scss'
})
export class CustomerSelectorComponent {

  @Input()
  selectedCustomerName = 'Walk-in Customer';

  @Output()
  customerSelected = new EventEmitter<Customer>();

  @Output()
  customerNameChanged = new EventEmitter<string>();

  searchTerm = '';

  customers: Customer[] = [
    {
      id: 'CUS-001',
      name: 'Walk-in Customer',
      phone: 'N/A',
      customerType: 'Regular',
      isActive: true,
      createdAt: new Date()
    },
    {
      id: 'CUS-002',
      name: 'Rahim Ahmed',
      phone: '01711111111',
      email: 'rahim@example.com',
      address: 'Dhaka',
      customerType: 'Regular',
      creditLimit: 5000,
      outstandingBalance: 500,
      isActive: true,
      createdAt: new Date()
    },
    {
      id: 'CUS-003',
      name: 'Shakil Khan',
      phone: '01822222222',
      email: 'shakil@example.com',
      address: 'Mirpur, Dhaka',
      customerType: 'Wholesale',
      creditLimit: 20000,
      outstandingBalance: 2500,
      isActive: true,
      createdAt: new Date()
    },
    {
      id: 'CUS-004',
      name: 'Mahmud Hasan',
      phone: '01933333333',
      address: 'Uttara, Dhaka',
      customerType: 'Corporate',
      creditLimit: 30000,
      outstandingBalance: 0,
      isActive: true,
      createdAt: new Date()
    }
  ];

  showCustomerList = false;

  get filteredCustomers(): Customer[] {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      return this.customers;
    }

    return this.customers.filter(customer =>
      customer.name.toLowerCase().includes(term) ||
      customer.phone.toLowerCase().includes(term)
    );
  }

  selectCustomer(customer: Customer): void {
    this.selectedCustomerName = customer.name;

    this.customerSelected.emit(customer);

    this.customerNameChanged.emit(customer.name);

    this.showCustomerList = false;

    this.searchTerm = '';
  }

  openCustomerList(): void {
    this.showCustomerList = !this.showCustomerList;
  }

  closeCustomerList(): void {
    this.showCustomerList = false;
  }

  clearSearch(): void {
    this.searchTerm = '';
  }
}