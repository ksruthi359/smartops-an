import { ChangeDetectorRef, Component } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  loggingOut = false;
  logoutError = '';

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly changeDetector: ChangeDetectorRef,
  ) {}

  logout(): void {
    if (this.loggingOut) return;

    this.loggingOut = true;
    this.logoutError = '';

    this.authService.logoutSession().subscribe({
      next: () => {
        this.loggingOut = false;
        this.changeDetector.markForCheck();
        void this.router.navigateByUrl('/login', { replaceUrl: true });
      },
      error: (error: unknown) => {
        this.loggingOut = false;

        const backendMessage =
          error instanceof HttpErrorResponse ? error.error?.Error : undefined;

        this.logoutError =
          typeof backendMessage === 'string'
            ? backendMessage
            : error instanceof Error
              ? error.message
              : 'Could not log out. Please try again.';

        this.changeDetector.markForCheck();
      },
    });
  }
}