import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransferReceiveComponent } from './transfer-receive.component';

describe('TransferReceiveComponent', () => {
  let component: TransferReceiveComponent;
  let fixture: ComponentFixture<TransferReceiveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransferReceiveComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TransferReceiveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
