import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminUpcomingEvents } from './admin-upcoming-events';

describe('AdminUpcomingEvents', () => {
  let component: AdminUpcomingEvents;
  let fixture: ComponentFixture<AdminUpcomingEvents>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminUpcomingEvents]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminUpcomingEvents);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
