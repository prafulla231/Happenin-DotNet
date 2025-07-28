import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth';
import { environment } from '../../../../environment.prod';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
})
export class LoginComponent implements OnDestroy {
  isLogin = true;
  showSuccessPopup = false;
  successMessage = '';

  isOtpLogin = false;
  otpSent = false;
  otpForm: FormGroup;
  resendTimer = 0;
  resendDisabled = false;
  private timerInterval: any;

  // Alert popup properties
  showAlertPopup = false;
  alertMessage = '';
  alertType: 'error' | 'warning' | 'info' = 'error';

  loginForm: FormGroup;
  registerForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient,
    private authService: AuthService
  ) {
    // Login form with enhanced validations
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    // Register form with enhanced validations and confirm password
    this.registerForm = this.fb.group(
      {
        name: ['', [Validators.required, Validators.minLength(2)]],
        phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
        email: ['', [Validators.required, Validators.email]],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(6),
            this.passwordValidator,
          ],
        ],
        confirmPassword: ['', [Validators.required]], // Added confirm password field
        role: ['user'],
      },
      { validators: this.passwordMatchValidator }
    ); // Added form-level validator

    this.otpForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      otp: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
    });
  }

  // Custom password validator
  passwordValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.value || '';

    if (!password) return null;

    if (password.length < 6) return null;

    if (!/(?=.*[a-z])/.test(password)) {
      return { lowercase: true };
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      return { uppercase: true };
    }

    if (!/(?=.*\d)/.test(password)) {
      return { number: true };
    }

    return null; // Password is valid
  }

  // NEW: Custom validator to check if passwords match
  passwordMatchValidator(formGroup: AbstractControl): ValidationErrors | null {
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;

    if (password && confirmPassword && password !== confirmPassword) {
      // Set error on confirmPassword field
      formGroup.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      // Clear the error if passwords match
      const confirmPasswordControl = formGroup.get('confirmPassword');
      if (confirmPasswordControl?.errors?.['passwordMismatch']) {
        delete confirmPasswordControl.errors['passwordMismatch'];
        if (Object.keys(confirmPasswordControl.errors).length === 0) {
          confirmPasswordControl.setErrors(null);
        }
      }
    }

    return null;
  }

  toggleLoginMethod(isOtp: boolean): void {
    this.isOtpLogin = isOtp;
    this.otpSent = false;
    this.resetResendTimer();
    // Reset forms when switching
    this.loginForm.reset();
    this.otpForm.reset();
  }

  onSendOtp(): void {
    const emailControl = this.otpForm.get('email');
    if (emailControl?.valid) {
      this.sendOtp(emailControl.value);
    } else {
      emailControl?.markAsTouched();
      this.showAlert('Please enter a valid email address.', 'warning');
    }
  }

  onResendOtp(): void {
    if (!this.resendDisabled) {
      const emailControl = this.otpForm.get('email');
      if (emailControl?.valid) {
        // Clear the OTP field when resending
        this.otpForm.patchValue({ otp: '' });
        this.sendOtp(emailControl.value);
      }
    }
  }

  onVerifyOtp(): void {
    if (this.otpForm.valid) {
      const { email, otp } = this.otpForm.value;
      this.verifyOtp(email, otp);
    } else {
      this.markFormGroupTouched(this.otpForm);
      this.showAlert('Please enter a valid 6-digit OTP.', 'warning');
    }
  }

  toggleForm(isLoginForm: boolean): void {
    this.isLogin = isLoginForm;
    // Reset forms when switching
    this.loginForm.reset();
    this.registerForm.reset();
    // Set default role for register form
    if (!isLoginForm) {
      this.registerForm.patchValue({ role: 'user' });
    }
  }

  showSuccessMessage(message: string): void {
    this.successMessage = message;
    this.showSuccessPopup = true;

    // Hide popup after 2 seconds
    setTimeout(() => {
      this.showSuccessPopup = false;
    }, 2000);
  }

  // New method to show alert popup
  showAlert(
    message: string,
    type: 'error' | 'warning' | 'info' = 'error'
  ): void {
    this.alertMessage = message;
    this.alertType = type;
    this.showAlertPopup = true;

    // Auto-hide after 4 seconds
    setTimeout(() => {
      this.hideAlert();
    }, 4000);
  }

  sendOtp(email: string) {
    this.http
      .post(`${environment.apiBaseUrl}${environment.apis.sendOtp}`, { email })
      .subscribe({
        next: () => {
          this.otpSent = true;
          this.startResendTimer();
          this.showAlert('OTP sent to your email successfully! 📧', 'info');
        },
        error: (err) => {
          console.error('OTP send failed', err);
          let errorMessage = 'Failed to send OTP. Please try again.';
          if (err.error?.message) {
            errorMessage = err.error.message;
          }
          this.showAlert(errorMessage, 'error');
        },
      });
  }

  getOtpEmailError(): string | null {
    const emailControl = this.otpForm.get('email');
    if (!emailControl?.errors || !emailControl?.touched) {
      return null;
    }

    if (emailControl.errors['required']) {
      return 'Email is required';
    }
    if (emailControl.errors['email']) {
      return 'Please enter a valid email address';
    }

    return null;
  }

  getOtpError(): string | null {
    const otpControl = this.otpForm.get('otp');
    if (!otpControl?.errors || !otpControl?.touched) {
      return null;
    }

    if (otpControl.errors['required']) {
      return 'OTP is required';
    }
    if (otpControl.errors['pattern']) {
      return 'Please enter a valid 6-digit OTP';
    }

    return null;
  }

  public startResendTimer(): void {
    this.resendTimer = 180; // 3 minutes = 180 seconds
    this.resendDisabled = true;

    this.timerInterval = setInterval(() => {
      this.resendTimer--;

      if (this.resendTimer <= 0) {
        this.resetResendTimer();
      }
    }, 1000);
  }

  private resetResendTimer(): void {
    this.resendTimer = 0;
    this.resendDisabled = false;

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  getFormattedTimer(): string {
    const minutes = Math.floor(this.resendTimer / 60);
    const seconds = this.resendTimer % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  }

  // Clean up timer on component destroy
  ngOnDestroy(): void {
    this.resetResendTimer();
  }

  verifyOtp(email: string, otp: string) {
    this.http
      .post(`${environment.apiBaseUrl}${environment.apis.verifyOtp}`, {
        email,
        otp,
      })
      .subscribe({
        next: (response: any) => {
          const userRole = response.user?.role.toLowerCase();

          if (response.token) {
            localStorage.setItem('token', response.token);
            sessionStorage.setItem('token', response.token);
          }
          if (response.user) {
            localStorage.setItem('user', JSON.stringify(response.user));
            sessionStorage.setItem('user', JSON.stringify(response.user));
          }

          // Show success message
          this.showSuccessMessage('Logged in successfully! 🎉');

          setTimeout(() => {
            this.getRoleAndNavigate();
          }, 2000);
        },
        error: (error) => {
          console.error('Login failed', error);

          // Handle specific error messages
          let errorMessage =
            'Login failed. Please check your credentials and try again.';
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.status === 401) {
            errorMessage = 'Invalid email or password. Please try again.';
          } else if (error.status === 0) {
            errorMessage = 'Network error. Please check your connection.';
          }

          // Use custom alert instead of default alert
          this.showAlert(errorMessage, 'error');
        },
      });
  }

  getRoleAndNavigate() {
    const token = localStorage.getItem('token');
    // console.log('Token from localStorage:', token);

    this.http
      .get(`${environment.apiBaseUrl}/users/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .subscribe({
        next: (res: any) => {
          const redirectPath = res.data.redirectTo;
          if (redirectPath) {
            this.router.navigate([redirectPath]);
          } else {
            this.router.navigate(['/fallback']);
          }
        },
        error: () => {
          this.showAlert('Access denied or session expired', 'error');
        },
      });
  }

  // Method to manually hide alert popup
  hideAlert(): void {
    this.showAlertPopup = false;
  }

  onLoginSubmit(): void {
    if (this.loginForm.valid) {
      const data = this.loginForm.value;

      this.authService.loginUser(data).subscribe({
        next: (response: any) => {
          const userRole = response.user?.role;
          // console.log('User Role:', userRole);

          if (response.token) {
            // console.log('Token:', response.token);
            localStorage.setItem('token', response.token);
            sessionStorage.setItem('token', response.token);
          }
          if (response.user) {
            // console.log('User:', respSonse.user);
            localStorage.setItem('user', JSON.stringify(response.user));
            sessionStorage.setItem('user', JSON.stringify(response.user));
          }

          // Show success message
          this.showSuccessMessage('Logged in successfully! 🎉');
          setTimeout(() => {
            this.getRoleAndNavigate();
          }, 2000);
        },
        error: (error) => {
          console.error('Login failed', error);

          // Handle specific error messages
          let errorMessage =
            'Login failed. Please check your credentials and try again.';
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.status === 401) {
            errorMessage = 'Invalid email or password. Please try again.';
          } else if (error.status === 0) {
            errorMessage = 'Network error. Please check your connection.';
          }

          // Use custom alert instead of default alert
          this.showAlert(errorMessage, 'error');
        },
      });
    } else {
      // Mark all fields as touched to show validation errors
      this.markFormGroupTouched(this.loginForm);

      // Show validation error popup
      this.showAlert(
        'Please fill in all required fields correctly.',
        'warning'
      );
    }
  }

  onRegisterSubmit(): void {
    if (this.registerForm.valid) {
      const data = this.registerForm.value;
      // Remove confirmPassword from the data sent to server
      const { confirmPassword, ...registrationData } = data;

      this.authService.registerUser(registrationData).subscribe({
        next: () => {
          // Automatically log the user in with the same credentials
          const loginData = {
            email: registrationData.email,
            password: registrationData.password,
          };

          this.authService.loginUser(loginData).subscribe({
            next: (response: any) => {
              const userRole = response.user?.role;

              if (response.token) {
                localStorage.setItem('token', response.token);
                sessionStorage.setItem('token', response.token);
              }

              this.showSuccessMessage(
                'Registered and logged in successfully! 🎉'
              );
              setTimeout(() => {
                this.getRoleAndNavigate();
              }, 2000);
            },
            error: (loginError) => {
              console.error('Auto-login failed after registration', loginError);
              this.showAlert(
                'Registration succeeded but auto-login failed. Please try logging in.',
                'warning'
              );
              this.toggleForm(true); // fallback to login form
            },
          });
        },
        error: (error) => {
          console.error('Registration failed', error);

          let errorMessage = 'Registration failed. Please try again.';
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.status === 409) {
            errorMessage =
              'Email already exists. Please use a different email.';
          } else if (error.status === 0) {
            errorMessage = 'Network error. Please check your connection.';
          }

          this.showAlert(errorMessage, 'error');
        },
      });
    } else {
      this.markFormGroupTouched(this.registerForm);
      this.showAlert(
        'Please fill in all required fields correctly.',
        'warning'
      );
    }
  }

  // Utility method to mark all form controls as touched
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  // Get password validation error message (one at a time)
  getPasswordError(formGroup: FormGroup): string | null {
    const passwordControl = formGroup.get('password');
    if (!passwordControl?.errors || !passwordControl?.touched) {
      return null;
    }

    if (passwordControl.errors['required']) {
      return 'Password is required';
    }
    if (passwordControl.errors['minlength']) {
      return 'Password must be at least 6 characters long';
    }

    // Additional validation for register form
    if (formGroup === this.registerForm) {
      if (passwordControl.errors['lowercase']) {
        return 'Password must contain at least one lowercase letter';
      }
      if (passwordControl.errors['uppercase']) {
        return 'Password must contain at least one uppercase letter';
      }
      if (passwordControl.errors['number']) {
        return 'Password must contain at least one number';
      }
    }

    return null;
  }

  // NEW: Get confirm password validation error message
  getConfirmPasswordError(): string | null {
    const confirmPasswordControl = this.registerForm.get('confirmPassword');
    if (!confirmPasswordControl?.errors || !confirmPasswordControl?.touched) {
      return null;
    }

    if (confirmPasswordControl.errors['required']) {
      return 'Please confirm your password';
    }
    if (confirmPasswordControl.errors['passwordMismatch']) {
      return 'Passwords do not match';
    }

    return null;
  }
}
