import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HoldCartComponent } from './hold-cart.component';

describe('HoldCartComponent', () => {
  let component: HoldCartComponent;
  let fixture: ComponentFixture<HoldCartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HoldCartComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HoldCartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
