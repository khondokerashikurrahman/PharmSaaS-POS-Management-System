import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-discount-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './discount-modal.component.html',
  styleUrl: './discount-modal.component.scss'
})
export class DiscountModalComponent {

  @Input() visible = false;

  @Input() subtotal = 0;

  @Input() currentDiscount = 0;

  @Output() discountApplied = new EventEmitter<{
    type: 'percentage' | 'amount';
    value: number;
  }>();

  @Output() closed = new EventEmitter<void>();


  discountType: 'percentage' | 'amount' = 'percentage';

  discountValue = 0;


  ngOnChanges(): void {

    if (this.currentDiscount > 0) {
      this.discountValue = this.currentDiscount;
    } else {
      this.discountValue = 0;
    }

  }


  selectDiscountType(
    type: 'percentage' | 'amount'
  ): void {

    this.discountType = type;

    this.discountValue = 0;

  }


  applyDiscount(): void {

    const value = Number(this.discountValue);

    if (isNaN(value) || value < 0) {

      alert('Please enter a valid discount.');

      return;
    }


    if (this.discountType === 'percentage' && value > 100) {

      alert('Percentage discount cannot exceed 100%.');

      return;
    }


    if (this.discountType === 'amount' && value > this.subtotal) {

      alert('Discount cannot exceed subtotal.');

      return;
    }


    this.discountApplied.emit({

      type: this.discountType,

      value: value

    });


    this.closed.emit();

  }


  close(): void {

    this.closed.emit();

  }

}