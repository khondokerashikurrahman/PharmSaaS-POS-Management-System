import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvoiceReceiptComponent } from './invoice-receipt.component';

describe('InvoiceReceiptComponent', () => {
  let component: InvoiceReceiptComponent;
  let fixture: ComponentFixture<InvoiceReceiptComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoiceReceiptComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InvoiceReceiptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
