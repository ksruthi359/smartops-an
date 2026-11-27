import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type RequestDecision = 'APPROVED' | 'REJECTED';

export interface OrganizationRequest {
  id: number;
  organization_name: string;
  explanation: string;
  status: RequestStatus;
  created_at: string;
  previous_organization: number | null;
  previous_organization_name?: string | null;
  current_organization?: string | null;
  requested_by_username?: string | null;
  requested_by_email?: string | null;
  reviewed_by?: number | null;
  reviewed_by_username?: string | null;
  reviewed_at?: string | null;
  rejection_reason?: string | null;
  approved_organization?: number | null;
}

interface RequestListResponse {
  Data: OrganizationRequest[];
}

interface DecisionResponse {
  Message: string;
  Data: OrganizationRequest;
}

@Injectable({ providedIn: 'root' })
export class OrganizationRequestService {
  private readonly apiUrl =
    'http://127.0.0.1:8000/api/v1/superuser/organization-requests/';

  constructor(private readonly http: HttpClient) {}

  getRequests(): Observable<OrganizationRequest[]> {
    return this.http
      .get<RequestListResponse>(this.apiUrl, { headers: this.getHeaders() })
      .pipe(map(response => response.Data));
  }

  submitDecision(
    requestId: number,
    decision: RequestDecision,
    reason = ''
  ): Observable<DecisionResponse> {
    const body = decision === 'REJECTED'
      ? { decision, rejection_reason: reason.trim() }
      : { decision };

    return this.http.post<DecisionResponse>(
      `${this.apiUrl}${requestId}/decision/`,
      body,
      { headers: this.getHeaders() }
    );
  }
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');

    return token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();
  }
}