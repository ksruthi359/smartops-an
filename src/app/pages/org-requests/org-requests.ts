import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';

import {
  OrganizationRequest,
  OrganizationRequestService,
  RequestStatus
} from '../../services/organization-request';
import { OrganizationService } from '../../services/organization';

type RequestFilter = 'ALL' | RequestStatus;
type RequestDecision = 'APPROVED' | 'REJECTED';

@Component({
  selector: 'app-org-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './org-requests.html',
  styleUrl: './org-requests.css'
})
export class OrgRequests implements OnInit {
  readonly filters: { value: RequestFilter; label: string }[] = [
    { value: 'ALL', label: 'All' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' }
  ];

  requests: OrganizationRequest[] = [];
  organizationNames: Record<number, string> = {};
  selectedFilter: RequestFilter = 'PENDING';
  loading = false;
  error = '';

  review: {
    request: OrganizationRequest;
    decision: RequestDecision;
  } | null = null;

  rejectionReason = '';
  reviewError = '';
  reviewNotice = '';
  reviewSaving = false;

  constructor(
    private readonly organizationRequestService: OrganizationRequestService,
    private readonly organizationService: OrganizationService,
    private readonly changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.loading = true;
    this.error = '';

    forkJoin({
      requests: this.organizationRequestService.getRequests(),
      organizations: this.organizationService.getOrganizations().pipe(
        catchError(() => of([]))
      )
    }).subscribe({
      next: ({ requests, organizations }) => {
        this.requests = requests;
        const names: Record<number, string> = {};

        for (const organization of organizations) {
          names[organization.id] = organization.name;
        }

        this.organizationNames = names;
        this.loading = false;
        this.changeDetectorRef.markForCheck();
      },
      error: () => {
        this.error = 'Unable to load organization requests.';
        this.loading = false;
        this.changeDetectorRef.markForCheck();
      }
    });
  }

  get filteredRequests(): OrganizationRequest[] {
    return this.selectedFilter === 'ALL'
      ? this.requests
      : this.requests.filter(request => request.status === this.selectedFilter);
  }

  setFilter(filter: RequestFilter): void {
    this.selectedFilter = filter;
  }

  getCount(filter: RequestFilter): number {
    return filter === 'ALL'
      ? this.requests.length
      : this.requests.filter(request => request.status === filter).length;
  }

  getOrganizationName(id: number | null): string {
    return id === null ? 'None' : this.organizationNames[id] || `Organization #${id}`;
  }

  openReview(request: OrganizationRequest, decision: RequestDecision): void {
    if (this.reviewSaving || request.status !== 'PENDING') {
      return;
    }

    this.review = { request, decision };
    this.rejectionReason = '';
    this.reviewError = '';
    this.reviewNotice = '';
  }

  closeReview(): void {
    if (this.reviewSaving) {
      return;
    }

    this.review = null;
    this.rejectionReason = '';
    this.reviewError = '';
  }

  confirmReview(): void {
    const review = this.review;

    if (!review || this.reviewSaving) {
      return;
    }

    const reason = this.rejectionReason.trim();

    if (review.decision === 'REJECTED' && !reason) {
      this.reviewError = 'Please enter a rejection reason.';
      return;
    }

    this.reviewSaving = true;
    this.reviewError = '';

    this.organizationRequestService
      .submitDecision(review.request.id, review.decision, reason)
      .subscribe({
        next: () => {
          this.reviewSaving = false;
          this.closeReview();
          this.selectedFilter = review.decision;
          this.reviewNotice =
            `${review.request.organization_name} was ${review.decision.toLowerCase()}.`;
          this.loadRequests();
          this.changeDetectorRef.markForCheck();
        },
        error: err => {
          this.reviewSaving = false;
          const body = err.error;

          if (
            err.status === 400 &&
            body?.Error === 'This organization request has already been processed.'
          ) {
            this.closeReview();
            this.reviewNotice = 'This request has already been reviewed.';
            this.loadRequests();
          } else {
            this.reviewError =
              body?.rejection_reason?.[0] ||
              body?.non_field_errors?.[0] ||
              body?.Error ||
              body?.detail ||
              'Unable to save the decision. Please try again.';
          }

          this.changeDetectorRef.markForCheck();
        }
      });
  }

  formatReviewer(reviewer: number | string): string {
    return typeof reviewer === 'number' ? `User #${reviewer}` : reviewer;
  }
}