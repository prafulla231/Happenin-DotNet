import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyRegisteredEvents } from './my-registered-events';

describe('MyRegisteredEvents', () => {
  let component: MyRegisteredEvents;
  let fixture: ComponentFixture<MyRegisteredEvents>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyRegisteredEvents]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyRegisteredEvents);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
