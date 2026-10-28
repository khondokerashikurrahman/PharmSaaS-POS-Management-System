import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanManagerComponent } from './plan-manager.component';

describe('PlanManagerComponent', () => {
  let component: PlanManagerComponent;
  let fixture: ComponentFixture<PlanManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlanManagerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PlanManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
