import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CashierPerformanceComponent } from './cashier-performance.component';

describe('CashierPerformanceComponent', () => {
  let component: CashierPerformanceComponent;
  let fixture: ComponentFixture<CashierPerformanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CashierPerformanceComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CashierPerformanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
