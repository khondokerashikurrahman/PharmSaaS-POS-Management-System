import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface BillingTransaction {
  id: string;
  tenantId: string;
  pharmacyName: string;
  plan: 'Basic' | 'Standard' | 'Premium';
  amount: number;
  paymentMethod: 'Card' | 'bKash' | 'Nagad' | 'Bank Transfer';
  transactionDate: string;
  invoiceNumber: string;
  status: 'Paid' | 'Pending' | 'Failed' | 'Refunded';
}

@Component({
  selector: 'app-billing-transactions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './billing-transactions.component.html',
  styleUrl: './billing-transactions.component.scss'
})
export class BillingTransactionsComponent implements OnInit {

  transactions: BillingTransaction[] = [];

  filteredTransactions: BillingTransaction[] = [];

  selectedFilter: string = 'All';

  searchText: string = '';

  ngOnInit(): void {
    this.loadTransactions();
    this.filteredTransactions = [...this.transactions];
  }

  loadTransactions(): void {

    this.transactions = [

      {
        id: 'TXN-1001',
        tenantId: 'TEN-001',
        pharmacyName: 'Care Pharmacy',
        plan: 'Premium',
        amount: 4999,
        paymentMethod: 'bKash',
        transactionDate: '2026-09-10',
        invoiceNumber: 'INV-2026-1001',
        status: 'Paid'
      },

      {
        id: 'TXN-1002',
        tenantId: 'TEN-002',
        pharmacyName: 'Health Plus Pharmacy',
        plan: 'Standard',
        amount: 2999,
        paymentMethod: 'Card',
        transactionDate: '2026-09-09',
        invoiceNumber: 'INV-2026-1002',
        status: 'Paid'
      },

      {
        id: 'TXN-1003',
        tenantId: 'TEN-003',
        pharmacyName: 'City Medicine',
        plan: 'Basic',
        amount: 1999,
        paymentMethod: 'Nagad',
        transactionDate: '2026-09-08',
        invoiceNumber: 'INV-2026-1003',
        status: 'Pending'
      },

      {
        id: 'TXN-1004',
        tenantId: 'TEN-004',
        pharmacyName: 'Medicare Pharmacy',
        plan: 'Premium',
        amount: 4999,
        paymentMethod: 'Bank Transfer',
        transactionDate: '2026-09-07',
        invoiceNumber: 'INV-2026-1004',
        status: 'Paid'
      },

      {
        id: 'TXN-1005',
        tenantId: 'TEN-005',
        pharmacyName: 'Popular Pharmacy',
        plan: 'Standard',
        amount: 2999,
        paymentMethod: 'Card',
        transactionDate: '2026-09-06',
        invoiceNumber: 'INV-2026-1005',
        status: 'Failed'
      },

      {
        id: 'TXN-1006',
        tenantId: 'TEN-006',
        pharmacyName: 'Green Life Pharmacy',
        plan: 'Basic',
        amount: 1999,
        paymentMethod: 'bKash',
        transactionDate: '2026-09-05',
        invoiceNumber: 'INV-2026-1006',
        status: 'Paid'
      },

      {
        id: 'TXN-1007',
        tenantId: 'TEN-007',
        pharmacyName: 'Wellness Pharmacy',
        plan: 'Standard',
        amount: 2999,
        paymentMethod: 'Nagad',
        transactionDate: '2026-09-04',
        invoiceNumber: 'INV-2026-1007',
        status: 'Pending'
      },

      {
        id: 'TXN-1008',
        tenantId: 'TEN-008',
        pharmacyName: 'Modern Care Pharmacy',
        plan: 'Premium',
        amount: 4999,
        paymentMethod: 'Card',
        transactionDate: '2026-09-03',
        invoiceNumber: 'INV-2026-1008',
        status: 'Paid'
      },

      {
        id: 'TXN-1009',
        tenantId: 'TEN-009',
        pharmacyName: 'Green Valley Medicine',
        plan: 'Basic',
        amount: 1999,
        paymentMethod: 'bKash',
        transactionDate: '2026-09-02',
        invoiceNumber: 'INV-2026-1009',
        status: 'Refunded'
      }

    ];
  }

  get totalTransactions(): number {
    return this.transactions.length;
  }

  get paidTransactions(): number {
    return this.transactions.filter(
      transaction => transaction.status === 'Paid'
    ).length;
  }

  get pendingTransactions(): number {
    return this.transactions.filter(
      transaction => transaction.status === 'Pending'
    ).length;
  }

  get totalRevenue(): number {
    return this.transactions
      .filter(transaction => transaction.status === 'Paid')
      .reduce(
        (total, transaction) => total + transaction.amount,
        0
      );
  }

  filterTransactions(status: string): void {

    this.selectedFilter = status;

    this.applyFilters();
  }

  searchTransactions(): void {

    this.applyFilters();
  }

  private applyFilters(): void {

    let result = [...this.transactions];

    if (this.selectedFilter !== 'All') {

      result = result.filter(
        transaction =>
          transaction.status === this.selectedFilter
      );
    }

    if (this.searchText.trim()) {

      const search = this.searchText
        .toLowerCase()
        .trim();

      result = result.filter(transaction =>
        transaction.id.toLowerCase().includes(search) ||
        transaction.tenantId.toLowerCase().includes(search) ||
        transaction.pharmacyName.toLowerCase().includes(search) ||
        transaction.plan.toLowerCase().includes(search) ||
        transaction.invoiceNumber.toLowerCase().includes(search) ||
        transaction.paymentMethod.toLowerCase().includes(search)
      );
    }

    this.filteredTransactions = result;
  }

  viewTransaction(transaction: BillingTransaction): void {

    alert(
      `Transaction Details\n\n` +
      `Transaction: ${transaction.id}\n` +
      `Pharmacy: ${transaction.pharmacyName}\n` +
      `Invoice: ${transaction.invoiceNumber}\n` +
      `Plan: ${transaction.plan}\n` +
      `Amount: ৳${transaction.amount}\n` +
      `Payment: ${transaction.paymentMethod}\n` +
      `Status: ${transaction.status}`
    );
  }

  downloadInvoice(transaction: BillingTransaction): void {

    alert(
      `Invoice ${transaction.invoiceNumber} is ready for download.`
    );
  }

}