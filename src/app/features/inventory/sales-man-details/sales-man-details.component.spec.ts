import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalesManDetailsComponent } from './sales-man-details.component';

describe('SalesManDetailsComponent', () => {
  let component: SalesManDetailsComponent;
  let fixture: ComponentFixture<SalesManDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesManDetailsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SalesManDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
