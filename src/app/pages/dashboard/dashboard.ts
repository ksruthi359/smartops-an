
import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse
} from '@angular/common/http';
import { RouterLink } from '@angular/router';

// Dashboard KPI response
interface DashboardStats {
  total_organizations: number;
  total_users: number;
  total_tickets: number;
  open_tickets: number;
  urgent_tickets: number;
  pending_requests: number | null;
}

// Organization response
interface Organization {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
  ai_enabled: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {

  // Existing dashboard statistics
  stats: DashboardStats | null = null;

  loadingStats = true;
  statsError = '';

  // Dynamic organizations
  organizations: Organization[] = [];

  organizationsLoading = true;
  organizationsError = '';

  // Backend URLs
  private readonly statsApiUrl =
    'http://127.0.0.1:8000/api/v1/super_admin_dashboard/stats/'

  private readonly organizationsApiUrl =
    'http://127.0.0.1:8000/api/v1/organizations/';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDashboardStats();
    this.loadOrganizations();
  }

  // Get authorization headers
  private getHeaders(): HttpHeaders | null {
    const token = localStorage.getItem('access_token');

    if (!token) {
      return null;
    }

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  // Existing KPI API
  loadDashboardStats(): void {
    this.loadingStats = true;
    this.statsError = '';

    const headers = this.getHeaders();

    if (!headers) {
      this.loadingStats = false;
      this.stats = null;
      this.statsError =
        'Please log in again to view dashboard statistics.';
      this.cdr.detectChanges();
      return;
    }

    this.http
      .get<DashboardStats>(
        this.statsApiUrl,
        { headers }
      )
      .subscribe({
        next: (data) => {
          console.log('Dashboard API response:', data);

          this.stats = {
            total_organizations:
              Number(data.total_organizations ?? 0),

            total_users:
              Number(data.total_users ?? 0),

            total_tickets:
              Number(data.total_tickets ?? 0),

            open_tickets:
              Number(data.open_tickets ?? 0),

            urgent_tickets:
              Number(data.urgent_tickets ?? 0),

            pending_requests:
              data.pending_requests == null
                ? null
                : Number(data.pending_requests)
          };

          this.loadingStats = false;
          this.cdr.detectChanges();
        },

        error: (error: HttpErrorResponse) => {
          console.error('Dashboard API error:', error);

          this.loadingStats = false;
          this.stats = null;

          this.statsError = this.getErrorMessage(
            error,
            'dashboard statistics'
          );

          this.cdr.detectChanges();
        }
      });
  }

  // NEW: Fetch organizations dynamically
  loadOrganizations(): void {
    this.organizationsLoading = true;
    this.organizationsError = '';
    this.organizations = [];

    const headers = this.getHeaders();

    if (!headers) {
      this.organizationsLoading = false;
      this.organizationsError =
        'Please log in again to view organizations.';
      this.cdr.detectChanges();
      return;
    }

    this.http
      .get<Organization[]>(
        this.organizationsApiUrl,
        { headers }
      )
      .subscribe({
        next: (data) => {
          console.log(
            'Organizations API response:',
            data
          );

          if (Array.isArray(data)) {
            this.organizations = data;
          } else {
            this.organizations = [];
            this.organizationsError =
              'Unexpected organizations API response.';
          }

          this.organizationsLoading = false;
          this.cdr.detectChanges();
        },

        error: (error: HttpErrorResponse) => {
          console.error(
            'Organizations API error:',
            error
          );

          this.organizationsLoading = false;
          this.organizations = [];

          this.organizationsError = this.getErrorMessage(
            error,
            'organizations'
          );

          this.cdr.detectChanges();
        }
      });
  }

  // Common API error handling
  private getErrorMessage(
    error: HttpErrorResponse,
    resource: string
  ): string {

    if (error.status === 401) {
      return 'Session expired. Please log in again.';
    }

    if (error.status === 403) {
      return 'You do not have permission to view ' +
        resource + '.';
    }

    if (error.status === 0) {
      return 'Cannot connect to Django. Check the backend and CORS configuration.';
    }

    return 'Unable to load ' + resource + '.';
  }

  // Refresh both APIs
  refreshDashboard(): void {
    this.loadDashboardStats();
    this.loadOrganizations();
  }
}
