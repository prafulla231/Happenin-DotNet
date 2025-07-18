import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { ApprovalService } from './approval';

describe('ApprovalService', () => {
  let service: ApprovalService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApprovalService]
    });
    service = TestBed.inject(ApprovalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
