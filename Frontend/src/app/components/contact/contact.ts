import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import emailjs from "@emailjs/browser";

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact.html',
  styleUrls: ['./contact.scss']
})
export class Contact implements OnInit {
  contactForm: FormGroup;
  isSubmitting: boolean = false;
  showSuccessMessage: boolean = false;
  showErrorMessage: boolean = false;

  // EmailJS configuration - Replace these with your actual EmailJS credentials
  private readonly EMAIL_JS_SERVICE_ID = 'service_50vt25n';
  private readonly EMAIL_JS_TEMPLATE_ID = 'template_1ggkgea';
  private readonly EMAIL_JS_PUBLIC_KEY = '-oay8RuWXR7nzb07B';

  // You might want to inject a service to get user data
  userData: any = {};

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.contactForm = this.createForm();
  }

  ngOnInit(): void {
    // Initialize EmailJS
    // emailjs.init(this.EMAIL_JS_PUBLIC_KEY);

    this.loadUserData();
    this.populateUserDetails();
  }

  // Custom validators
  private phoneValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null; // Optional field
    }

    const phoneRegex = /^[\+]?[1-9][\d]{9,9}$/;
    const isValid = phoneRegex.test(control.value.replace(/[\s\-\(\)]/g, ''));

    return isValid ? null : { invalidPhone: true };
  }

  private nameValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }

    const nameRegex = /^[a-zA-Z\s\.\-\']+$/;
    const trimmedValue = control.value.trim();

    if (trimmedValue.length < 2) {
      return { minLength: true };
    }

    if (trimmedValue.length > 50) {
      return { maxLength: true };
    }

    if (!nameRegex.test(trimmedValue)) {
      return { invalidName: true };
    }

    return null;
  }

  private subjectValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }

    const trimmedValue = control.value.trim();

    if (trimmedValue.length < 5) {
      return { minLength: true };
    }

    if (trimmedValue.length > 100) {
      return { maxLength: true };
    }

    return null;
  }

  private messageValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }

    const trimmedValue = control.value.trim();

    if (trimmedValue.length < 10) {
      return { minLength: true };
    }

    if (trimmedValue.length > 1000) {
      return { maxLength: true };
    }

    // Check for meaningful content (not just repeated characters)
    const uniqueChars = new Set(trimmedValue.toLowerCase().replace(/\s/g, '')).size;
    if (uniqueChars < 5) {
      return { notMeaningful: true };
    }

    return null;
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, this.nameValidator.bind(this)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [this.phoneValidator.bind(this)]],
      category: ['', [Validators.required]],
      subject: ['', [Validators.required, this.subjectValidator.bind(this)]],
      message: ['', [Validators.required, this.messageValidator.bind(this)]],
      priority: ['medium']
    });
  }

  private loadUserData(): void {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      this.userData = {
        id: parsedUser.userId || 'guest',
        name: parsedUser.name,
        email: parsedUser.email
      };
      // console.log('Parsed User Data:', this.userData);
    } else {
      this.userData = { id: 'guest', name: '', email: '' };
    }
  }

  private populateUserDetails(): void {
    if (this.userData) {
      this.contactForm.patchValue({
        name: this.userData.name || `${this.userData.firstName} ${this.userData.lastName || ''}`,
        email: this.userData.email || ''
      });
    }
  }

  // Helper methods for validation error messages
  getNameError(): string {
    const nameControl = this.contactForm.get('name');
    if (nameControl?.errors && nameControl?.touched) {
      if (nameControl.errors['required']) return 'Name is required';
      if (nameControl.errors['minLength']) return 'Name must be at least 2 characters long';
      if (nameControl.errors['maxLength']) return 'Name cannot exceed 50 characters';
      if (nameControl.errors['invalidName']) return 'Name can only contain letters, spaces, dots, hyphens, and apostrophes';
    }
    return '';
  }

  getEmailError(): string {
    const emailControl = this.contactForm.get('email');
    if (emailControl?.errors && emailControl?.touched) {
      if (emailControl.errors['required']) return 'Email is required';
      if (emailControl.errors['email']) return 'Please enter a valid email address';
    }
    return '';
  }

  getPhoneError(): string {
    const phoneControl = this.contactForm.get('phone');
    if (phoneControl?.errors && phoneControl?.touched) {
      if (phoneControl.errors['invalidPhone']) return 'Please enter a valid phone number';
    }
    return '';
  }

  getCategoryError(): string {
    const categoryControl = this.contactForm.get('category');
    if (categoryControl?.errors && categoryControl?.touched) {
      if (categoryControl.errors['required']) return 'Please select a category';
    }
    return '';
  }

  getSubjectError(): string {
    const subjectControl = this.contactForm.get('subject');
    if (subjectControl?.errors && subjectControl?.touched) {
      if (subjectControl.errors['required']) return 'Subject is required';
      if (subjectControl.errors['minLength']) return 'Subject must be at least 5 characters long';
      if (subjectControl.errors['maxLength']) return 'Subject cannot exceed 100 characters';
    }
    return '';
  }

  getMessageError(): string {
    const messageControl = this.contactForm.get('message');
    if (messageControl?.errors && messageControl?.touched) {
      if (messageControl.errors['required']) return 'Message is required';
      if (messageControl.errors['minLength']) return 'Message must be at least 10 characters long';
      if (messageControl.errors['maxLength']) return 'Message cannot exceed 1000 characters';
      if (messageControl.errors['notMeaningful']) return 'Please provide a meaningful message';
    }
    return '';
  }

  onSubmit(): void {
    if (this.contactForm.valid) {
      this.isSubmitting = true;
      this.showErrorMessage = false;

      const formData = {
        ...this.contactForm.value,
        // Trim whitespace from string fields
        name: this.contactForm.value.name?.trim(),
        subject: this.contactForm.value.subject?.trim(),
        message: this.contactForm.value.message?.trim(),
        phone: this.contactForm.value.phone?.trim(),
        timestamp: new Date().toISOString(),
        userId: this.userData.id || 'guest'
      };

      this.sendEmailViaEmailJS(formData);
    } else {
      this.markFormGroupTouched();
    }
  }

  private sendEmailViaEmailJS(formData: any): void {
    // Prepare template parameters for EmailJS
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      this.userData = {
        id: parsedUser.userId || 'guest',
        name: parsedUser.name,
        email: parsedUser.email
      };
    }

    const templateParams = {
      to_email: 'happenin.events.app@gmail.com',
      userName: this.userData.name,        // Changed from 'from_name'
      userEmail: this.userData.email,      // Changed from 'from_email'
      phone: formData.phone || 'Not provided',
      category: formData.category,
      priority: formData.priority,
      subject: formData.subject,
      message: formData.message,
      timestamp: new Date(formData.timestamp).toLocaleString(),
      user_id: formData.userId,

      // Additional fields for a more detailed email
      inquiry_type: formData.category,
      contact_subject: `Contact Form: ${formData.category} - ${formData.subject}`,
    };

    emailjs.send(
      this.EMAIL_JS_SERVICE_ID,
      this.EMAIL_JS_TEMPLATE_ID,
      templateParams,
      this.EMAIL_JS_PUBLIC_KEY
    )
    .then(
      (response) => {
        this.handleSubmissionSuccess();
      },
      (error) => {
        console.error('Failed to send email:', error);
        this.handleSubmissionError();
      }
    );
  }

  private handleSubmissionSuccess(): void {
    this.isSubmitting = false;
    this.showSuccessMessage = true;
    this.contactForm.reset();
    this.populateUserDetails(); // Repopulate user details after reset

    // Auto-hide success message after 5 seconds
    setTimeout(() => {
      this.showSuccessMessage = false;
    }, 5000);
  }

  private handleSubmissionError(): void {
    this.isSubmitting = false;
    this.showErrorMessage = true;

    // Auto-hide error message after 5 seconds
    setTimeout(() => {
      this.showErrorMessage = false;
    }, 5000);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.contactForm.controls).forEach(key => {
      const control = this.contactForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  resetForm(): void {
    this.contactForm.reset();
    this.populateUserDetails();
    this.contactForm.patchValue({ priority: 'medium' });
    this.showSuccessMessage = false;
    this.showErrorMessage = false;
  }

  goBack(): void {
    this.router.navigate(['/user-dashboard']);
  }

  dismissMessage(): void {
    this.showSuccessMessage = false;
    this.showErrorMessage = false;
  }
}
