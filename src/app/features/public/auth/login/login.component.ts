
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  email = '';
  password = '';
  showPassword = false;
  rememberMe = false;
  errorMessage = '';
  isLoading = false;

  constructor(
    private authService: AuthService
  ) {}

  login(): void {
    this.errorMessage = '';

    if (!this.email.trim() || !this.password) {
      this.errorMessage = 'Please enter email and password.';
      return;
    }

    if (this.isLoading) {
      return;
    }

    this.isLoading = true;

    this.authService.login(
  this.email.trim(),
  this.password
).pipe(
  finalize(() => {
    this.isLoading = false;
  })
).subscribe({
  error: (error: HttpErrorResponse | Error) => {
    // তোমার বর্তমান error handling
        if (error instanceof HttpErrorResponse) {
          if (error.status === 401) {
            this.errorMessage = 'Invalid email or password.';
          } else if (error.status === 0) {
            this.errorMessage =
              'Cannot connect to the server. Check whether the backend is running on port 9090.';
          } else {
            this.errorMessage =
              error.error?.detail ||
              error.error?.message ||
              `Login failed. Server returned ${error.status}.`;
          }
        } else {
          this.errorMessage =
            error.message || 'Login failed. Please try again.';
        }
      }
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  forgotPassword(): void {
    this.errorMessage =
      'Password recovery is not available yet.';
  }
}
