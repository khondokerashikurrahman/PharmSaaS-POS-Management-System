import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GrnEntryComponent } from './grn-entry.component';

describe('GrnEntryComponent', () => {
  let component: GrnEntryComponent;
  let fixture: ComponentFixture<GrnEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GrnEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GrnEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
