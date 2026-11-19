
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

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

@Injectable({
  providedIn: 'root'
})
export class OrganizationService {

  private apiUrl = 'http://127.0.0.1:8000/api/v1/organizations/';

  constructor(private http: HttpClient) {}

  // Get all organizations
  getOrganizations(): Observable<Organization[]> {
    const token = localStorage.getItem('access_token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.get<Organization[]>(
      this.apiUrl,
      { headers }
    );
  }

  // Update organization name
  updateOrganization(
    id: number,
    data: { name: string }
  ): Observable<any> {
    const token = localStorage.getItem('access_token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.patch(
      `http://127.0.0.1:8000/api/v1/organization/${id}/`,
      data,
      { headers }
    );
  }

  // Delete organization
  deleteOrganization(id: number): Observable<void> {
    const token = localStorage.getItem('access_token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.delete<void>(
      `${this.apiUrl}${id}/`,
      { headers }
    );
  }
}
