import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminExpiredEvents } from './admin-expired-events';

describe('AdminExpiredEvents', () => {
  let component: AdminExpiredEvents;
  let fixture: ComponentFixture<AdminExpiredEvents>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminExpiredEvents]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminExpiredEvents);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
