import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BatchExpiryGridComponent } from './batch-expiry-grid.component';

describe('BatchExpiryGridComponent', () => {
  let component: BatchExpiryGridComponent;
  let fixture: ComponentFixture<BatchExpiryGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BatchExpiryGridComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BatchExpiryGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
