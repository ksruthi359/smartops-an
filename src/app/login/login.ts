
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  username = '';
  password = '';
  error = '';
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  login(): void {
    console.log('LOGIN BUTTON CLICKED');

    if (!this.username.trim() || !this.password) {
      this.error = 'Please enter username and password.';
      return;
    }

    this.error = '';
    this.loading = true;

    this.authService.login(this.username.trim(), this.password).subscribe({
      next: (response) => {
        console.log('LOGIN SUCCESSFUL');
        console.log('User:', response['User Information']);

        // AuthService saves Access and Refresh tokens automatically.
        const token = this.authService.getAccessToken();

        this.loading = false;

        if (!token) {
          this.error = 'Login succeeded, but the access token was not saved.';
          console.error('Access token is missing from local storage.');
          return;
        }

        this.router.navigate(['/super-admin']);
      },

      error: (err) => {
        console.error('LOGIN ERROR:', err);

        this.loading = false;

        if (err.status === 400) {
          this.error =
            err.error?.Error ||
            err.error?.detail ||
            'Please check your login details.';
        } else if (err.status === 401) {
          this.error = 'Invalid username or password.';
        } else if (err.status === 403) {
          this.error = 'User account is inactive or access is denied.';
        } else if (err.status === 0) {
          this.error = 'Cannot connect to Django server.';
        } else {
          this.error =
            err.error?.Error ||
            err.error?.detail ||
            'Login failed. Please try again.';
        }
      }
    });
  }
}
