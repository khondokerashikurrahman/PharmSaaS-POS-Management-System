import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiscountModalComponent } from './discount-modal.component';

describe('DiscountModalComponent', () => {
  let component: DiscountModalComponent;
  let fixture: ComponentFixture<DiscountModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiscountModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DiscountModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
