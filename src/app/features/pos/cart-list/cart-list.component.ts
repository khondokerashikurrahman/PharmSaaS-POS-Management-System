import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CartItem } from '../../../core/models/cart.model';

import { CartItemComponent } from '../cart-item/cart-item.component';

@Component({
  selector: 'app-cart-list',
  standalone: true,
  imports: [
    CommonModule,
    CartItemComponent
  ],
  templateUrl: './cart-list.component.html',
  styleUrl: './cart-list.component.scss'
})
export class CartListComponent {

  @Input()
  cartItems: CartItem[] = [];

  @Output()
  increase = new EventEmitter<CartItem>();

  @Output()
  decrease = new EventEmitter<CartItem>();

  @Output()
  remove = new EventEmitter<CartItem>();

  increaseQuantity(item: CartItem): void {
    this.increase.emit(item);
  }

  decreaseQuantity(item: CartItem): void {
    this.decrease.emit(item);
  }

  removeItem(item: CartItem): void {
    this.remove.emit(item);
  }
}