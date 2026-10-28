
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface LedgerEntry {
  date: string;
  reference: string;
  type: 'Purchase' | 'Payment' | 'Return';
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

@Component({
  selector: 'app-supplier-ledger',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './supplier-ledger.component.html',
  styleUrl: './supplier-ledger.component.scss'
})
export class SupplierLedgerComponent {

  selectedSupplier = 'Square Pharmaceuticals';
  searchTerm = '';

  suppliers = [
    'Square Pharmaceuticals',
    'Beximco Pharmaceuticals',
    'Incepta Pharmaceuticals',
    'Renata Limited',
    'ACI Limited',
    'Healthcare Pharmaceuticals'
  ];

  ledgerEntries: LedgerEntry[] = [
    {
      date: '12 Sep 2026',
      reference: 'PO-2026-001',
      type: 'Purchase',
      description: 'Purchase order received',
      debit: 48500,
      credit: 0,
      balance: 48500
    },
    {
      date: '11 Sep 2026',
      reference: 'PAY-2026-018',
      type: 'Payment',
      description: 'Supplier payment',
      debit: 0,
      credit: 20000,
      balance: 28500
    },
    {
      date: '08 Sep 2026',
      reference: 'PO-2026-005',
      type: 'Purchase',
      description: 'Medicine purchase',
      debit: 41200,
      credit: 0,
      balance: 69700
    },
    {
      date: '05 Sep 2026',
      reference: 'RET-2026-004',
      type: 'Return',
      description: 'Purchase return adjustment',
      debit: 0,
      credit: 5200,
      balance: 64500
    },
    {
      date: '01 Sep 2026',
      reference: 'PAY-2026-011',
      type: 'Payment',
      description: 'Supplier payment',
      debit: 0,
      credit: 15000,
      balance: 49500
    }
  ];

  constructor(
    private router: Router
  ) {}

  get filteredEntries(): LedgerEntry[] {
    const search = this.searchTerm.trim().toLowerCase();

    if (!search) {
      return this.ledgerEntries;
    }

    return this.ledgerEntries.filter(entry =>
      entry.reference.toLowerCase().includes(search) ||
      entry.description.toLowerCase().includes(search) ||
      entry.type.toLowerCase().includes(search)
    );
  }

  get totalDebit(): number {
    return this.ledgerEntries.reduce(
      (total, entry) => total + entry.debit,
      0
    );
  }

  get totalCredit(): number {
    return this.ledgerEntries.reduce(
      (total, entry) => total + entry.credit,
      0
    );
  }

  get currentBalance(): number {
    return this.totalDebit - this.totalCredit;
  }

  get purchaseCount(): number {
    return this.ledgerEntries.filter(
      entry => entry.type === 'Purchase'
    ).length;
  }

  get paymentCount(): number {
    return this.ledgerEntries.filter(
      entry => entry.type === 'Payment'
    ).length;
  }

  get returnCount(): number {
    return this.ledgerEntries.filter(
      entry => entry.type === 'Return'
    ).length;
  }

  onSupplierChange(): void {
    // Demo purpose:
    // In a real backend application,
    // ledger data would be loaded by supplier ID.
    this.searchTerm = '';
  }

  getTypeClass(type: LedgerEntry['type']): string {
    switch (type) {
      case 'Purchase':
        return 'type-purchase';

      case 'Payment':
        return 'type-payment';

      case 'Return':
        return 'type-return';

      default:
        return '';
    }
  }

  makePayment(): void {
    alert(
      `Create supplier payment for ${this.selectedSupplier}.`
    );
  }

  exportLedger(): void {
    alert('Supplier ledger export started.');
  }

  backToProcurement(): void {
    this.router.navigate(['/app/procurement']);
  }

  trackByReference(
    index: number,
    entry: LedgerEntry
  ): string {
    return entry.reference;
  }
}
