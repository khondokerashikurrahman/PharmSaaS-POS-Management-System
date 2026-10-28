import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BatchSelectorModalComponent } from './batch-selector-modal.component';

describe('BatchSelectorModalComponent', () => {
  let component: BatchSelectorModalComponent;
  let fixture: ComponentFixture<BatchSelectorModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BatchSelectorModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BatchSelectorModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
