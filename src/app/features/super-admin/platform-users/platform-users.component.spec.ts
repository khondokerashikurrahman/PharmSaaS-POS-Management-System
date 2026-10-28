import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlatformUsersComponent } from './platform-users.component';

describe('PlatformUsersComponent', () => {
  let component: PlatformUsersComponent;
  let fixture: ComponentFixture<PlatformUsersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlatformUsersComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PlatformUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
