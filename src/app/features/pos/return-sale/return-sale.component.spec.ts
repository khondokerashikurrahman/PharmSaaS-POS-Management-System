import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReturnSaleComponent } from './return-sale.component';

describe('ReturnSaleComponent', () => {
  let component: ReturnSaleComponent;
  let fixture: ComponentFixture<ReturnSaleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReturnSaleComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ReturnSaleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
