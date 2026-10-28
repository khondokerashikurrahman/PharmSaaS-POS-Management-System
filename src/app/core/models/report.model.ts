export interface Report {
  id: string;

  reportType:
    | 'Sales'
    | 'Purchase'
    | 'Inventory'
    | 'Stock'
    | 'Customer'
    | 'Supplier'
    | 'Profit & Loss';

  title: string;

  startDate: Date;
  endDate: Date;

  branchId?: string;
  branchName?: string;

  generatedBy: string;
  generatedAt: Date;

  summary: ReportSummary;

  status: 'Generated' | 'Pending' | 'Failed';
}

export interface ReportSummary {
  totalSales?: number;
  totalPurchases?: number;
  totalRevenue?: number;
  totalProfit?: number;
  totalExpense?: number;

  totalProducts?: number;
  totalStock?: number;
  lowStockItems?: number;
  expiredItems?: number;

  totalCustomers?: number;
  totalSuppliers?: number;

  totalTransactions?: number;
}