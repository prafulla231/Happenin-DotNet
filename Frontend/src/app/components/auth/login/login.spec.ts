import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { LoginComponent } from './login';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockRouter: any;
  let mockAuthService: any;

  beforeEach(async () => {
    mockRouter = { navigate: jasmine.createSpy('navigate') };
    mockAuthService = {
      loginUser: jasmine.createSpy('loginUser').and.returnValue(of({})),
      registerUser: jasmine.createSpy('registerUser').and.returnValue(of({}))
    };

    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        ReactiveFormsModule,
        FormsModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('Form toggling', () => {
    it('should toggle between login and register forms', () => {
      component.toggleForm(false);
      expect(component.isLogin).toBeFalse();
      component.toggleForm(true);
      expect(component.isLogin).toBeTrue();
    });

    it('should toggle between password and OTP login', () => {
      component.toggleLoginMethod(true);
      expect(component.isOtpLogin).toBeTrue();
      component.toggleLoginMethod(false);
      expect(component.isOtpLogin).toBeFalse();
    });
  });

  describe('Login Form Validation', () => {
    it('should be invalid when empty', () => {
      component.loginForm.setValue({ email: '', password: '' });
      expect(component.loginForm.invalid).toBeTrue();
    });

    it('should be valid with correct values', () => {
      component.loginForm.setValue({ email: 'test@example.com', password: 'Test123' });
      expect(component.loginForm.valid).toBeTrue();
    });
  });

  describe('Register Form Validation', () => {
    it('should be invalid when empty', () => {
      component.registerForm.setValue({
        name: '', phone: '', email: '', password: '', confirmPassword: '', role: 'user'
      });
      expect(component.registerForm.invalid).toBeTrue();
    });

    it('should be invalid if passwords do not match', () => {
      component.registerForm.setValue({
        name: 'Test', phone: '1234567890', email: 'test@example.com',
        password: 'Test123', confirmPassword: 'Test124', role: 'user'
      });
      expect(component.registerForm.invalid).toBeTrue();
    });

    it('should be valid with correct values', () => {
      component.registerForm.setValue({
        name: 'Test', phone: '1234567890', email: 'test@example.com',
        password: 'Test123', confirmPassword: 'Test123', role: 'user'
      });
      expect(component.registerForm.valid).toBeTrue();
    });
  });

  describe('OTP Form Validation', () => {
    it('should be invalid when empty', () => {
      component.otpForm.setValue({ email: '', otp: '' });
      expect(component.otpForm.invalid).toBeTrue();
    });

    it('should be valid with correct values', () => {
      component.otpForm.setValue({ email: 'test@example.com', otp: '123456' });
      expect(component.otpForm.valid).toBeTrue();
    });
  });

  describe('OTP Actions', () => {
    it('should call sendOtp on valid email', () => {
      spyOn(component, 'sendOtp');
      component.otpForm.get('email')?.setValue('test@example.com');
      component.onSendOtp();
      expect(component.sendOtp).toHaveBeenCalledWith('test@example.com');
    });

    it('should show alert on invalid email', () => {
      spyOn(component, 'showAlert');
      component.otpForm.get('email')?.setValue('');
      component.onSendOtp();
      expect(component.showAlert).toHaveBeenCalled();
    });

    it('should call verifyOtp on valid form', () => {
      spyOn(component, 'verifyOtp');
      component.otpForm.setValue({ email: 'test@example.com', otp: '123456' });
      component.onVerifyOtp();
      expect(component.verifyOtp).toHaveBeenCalledWith('test@example.com', '123456');
    });

    it('should show alert on invalid OTP form', () => {
      spyOn(component, 'showAlert');
      component.otpForm.setValue({ email: '', otp: '' });
      component.onVerifyOtp();
      expect(component.showAlert).toHaveBeenCalled();
    });

    it('should call sendOtp on resend if not disabled', () => {
      spyOn(component, 'sendOtp');
      component.resendDisabled = false;
      component.otpForm.get('email')?.setValue('test@example.com');
      component.onResendOtp();
      expect(component.sendOtp).toHaveBeenCalledWith('test@example.com');
    });
  });

  describe('Login Submission', () => {
    it('should call authService.loginUser and navigate on success', fakeAsync(() => {
  component.loginForm.setValue({ email: 'test@example.com', password: 'Test123' });
  const response = { data: { user: { role: 'user' }, token: 'token' } };
  mockAuthService.loginUser.and.returnValue(of(response));

  spyOn(component, 'getRoleAndNavigate').and.callFake(() => Promise.resolve());

  component.onLoginSubmit();
  
  // Verify that loginUser was called immediately
  expect(mockAuthService.loginUser).toHaveBeenCalled();
  
  // Check that the success popup is shown immediately after login
  expect(component.showSuccessPopup).toBeTrue();
  
  // Advance time to trigger the navigation setTimeout (2 seconds)
  tick(2000);
  
  // Verify that navigation was called after 2 seconds
  expect(component.getRoleAndNavigate).toHaveBeenCalled();
  
  // At this point (after 2 seconds), the popup should be hidden
  expect(component.showSuccessPopup).toBeFalse();
  
  flush();
}));

    it('should show alert on login error', () => {
      component.loginForm.setValue({ email: 'test@example.com', password: 'Test123' });
      mockAuthService.loginUser.and.returnValue(throwError({ error: { message: 'fail' } }));
      spyOn(component, 'showAlert');
      component.onLoginSubmit();
      expect(component.showAlert).toHaveBeenCalled();
    });
  });

  describe('Register Submission', () => {
    it('should call authService.registerUser and loginUser on success', fakeAsync(() => {
      component.registerForm.setValue({
        name: 'Test', phone: '1234567890', email: 'test@example.com',
        password: 'Test123', confirmPassword: 'Test123', role: 'user'
      });
      mockAuthService.registerUser.and.returnValue(of({}));
      mockAuthService.loginUser.and.returnValue(of({
        data: { user: { role: 'user' }, token: 'token' }
      }));

      spyOn(component, 'getRoleAndNavigate').and.callFake(() => Promise.resolve()); // keep it synchronous
      component.onRegisterSubmit();
      tick(2000);

      expect(mockAuthService.registerUser).toHaveBeenCalled();
      expect(mockAuthService.loginUser).toHaveBeenCalled();
      expect(component.getRoleAndNavigate).toHaveBeenCalled();
      flush();
    }));

    it('should show alert on register error', () => {
      component.registerForm.setValue({
        name: 'Test', phone: '1234567890', email: 'test@example.com',
        password: 'Test123', confirmPassword: 'Test123', role: 'user'
      });
      mockAuthService.registerUser.and.returnValue(throwError({ error: { message: 'fail' } }));
      spyOn(component, 'showAlert');
      component.onRegisterSubmit();
      expect(component.showAlert).toHaveBeenCalled();
    });
  });

  describe('Popup and Timer Logic', () => {
    it('should show and hide success popup', fakeAsync(() => {
      component.showSuccessMessage('Success!');
      expect(component.showSuccessPopup).toBeTrue();
      tick(2000);
      expect(component.showSuccessPopup).toBeFalse();
      flush();
    }));

    it('should show and hide alert popup', fakeAsync(() => {
      component.showAlert('Error!', 'error');
      expect(component.showAlertPopup).toBeTrue();
      tick(4000);
      expect(component.showAlertPopup).toBeFalse();
      flush();
    }));

    it('should start and reset resend timer', fakeAsync(() => {
      component.startResendTimer();
      expect(component.resendDisabled).toBeTrue();
      expect(component.resendTimer).toBe(180);
      tick(181000);
      expect(component.resendDisabled).toBeFalse();
      expect(component.resendTimer).toBe(0);
      flush();
    }));
  });

  describe('Navigation', () => {
    it('should navigate to redirectPath on getRoleAndNavigate', () => {
      const res = { data: { redirectTo: '/user-dashboard' } };
      spyOn((component as any).http, 'get').and.returnValue(of(res));
      component.getRoleAndNavigate();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/user-dashboard']);
    });

    it('should show alert on getRoleAndNavigate error', () => {
      spyOn((component as any).http, 'get').and.returnValue(throwError({}));
      spyOn(component, 'showAlert');
      component.getRoleAndNavigate();
      expect(component.showAlert).toHaveBeenCalled();
    });
  });
});
