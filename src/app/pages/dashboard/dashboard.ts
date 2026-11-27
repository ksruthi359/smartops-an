import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {HttpClient,HttpErrorResponse,HttpHeaders} from '@angular/common/http';
import { RouterLink } from '@angular/router';
import {OrganizationRequestService,type OrganizationRequest} from '../../services/organization-request';

interface DashboardStats {
  total_organizations: number;
  total_users: number;
  total_tickets: number;
  open_tickets: number;
  urgent_tickets: number;
  pending_requests: number | null;
}

interface Organization {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
  ai_enabled: boolean;
}

interface RecentTicket {
  id: number;
  ticket_id: string;
  ticket_name: string;
  status: string;
  requester: string | null;
  team: string | null;
  organization_name: string | null;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  stats: DashboardStats | null = null;
  loadingStats = true;
  statsError = '';

  organizations: Organization[] = [];
  organizationsLoading = true;
  organizationsError = '';

  recentTickets: RecentTicket[] = [];
  recentTicketsLoading = true;
  recentTicketsError = '';
  pendingRequests: OrganizationRequest[] = [];
  pendingRequestsLoading = true;
  pendingRequestsError = '';

  private readonly statsApiUrl =
    'http://127.0.0.1:8000/api/v1/super_admin_dashboard/stats/';

  private readonly organizationsApiUrl =
    'http://127.0.0.1:8000/api/v1/organizations/';

  private readonly recentTicketsApiUrl =
    'http://127.0.0.1:8000/api/v1/super_admin_dashboard/recent-tickets/';

  constructor(
    private readonly http: HttpClient,
    private readonly cdr: ChangeDetectorRef,
    private readonly organizationRequestService: OrganizationRequestService
  ) {}

  ngOnInit(): void {
    this.refreshDashboard();
  }

  refreshDashboard(): void {
    this.loadDashboardStats();
    this.loadOrganizations();
    this.loadRecentTickets();
    this.loadPendingRequests();
 }

  loadDashboardStats(): void {
    this.loadingStats = true;
    this.statsError = '';

    const headers = this.getHeaders();

    if (!headers) {
      this.loadingStats = false;
      this.stats = null;
      this.statsError = 'Please log in again to view dashboard statistics.';
      this.cdr.detectChanges();
      return;
    }

    this.http.get<DashboardStats>(this.statsApiUrl, { headers }).subscribe({
      next: (data) => {
        this.stats = {
          total_organizations: Number(data.total_organizations ?? 0),
          total_users: Number(data.total_users ?? 0),
          total_tickets: Number(data.total_tickets ?? 0),
          open_tickets: Number(data.open_tickets ?? 0),
          urgent_tickets: Number(data.urgent_tickets ?? 0),
          pending_requests:
            data.pending_requests == null ? null : Number(data.pending_requests)
        };

        this.loadingStats = false;
        this.cdr.detectChanges();
      },
      error: (error: HttpErrorResponse) => {
        this.stats = null;
        this.loadingStats = false;
        this.statsError = this.getErrorMessage(error, 'dashboard statistics');
        this.cdr.detectChanges();
      }
    });
  }

  loadOrganizations(): void {
    this.organizationsLoading = true;
    this.organizationsError = '';
    this.organizations = [];

    const headers = this.getHeaders();

    if (!headers) {
      this.organizationsLoading = false;
      this.organizationsError = 'Please log in again to view organizations.';
      this.cdr.detectChanges();
      return;
    }

    this.http.get<Organization[]>(this.organizationsApiUrl, { headers }).subscribe({
      next: (data) => {
        if (Array.isArray(data)) {
          this.organizations = data;
        } else {
          this.organizationsError = 'Unexpected organizations API response.';
        }

        this.organizationsLoading = false;
        this.cdr.detectChanges();
      },
      error: (error: HttpErrorResponse) => {
        this.organizationsLoading = false;
        this.organizationsError = this.getErrorMessage(error, 'organizations');
        this.cdr.detectChanges();
      }
    });
  }

  loadRecentTickets(): void {
    this.recentTicketsLoading = true;
    this.recentTicketsError = '';
    this.recentTickets = [];

    const headers = this.getHeaders();

    if (!headers) {
      this.recentTicketsLoading = false;
      this.recentTicketsError = 'Please log in again to view recent tickets.';
      this.cdr.detectChanges();
      return;
    }

    this.http.get<RecentTicket[]>(this.recentTicketsApiUrl, { headers }).subscribe({
      next: (data) => {
        if (Array.isArray(data)) {
          this.recentTickets = data;
        } else {
          this.recentTicketsError = 'Unexpected recent tickets API response.';
        }

        this.recentTicketsLoading = false;
        this.cdr.detectChanges();
      },
      error: (error: HttpErrorResponse) => {
        this.recentTicketsLoading = false;
        this.recentTicketsError = this.getErrorMessage(error, 'recent tickets');
        this.cdr.detectChanges();
      }
    });
  }
loadPendingRequests(): void {
  this.pendingRequestsLoading = true;
  this.pendingRequestsError = '';

  this.organizationRequestService.getRequests().subscribe({
    next: requests => {
      this.pendingRequests = requests.filter(
        request => request.status === 'PENDING'
      );
      this.pendingRequestsLoading = false;
      this.cdr.detectChanges();
    },
    error: (error: HttpErrorResponse) => {
      this.pendingRequests = [];
      this.pendingRequestsLoading = false;
      this.pendingRequestsError = this.getErrorMessage(
        error,
        'pending organization requests'
      );
      this.cdr.detectChanges();
    }
  });
}
  private getHeaders(): HttpHeaders | null {
    const token = localStorage.getItem('access_token');

    if (!token) {
      return null;
    }

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  private getErrorMessage(error: HttpErrorResponse, resource: string): string {
    if (error.status === 401) {
      return 'Session expired. Please log in again.';
    }

    if (error.status === 403) {
      return `You do not have permission to view ${resource}.`;
    }

    if (error.status === 0) {
      return 'Cannot connect to Django. Check the backend and CORS configuration.';
    }

    return `Unable to load ${resource}.`;
  }
}