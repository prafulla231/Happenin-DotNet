/**
 * Unit tests for LoginComponent.
 * Covers all major functionalities: form validation, login, registration, OTP, navigation, popups, and utility methods.
 * Each test suite is documented for clarity and maintainability.
 */
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { LoginComponent } from './login';
import { AuthService } from '../../../services/auth';
import { environment } from '../../../../environment.prod';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let httpMock: HttpTestingController;
  let router: Router;
  let authService: jasmine.SpyObj<AuthService>;

  // Mock AuthService for dependency injection
  const authServiceSpy = jasmine.createSpyObj('AuthService', [
    'loginUser',
    'registerUser',
  ]);

  /**
   * Setup TestBed and spies before each test.
   * Initializes component, dependencies, and spies for local/session storage and router navigation.
   */
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        ReactiveFormsModule,
        RouterTestingModule,
        HttpClientTestingModule,
      ],
      providers: [{ provide: AuthService, useValue: authServiceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

    // Setup spies for navigation and storage
    spyOn(router, 'navigate');
    spyOn(localStorage, 'setItem');
    spyOn(localStorage, 'getItem').and.returnValue('mock-token');
    spyOn(sessionStorage, 'setItem');

    fixture.detectChanges();
  });

  /**
   * Cleanup after each test.
   * Verifies HTTP requests and clears any running timers.
   */
  afterEach(() => {
    httpMock.verify();
    // Clear any running timers
    if (component['timerInterval']) {
      clearInterval(component['timerInterval']);
    }
  });

  /**
   * Tests for component initialization and form setup.
   */
  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with login form active', () => {
      expect(component.isLogin).toBe(true);
      expect(component.isOtpLogin).toBe(false);
      expect(component.otpSent).toBe(false);
    });

    it('should initialize forms with proper validators', () => {
      expect(component.loginForm).toBeDefined();
      expect(component.registerForm).toBeDefined();
      expect(component.otpForm).toBeDefined();

      // Check login form validators
      const emailControl = component.loginForm.get('email');
      const passwordControl = component.loginForm.get('password');

      emailControl?.setValue('');
      passwordControl?.setValue('');

      expect(emailControl?.invalid).toBe(true);
      expect(passwordControl?.invalid).toBe(true);
    });
  });

  /**
   * Tests for toggling between login and registration forms.
   */
  describe('Form Toggle Functionality', () => {
    it('should toggle between login and registration forms', () => {
      component.toggleForm(false);
      expect(component.isLogin).toBe(false);

      component.toggleForm(true);
      expect(component.isLogin).toBe(true);
    });

    it('should reset forms when toggling', () => {
      component.loginForm.patchValue({
        email: 'test@test.com',
        password: 'password',
      });
      component.toggleForm(false);

      expect(component.loginForm.value.email).toBe(null);
      expect(component.loginForm.value.password).toBe(null);
    });

    it('should set default role when switching to registration', () => {
      component.toggleForm(false);
      expect(component.registerForm.get('role')?.value).toBe('user');
    });
  });

  /**
   * Tests for toggling between password and OTP login methods.
   */
  describe('Login Method Toggle', () => {
    it('should toggle between password and OTP login', () => {
      component.toggleLoginMethod(true);
      expect(component.isOtpLogin).toBe(true);
      expect(component.otpSent).toBe(false);

      component.toggleLoginMethod(false);
      expect(component.isOtpLogin).toBe(false);
    });

    it('should reset forms when toggling login method', () => {
      component.loginForm.patchValue({ email: 'test@test.com' });
      component.otpForm.patchValue({ email: 'test@test.com' });

      component.toggleLoginMethod(true);

      expect(component.loginForm.value.email).toBe(null);
      expect(component.otpForm.value.email).toBe(null);
    });
  });

  /**
   * Tests for form validation logic for login, registration, and OTP forms.
   */
  describe('Form Validation', () => {
    describe('Login Form Validation', () => {
      it('should validate email format', () => {
        const emailControl = component.loginForm.get('email');

        emailControl?.setValue('invalid-email');
        expect(emailControl?.invalid).toBe(true);

        emailControl?.setValue('valid@email.com');
        expect(emailControl?.valid).toBe(true);
      });

      it('should validate password length', () => {
        const passwordControl = component.loginForm.get('password');

        passwordControl?.setValue('12345');
        expect(passwordControl?.invalid).toBe(true);

        passwordControl?.setValue('123456');
        expect(passwordControl?.valid).toBe(true);
      });
    });

    describe('Registration Form Validation', () => {
      it('should validate all required fields', () => {
        const form = component.registerForm;

        expect(form.invalid).toBe(true);

        form.patchValue({
          name: 'Rajat Mahajan',
          phone: '9822964723',
          email: 'rajat@gmail.com',
          password: 'Password123',
          confirmPassword: 'Password123',
          role: 'user',
        });

        expect(form.valid).toBe(true);
      });

      it('should validate password strength', () => {
        const passwordControl = component.registerForm.get('password');

        // Test passwords less than 6 characters - should pass through without custom validation
        passwordControl?.setValue('weak');
        expect(passwordControl?.errors?.['minlength']).toBeDefined();

        // Test passwords with 6+ characters
        passwordControl?.setValue('WEAK123');
        expect(passwordControl?.errors?.['lowercase']).toBe(true);

        passwordControl?.setValue('weak123');
        expect(passwordControl?.errors?.['uppercase']).toBe(true);

        passwordControl?.setValue('WeakABC');
        expect(passwordControl?.errors?.['number']).toBe(true);

        // Test strong password
        passwordControl?.setValue('Strong123');
        expect(passwordControl?.valid).toBe(true);
      });

      it('should validate password confirmation', () => {
        const form = component.registerForm;

        form.patchValue({
          password: 'Password123',
          confirmPassword: 'Different123',
        });

        expect(form.errors?.['passwordMismatch']).toBe(true);

        form.patchValue({
          confirmPassword: 'Password123',
        });

        expect(form.errors?.['passwordMismatch']).toBeFalsy();
      });

      it('should validate phone number format', () => {
        const phoneControl = component.registerForm.get('phone');

        phoneControl?.setValue('123');
        expect(phoneControl?.invalid).toBe(true);

        phoneControl?.setValue('1234567890');
        expect(phoneControl?.valid).toBe(true);
      });
    });

    describe('OTP Form Validation', () => {
      it('should validate OTP format', () => {
        const otpControl = component.otpForm.get('otp');

        otpControl?.setValue('123');
        expect(otpControl?.invalid).toBe(true);

        otpControl?.setValue('123456');
        expect(otpControl?.valid).toBe(true);
      });
    });
  });

  /**
   * Tests for error message helper functions for password, confirm password, and OTP.
   */
  describe('Error Message Functions', () => {
    it('should return correct password error messages', () => {
      const passwordControl = component.loginForm.get('password');

      passwordControl?.setValue('');
      passwordControl?.markAsTouched();
      expect(component.getPasswordError(component.loginForm)).toBe(
        'Password is required'
      );

      passwordControl?.setValue('12345');
      expect(component.getPasswordError(component.loginForm)).toBe(
        'Password must be at least 6 characters long'
      );
    });

    it('should return correct confirm password error messages', () => {
      const confirmPasswordControl =
        component.registerForm.get('confirmPassword');

      confirmPasswordControl?.setValue('');
      confirmPasswordControl?.markAsTouched();
      expect(component.getConfirmPasswordError()).toBe(
        'Please confirm your password'
      );

      component.registerForm.patchValue({
        password: 'Password123',
        confirmPassword: 'Different123',
      });
      confirmPasswordControl?.markAsTouched();
      expect(component.getConfirmPasswordError()).toBe(
        'Passwords do not match'
      );
    });

    it('should return correct OTP error messages', () => {
      const otpControl = component.otpForm.get('otp');

      otpControl?.setValue('');
      otpControl?.markAsTouched();
      expect(component.getOtpError()).toBe('OTP is required');

      otpControl?.setValue('123');
      expect(component.getOtpError()).toBe('Please enter a valid 6-digit OTP');
    });
  });

  /**
   * Tests for login functionality, including success, failure, and invalid form submission.
   */
  describe('Login Functionality', () => {
    it('should handle successful login', fakeAsync(() => {
      const mockResponse = {
        token: 'mock-token',
        user: { id: 1, email: 'test@test.com', role: 'user' },
      };

      authService.loginUser.and.returnValue(of(mockResponse));

      component.loginForm.patchValue({
        email: 'test@test.com',
        password: 'password123',
      });

      spyOn(component, 'showSuccessMessage');
      spyOn(component, 'getRoleAndNavigate');

      component.onLoginSubmit();
      tick(2100);

      expect(authService.loginUser).toHaveBeenCalled();
      expect(localStorage.setItem).toHaveBeenCalledWith('token', 'mock-token');
      expect(sessionStorage.setItem).toHaveBeenCalledWith(
        'token',
        'mock-token'
      );
      expect(component.showSuccessMessage).toHaveBeenCalledWith(
        'Logged in successfully! 🎉'
      );
      expect(component.getRoleAndNavigate).toHaveBeenCalled();
    }));

    it('should handle login failure', () => {
      const mockError = {
        error: { message: 'Invalid credentials' },
        status: 401,
      };

      authService.loginUser.and.returnValue(throwError(() => mockError));

      component.loginForm.patchValue({
        email: 'test@test.com',
        password: 'wrongpassword',
      });

      spyOn(component, 'showAlert');

      component.onLoginSubmit();

      expect(component.showAlert).toHaveBeenCalledWith(
        'Invalid credentials',
        'error'
      );
    });

    it('should not submit invalid login form', () => {
      // Set completely invalid form data
      component.loginForm.patchValue({
        email: '', // Empty email (required validation)
        password: '', // Empty password (required validation)
      });

      // Mark form as touched to trigger validation
      component.loginForm.markAllAsTouched();

      spyOn(component, 'showAlert');

      component.onLoginSubmit();

      expect(component.showAlert).toHaveBeenCalledWith(
        'Please fill in all required fields correctly.',
        'warning'
      );
    });
  });

  /**
   * Tests for registration functionality, including auto-login after registration and error handling.
   */
  describe('Registration Functionality', () => {
    it('should handle successful registration and auto-login', fakeAsync(() => {
      const mockRegisterResponse = { message: 'User registered successfully' };
      const mockLoginResponse = {
        token: 'mock-token',
        user: { id: 1, email: 'test@test.com', role: 'user' },
      };

      authService.registerUser.and.returnValue(of(mockRegisterResponse));
      authService.loginUser.and.returnValue(of(mockLoginResponse));

      component.registerForm.patchValue({
        name: 'John Doe',
        phone: '1234567890',
        email: 'john@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        role: 'user',
      });

      spyOn(component, 'showSuccessMessage');
      spyOn(component, 'getRoleAndNavigate');

      component.onRegisterSubmit();
      tick(2100);

      expect(authService.registerUser).toHaveBeenCalled();
      expect(authService.loginUser).toHaveBeenCalled();
      expect(component.showSuccessMessage).toHaveBeenCalledWith(
        'Registered and logged in successfully! 🎉'
      );
      expect(component.getRoleAndNavigate).toHaveBeenCalled();
    }));

    it('should handle registration failure', () => {
      const mockError = {
        error: { message: 'Email already exists' },
        status: 409,
      };

      authService.registerUser.and.returnValue(throwError(() => mockError));

      component.registerForm.patchValue({
        name: 'John Doe',
        phone: '1234567890',
        email: 'existing@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        role: 'user',
      });

      spyOn(component, 'showAlert');

      component.onRegisterSubmit();

      expect(component.showAlert).toHaveBeenCalledWith(
        'Email already exists',
        'error'
      );
    });
  });

  /**
   * Tests for OTP functionality: sending, verifying, and resending OTP.
   */
  describe('OTP Functionality', () => {
    it('should send OTP successfully', () => {
      component.otpForm.patchValue({ email: 'test@test.com' });

      spyOn(component, 'showAlert');
      spyOn(component, 'startResendTimer');

      component.onSendOtp();

      const req = httpMock.expectOne(
        `${environment.apiBaseUrl}${environment.apis.sendOtp}`
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'test@test.com' });

      req.flush({ message: 'OTP sent successfully' });

      expect(component.otpSent).toBe(true);
      expect(component.startResendTimer).toHaveBeenCalled();
      expect(component.showAlert).toHaveBeenCalledWith(
        'OTP sent to your email successfully! 📧',
        'info'
      );
    });

    it('should handle OTP send failure', () => {
      component.otpForm.patchValue({ email: 'test@test.com' });

      spyOn(component, 'showAlert');

      component.onSendOtp();

      const req = httpMock.expectOne(
        `${environment.apiBaseUrl}${environment.apis.sendOtp}`
      );
      req.flush(
        { message: 'Failed to send OTP' },
        { status: 500, statusText: 'Server Error' }
      );

      expect(component.showAlert).toHaveBeenCalledWith(
        'Failed to send OTP',
        'error'
      );
    });

    it('should verify OTP successfully', fakeAsync(() => {
      const mockResponse = {
        token: 'mock-token',
        user: { id: 1, email: 'test@test.com', role: 'user' },
      };

      component.otpForm.patchValue({
        email: 'test@test.com',
        otp: '123456',
      });

      spyOn(component, 'showSuccessMessage');
      spyOn(component, 'getRoleAndNavigate');

      component.onVerifyOtp();

      const req = httpMock.expectOne(
        `${environment.apiBaseUrl}${environment.apis.verifyOtp}`
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        email: 'test@test.com',
        otp: '123456',
      });

      req.flush(mockResponse);
      tick(2100);

      expect(localStorage.setItem).toHaveBeenCalledWith('token', 'mock-token');
      expect(component.showSuccessMessage).toHaveBeenCalledWith(
        'Logged in successfully! 🎉'
      );
      expect(component.getRoleAndNavigate).toHaveBeenCalled();
    }));

    it('should handle OTP verification failure', () => {
      component.otpForm.patchValue({
        email: 'test@test.com',
        otp: '123456',
      });

      spyOn(component, 'showAlert');

      component.onVerifyOtp();

      const req = httpMock.expectOne(
        `${environment.apiBaseUrl}${environment.apis.verifyOtp}`
      );
      req.flush(
        { message: 'Invalid OTP' },
        { status: 401, statusText: 'Unauthorized' }
      );

      expect(component.showAlert).toHaveBeenCalledWith('Invalid OTP', 'error');
    });

    it('should handle OTP resend', () => {
      component.otpForm.patchValue({ email: 'test@test.com' });
      component.otpSent = true;
      component.resendDisabled = false;

      spyOn(component, 'sendOtp');

      component.onResendOtp();

      expect(component.sendOtp).toHaveBeenCalledWith('test@test.com');
      expect(component.otpForm.get('otp')?.value).toBe('');
    });
  });

  /**
   * Tests for resend timer functionality: starting, formatting, and resetting timer.
   */
  describe('Timer Functionality', () => {
    it('should start resend timer correctly', fakeAsync(() => {
      component.startResendTimer();

      expect(component.resendTimer).toBe(180);
      expect(component.resendDisabled).toBe(true);

      tick(1000);
      expect(component.resendTimer).toBe(179);

      tick(179000);
      expect(component.resendTimer).toBe(0);
      expect(component.resendDisabled).toBe(false);
    }));

    it('should format timer correctly', () => {
      component.resendTimer = 125; // 2:05
      expect(component.getFormattedTimer()).toBe('02:05');

      component.resendTimer = 65; // 1:05
      expect(component.getFormattedTimer()).toBe('01:05');

      component.resendTimer = 5; // 0:05
      expect(component.getFormattedTimer()).toBe('00:05');
    });

    it('should reset timer correctly', () => {
      component.startResendTimer();
      expect(component.resendTimer).toBe(180);
      expect(component.resendDisabled).toBe(true);

      component['resetResendTimer']();
      expect(component.resendTimer).toBe(0);
      expect(component.resendDisabled).toBe(false);
    });
  });

  /**
   * Tests for navigation and role-based routing after login.
   */
  describe('Navigation and Role-based Routing', () => {
    it('should navigate based on user role', () => {
      const mockResponse = {
        data: { redirectTo: '/user/dashboard' },
      };

      component.getRoleAndNavigate();

      const req = httpMock.expectOne(
        `${environment.apiBaseUrl}/users/dashboard`
      );
      expect(req.request.headers.get('Authorization')).toBe(
        'Bearer mock-token'
      );

      req.flush(mockResponse);

      expect(router.navigate).toHaveBeenCalledWith(['/user/dashboard']);
    });

    it('should handle navigation failure', () => {
      spyOn(component, 'showAlert');

      component.getRoleAndNavigate();

      const req = httpMock.expectOne(
        `${environment.apiBaseUrl}/users/dashboard`
      );
      req.flush(
        { message: 'Unauthorized' },
        { status: 401, statusText: 'Unauthorized' }
      );

      expect(component.showAlert).toHaveBeenCalledWith(
        'Access denied or session expired',
        'error'
      );
    });
  });

  /**
   * Tests for popup management: showing/hiding success and alert popups.
   */
  describe('Popup Management', () => {
    it('should show and hide success popup', fakeAsync(() => {
      component.showSuccessMessage('Test success message');

      expect(component.showSuccessPopup).toBe(true);
      expect(component.successMessage).toBe('Test success message');

      tick(2100);
      expect(component.showSuccessPopup).toBe(false);
    }));

    it('should show and auto-hide alert popup', fakeAsync(() => {
      component.showAlert('Test alert message', 'warning');

      expect(component.showAlertPopup).toBe(true);
      expect(component.alertMessage).toBe('Test alert message');
      expect(component.alertType).toBe('warning');

      tick(4100);
      expect(component.showAlertPopup).toBe(false);
    }));

    it('should hide alert popup manually', () => {
      component.showAlertPopup = true;

      component.hideAlert();

      expect(component.showAlertPopup).toBe(false);
    });
  });

  /**
   * Tests for utility functions, such as marking form groups as touched.
   */
  describe('Utility Functions', () => {
    it('should mark form group as touched', () => {
      const formGroup = component.loginForm;

      component['markFormGroupTouched'](formGroup);

      Object.keys(formGroup.controls).forEach((key) => {
        expect(formGroup.get(key)?.touched).toBe(true);
      });
    });
  });

  /**
   * Tests for custom validators: password strength and password match.
   */
  describe('Custom Validators', () => {
    it('should validate password strength correctly', () => {
      // Test empty password
      expect(component.passwordValidator({ value: '' } as any)).toBeNull();

      // Test password less than 6 characters - should return null (handled by minlength validator)
      expect(component.passwordValidator({ value: 'weak' } as any)).toBeNull();

      // Test passwords with 6+ characters
      expect(component.passwordValidator({ value: 'WEAK123' } as any)).toEqual({
        lowercase: true,
      });
      expect(component.passwordValidator({ value: 'weak123' } as any)).toEqual({
        uppercase: true,
      });
      expect(component.passwordValidator({ value: 'WeakABC' } as any)).toEqual({
        number: true,
      });
      expect(
        component.passwordValidator({ value: 'Strong123' } as any)
      ).toBeNull();
    });

    it('should validate password match correctly', () => {
      const mockFormGroup = {
        get: jasmine.createSpy('get').and.callFake((field: string) => {
          if (field === 'password') return { value: 'Password123' };
          if (field === 'confirmPassword')
            return {
              value: 'Different123',
              setErrors: jasmine.createSpy('setErrors'),
              errors: {},
            };
          return null;
        }),
      };

      const result = component.passwordMatchValidator(mockFormGroup as any);
      expect(result).toEqual({ passwordMismatch: true });
    });
  });

  /**
   * Tests for component cleanup, such as clearing timers on destroy.
   */
  describe('Component Cleanup', () => {
    it('should clean up timer on destroy', () => {
      component.startResendTimer();
      const intervalSpy = spyOn(window, 'clearInterval');

      component.ngOnDestroy();

      expect(intervalSpy).toHaveBeenCalled();
      expect(component.resendTimer).toBe(0);
      expect(component.resendDisabled).toBe(false);
    });
  });
});
