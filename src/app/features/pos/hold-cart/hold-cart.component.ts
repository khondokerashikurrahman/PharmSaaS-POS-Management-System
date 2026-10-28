import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CartItem } from '../../../core/models/cart.model';

export interface HeldCart {
  id: string;
  customerName: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  createdAt: string;
}

@Component({
  selector: 'app-hold-cart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hold-cart.component.html',
  styleUrl: './hold-cart.component.scss'
})
export class HoldCartComponent implements OnInit {

  @Output() closed = new EventEmitter<void>();

  @Output() cartResumed = new EventEmitter<HeldCart>();

  heldCarts: HeldCart[] = [];

  private readonly storageKey = 'held-carts';

  ngOnInit(): void {
    this.loadHeldCarts();
  }

  loadHeldCarts(): void {
    const storedData = localStorage.getItem(this.storageKey);

    if (!storedData) {
      this.heldCarts = [];
      return;
    }

    try {
      this.heldCarts = JSON.parse(storedData) as HeldCart[];
    } catch (error) {
      console.error('Failed to load held carts:', error);
      this.heldCarts = [];
    }
  }

  private saveHeldCarts(): void {
    localStorage.setItem(
      this.storageKey,
      JSON.stringify(this.heldCarts)
    );
  }

  resumeCart(cart: HeldCart): void {
    this.cartResumed.emit(cart);

    this.heldCarts = this.heldCarts.filter(
      item => item.id !== cart.id
    );

    this.saveHeldCarts();
  }

  deleteCart(cart: HeldCart): void {
    const confirmed = confirm(
      `Do you want to delete the held cart for "${cart.customerName}"?`
    );

    if (!confirmed) {
      return;
    }

    this.heldCarts = this.heldCarts.filter(
      item => item.id !== cart.id
    );

    this.saveHeldCarts();
  }

  close(): void {
    this.closed.emit();
  }
}