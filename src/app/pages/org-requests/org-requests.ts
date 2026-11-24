import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';

import {
  OrganizationRequest,
  OrganizationRequestService,
  RequestStatus
} from '../../services/organization-request';

import {
  OrganizationService
} from '../../services/organization';

type RequestFilter = 'ALL' | RequestStatus;

@Component({
  selector: 'app-org-requests',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './org-requests.html',
  styleUrl: './org-requests.css'
})
export class OrgRequests implements OnInit {

  requests: OrganizationRequest[] = [];

  organizationNames: Record<number, string> = {};

  selectedFilter: RequestFilter = 'PENDING';

  loading = false;
  error = '';

  constructor(
    private organizationRequestService: OrganizationRequestService,
    private organizationService: OrganizationService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  // Load requests and organization names

  loadRequests(): void {

    this.loading = true;
    this.error = '';

    forkJoin({

      requests:
        this.organizationRequestService.getRequests(),

      organizations:
        this.organizationService.getOrganizations()

    }).subscribe({

      next: ({ requests, organizations }) => {

        this.requests = requests;

        this.organizationNames = {};

        organizations.forEach(organization => {

          this.organizationNames[organization.id] =
            organization.name;

        });

        this.loading = false;

        this.changeDetectorRef.detectChanges();

      },

      error: (err) => {

        console.error('Organization requests API error:', err);

        this.error = 'Unable to load organization requests.';

        this.loading = false;

        this.changeDetectorRef.detectChanges();

      }

    });

  }

  // Filter requests

  get filteredRequests(): OrganizationRequest[] {

    if (this.selectedFilter === 'ALL') {
      return this.requests;
    }

    return this.requests.filter(
      request => request.status === this.selectedFilter
    );

  }

  // Change selected tab

  setFilter(filter: RequestFilter): void {

    this.selectedFilter = filter;

  }

  // Calculate status counts

  getCount(status: RequestFilter): number {

    if (status === 'ALL') {
      return this.requests.length;
    }

    return this.requests.filter(
      request => request.status === status
    ).length;

  }

  // Previous organization name

  getOrganizationName(id: number | null): string {

    if (id === null) {
      return 'None';
    }

    return this.organizationNames[id] || `Organization #${id}`;

  }

}