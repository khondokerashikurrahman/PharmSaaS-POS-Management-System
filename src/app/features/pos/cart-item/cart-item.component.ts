import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CartItem } from '../../../core/models/cart.model';

@Component({
  selector: 'app-cart-item',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './cart-item.component.html',
  styleUrl: './cart-item.component.scss'
})
export class CartItemComponent {

  @Input() item!: CartItem;

  @Output()
  increase = new EventEmitter<CartItem>();

  @Output()
  decrease = new EventEmitter<CartItem>();

  @Output()
  remove = new EventEmitter<CartItem>();

  increaseQuantity(): void {
    this.increase.emit(this.item);
  }

  decreaseQuantity(): void {
    this.decrease.emit(this.item);
  }

  removeItem(): void {
    this.remove.emit(this.item);
  }
}