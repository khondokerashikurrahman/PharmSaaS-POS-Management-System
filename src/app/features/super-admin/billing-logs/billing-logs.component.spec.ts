import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BillingLogsComponent } from './billing-logs.component';

describe('BillingLogsComponent', () => {
  let component: BillingLogsComponent;
  let fixture: ComponentFixture<BillingLogsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillingLogsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BillingLogsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
