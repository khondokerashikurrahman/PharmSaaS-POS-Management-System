import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BranchPerformanceComponent } from './branch-performance.component';

describe('BranchPerformanceComponent', () => {
  let component: BranchPerformanceComponent;
  let fixture: ComponentFixture<BranchPerformanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BranchPerformanceComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BranchPerformanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
