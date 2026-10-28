import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SaasPlanComponent } from './saas-plan.component';

describe('SaasPlanComponent', () => {
  let component: SaasPlanComponent;
  let fixture: ComponentFixture<SaasPlanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaasPlanComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SaasPlanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
