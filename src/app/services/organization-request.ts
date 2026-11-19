import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface OrganizationRequest {
  id: number;
  organizationName: string;
  adminName: string;
  email: string;
  phone: string;
  industry: string;
  companySize: string;
  useCase: string;
  message: string;
  submittedDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

@Injectable({
  providedIn: 'root'
})
export class OrganizationRequestService {

  constructor() {}

  getRequests(): Observable<OrganizationRequest[]> {
    /*
      Backend developer will connect the real API here later.

      Example:

      return this.http.get<OrganizationRequest[]>(
        'http://127.0.0.1:8000/api/v1/organization-requests/'
      );
    */

    return of([]);
  }
}