import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminPendingApprovals } from './admin-pending-approvals';

describe('AdminPendingApprovals', () => {
  let component: AdminPendingApprovals;
  let fixture: ComponentFixture<AdminPendingApprovals>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminPendingApprovals]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminPendingApprovals);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
