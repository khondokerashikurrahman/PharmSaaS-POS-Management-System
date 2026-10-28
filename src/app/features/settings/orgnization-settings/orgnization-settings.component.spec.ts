import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrgnizationSettingsComponent } from './orgnization-settings.component';

describe('OrgnizationSettingsComponent', () => {
  let component: OrgnizationSettingsComponent;
  let fixture: ComponentFixture<OrgnizationSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrgnizationSettingsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OrgnizationSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
