import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';


// Organization Interface

export interface Organization {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
  ai_enabled: boolean;
  created_at: string;
  user_count: number;
  ticket_count: number;
 
}


// User Interface

export interface OrganizationUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  is_ai_enabled: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  organization_id: number | null;
}


// Ticket Interface

export interface OrganizationTicket {
  id: number;
  ticket_id: string;
  ticket_name: string;
  description: string;
  summary: string | null;
  category: string;
  priority: string;
  status: string;
  assigned_to: number | null;
  team: unknown;
  organization_id: number;
  created_by_id: number | null;
}


// Organization Ticket Summary Interface

export interface OrganizationTicketSummary {
  'Organization ID': number;
  'Organization Name': string;
  'Total Tickets': number;
  'Status Breakdown': Record<string, number>;
}


// Superuser Tickets API Response

export interface SuperuserTicketsResponse {
  Message: string;

  Summary: {
    'Total Organizations': number;
    'Total Tickets': number;
  };

  'Organization Breakdown': OrganizationTicketSummary[];

  Data: OrganizationTicket[];
}


// Paginated Users Response

export interface PaginatedUsersResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: OrganizationUser[];
}


@Injectable({
  providedIn: 'root'
})
export class OrganizationService {

  private baseUrl = 'http://127.0.0.1:8000/api/v1';

  private apiUrl = `${this.baseUrl}/organizations/`;

  constructor(private http: HttpClient) {}


  // Authorization Headers

  private getHeaders(): HttpHeaders {

    const token = localStorage.getItem('access_token');

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

  }


  // Get All Organizations

  getOrganizations(): Observable<Organization[]> {

    return this.http.get<Organization[]>(
      this.apiUrl,
      {
        headers: this.getHeaders()
      }
    );

  }


  // Get All Users

  getUsers(): Observable<
    OrganizationUser[] | PaginatedUsersResponse
  > {

    return this.http.get<
      OrganizationUser[] | PaginatedUsersResponse
    >(
      `${this.baseUrl}/auth/users/`,
      {
        headers: this.getHeaders()
      }
    );

  }


  // Get All Organization Tickets

  getAllTickets(): Observable<SuperuserTicketsResponse> {

    return this.http.get<SuperuserTicketsResponse>(
      `${this.baseUrl}/superuser/tickets/`,
      {
        headers: this.getHeaders()
      }
    );

  }


  // Update Organization Name

  updateOrganization(
    id: number,
    data: { name: string }
  ): Observable<any> {

    return this.http.patch(
      `${this.baseUrl}/organization/${id}/`,
      data,
      {
        headers: this.getHeaders()
      }
    );

  }


  // Delete Organization

  deleteOrganization(id: number): Observable<void> {

    return this.http.delete<void>(
      `${this.baseUrl}/organization/${id}/`,
      {
        headers: this.getHeaders()
      }
    );

  }

}