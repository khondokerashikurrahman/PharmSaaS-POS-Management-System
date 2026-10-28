import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PharmacyLayoutComponent } from './pharmacy-layout.component';

describe('PharmacyLayoutComponent', () => {
  let component: PharmacyLayoutComponent;
  let fixture: ComponentFixture<PharmacyLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PharmacyLayoutComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PharmacyLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
