import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalesManFormComponent } from './sales-man-form.component';

describe('SalesManFormComponent', () => {
  let component: SalesManFormComponent;
  let fixture: ComponentFixture<SalesManFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesManFormComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SalesManFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
