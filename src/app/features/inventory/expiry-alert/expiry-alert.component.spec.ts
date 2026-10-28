import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpiryAlertComponent } from './expiry-alert.component';

describe('ExpiryAlertComponent', () => {
  let component: ExpiryAlertComponent;
  let fixture: ComponentFixture<ExpiryAlertComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpiryAlertComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ExpiryAlertComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
