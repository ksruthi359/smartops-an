import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders
} from '@angular/common/http';

import { Observable, map } from 'rxjs';

export type RequestStatus =
  'PENDING' |
  'APPROVED' |
  'REJECTED';

export interface OrganizationRequest {
  id: number;
  organization_name: string;
  explanation: string;
  status: RequestStatus;
  previous_organization: number | null;
  created_at: string;
}

export interface OrganizationRequestResponse {
  Message: string;
  'Total Requests': number;
  Data: OrganizationRequest[];
}

@Injectable({
  providedIn: 'root'
})
export class OrganizationRequestService {

  private apiUrl =
    'http://127.0.0.1:8000/api/v1/superuser/organization-requests/';

  constructor(private http: HttpClient) {}

  getRequests(): Observable<OrganizationRequest[]> {

    const token = localStorage.getItem('access_token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http
      .get<OrganizationRequestResponse>(
        this.apiUrl,
        { headers }
      )
      .pipe(
        map(response => response.Data)
      );

  }

}