import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfitReportComponent } from './profit-report.component';

describe('ProfitReportComponent', () => {
  let component: ProfitReportComponent;
  let fixture: ComponentFixture<ProfitReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfitReportComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProfitReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
