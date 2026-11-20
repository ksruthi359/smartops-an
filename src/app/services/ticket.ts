import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

export interface Ticket {
  id: number;
  ticket_id: string;
  ticket_name: string;
  status: string;
  priority: string;
  created_at: string;
  organization_name: string | null;
  requester: string | null;
}

@Injectable({ providedIn: 'root' })
export class TicketService {
  private readonly apiBaseUrl = 'http://127.0.0.1:8000/api/v1';

  constructor(private readonly http: HttpClient) {}

  getTickets(): Observable<Ticket[]> {
    return this.fetchTickets(`${this.apiBaseUrl}/tickets/`);
  }

  getSuperAdminTickets(): Observable<Ticket[]> {
    return this.fetchTickets(
      `${this.apiBaseUrl}/super_admin_dashboard/tickets/`
    );
  }

  private fetchTickets(url: string): Observable<Ticket[]> {
    const token = localStorage.getItem('access_token');

    if (!token) {
      return throwError(() => new Error('Please log in again to view tickets.'));
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.get<Ticket[]>(url, { headers });
  }
}