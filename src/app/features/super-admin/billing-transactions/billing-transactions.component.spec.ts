import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BillingTransactionsComponent } from './billing-transactions.component';

describe('BillingTransactionsComponent', () => {
  let component: BillingTransactionsComponent;
  let fixture: ComponentFixture<BillingTransactionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillingTransactionsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BillingTransactionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
