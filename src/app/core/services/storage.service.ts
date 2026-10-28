import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  // =========================
  // STORAGE KEYS
  // =========================

  private readonly salesKey = 'pharm_saas_sales';
  private readonly medicinesKey = 'pharm_saas_medicines';
  private readonly purchaseOrdersKey = 'pharm_saas_purchase_orders';
  private readonly heldCartsKey = 'held-carts';

  constructor() {}

  // =========================
  // SALES
  // =========================

  getSales<T>(): T[] {
    const data = localStorage.getItem(this.salesKey);

    if (!data) {
      return [];
    }

    try {
      const parsed = JSON.parse(data);

      return Array.isArray(parsed)
        ? parsed as T[]
        : [];
    } catch {
      return [];
    }
  }

  saveSales<T>(sales: T[]): void {
    localStorage.setItem(
      this.salesKey,
      JSON.stringify(sales)
    );
  }

  clearSales(): void {
    localStorage.removeItem(this.salesKey);
  }


  // =========================
  // MEDICINES
  // =========================

  getMedicines<T>(): T[] {
    const data = localStorage.getItem(this.medicinesKey);

    if (!data) {
      return [];
    }

    try {
      const parsed = JSON.parse(data);

      return Array.isArray(parsed)
        ? parsed as T[]
        : [];
    } catch {
      return [];
    }
  }

  saveMedicines<T>(medicines: T[]): void {
    localStorage.setItem(
      this.medicinesKey,
      JSON.stringify(medicines)
    );
  }

  clearMedicines(): void {
    localStorage.removeItem(this.medicinesKey);
  }


  // =========================
  // PURCHASE ORDERS
  // =========================

  getPurchaseOrders<T>(): T[] {
    const data = localStorage.getItem(
      this.purchaseOrdersKey
    );

    if (!data) {
      return [];
    }

    try {
      const parsed = JSON.parse(data);

      return Array.isArray(parsed)
        ? parsed as T[]
        : [];
    } catch {
      return [];
    }
  }

  savePurchaseOrders<T>(purchaseOrders: T[]): void {
    localStorage.setItem(
      this.purchaseOrdersKey,
      JSON.stringify(purchaseOrders)
    );
  }

  clearPurchaseOrders(): void {
    localStorage.removeItem(
      this.purchaseOrdersKey
    );
  }


  // =========================
  // HELD CARTS
  // =========================

  getHeldCarts<T>(): T[] {
    const data = localStorage.getItem(
      this.heldCartsKey
    );

    if (!data) {
      return [];
    }

    try {
      const parsed = JSON.parse(data);

      return Array.isArray(parsed)
        ? parsed as T[]
        : [];
    } catch {
      return [];
    }
  }

  saveHeldCarts<T>(carts: T[]): void {
    localStorage.setItem(
      this.heldCartsKey,
      JSON.stringify(carts)
    );
  }

  clearHeldCarts(): void {
    localStorage.removeItem(
      this.heldCartsKey
    );
  }
}