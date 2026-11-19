import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  OrganizationRequest,
  OrganizationRequestService
} from '../../services/organization-request';

@Component({
  selector: 'app-org-requests',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './org-requests.html',
  styleUrl: './org-requests.css'
})
export class OrgRequests implements OnInit {

  /* =========================
     REQUEST DATA
  ========================= */

  requests: OrganizationRequest[] = [];

  selectedFilter:
    'All' |
    'Pending' |
    'Approved' |
    'Rejected' = 'Pending';


  /* =========================
     PAGE STATE
  ========================= */

  loading = false;
  error = '';


  /* =========================
     APPROVE MODAL
  ========================= */

  showApproveModal = false;
  approvalNotes = '';


  /* =========================
     REJECT MODAL
  ========================= */

  showRejectModal = false;
  rejectionNotes = '';


  /* =========================
     SELECTED REQUEST
  ========================= */

  selectedRequest: OrganizationRequest | null = null;


  constructor(
    private organizationRequestService: OrganizationRequestService
  ) {}


  /* =========================
     INITIAL LOAD
  ========================= */

  ngOnInit(): void {
    this.loadRequests();
  }


  /* =========================
     LOAD REQUESTS
  ========================= */

  loadRequests(): void {

    this.loading = true;
    this.error = '';

    this.organizationRequestService.getRequests().subscribe({

      next: (data) => {

        this.requests = data;

        this.loading = false;

      },

      error: (err) => {

        console.error(
          'Organization request API error:',
          err
        );

        this.error =
          'Unable to load organization requests.';

        this.loading = false;

      }

    });
  }


  /* =========================
     FILTER REQUESTS
  ========================= */

  get filteredRequests(): OrganizationRequest[] {

    if (this.selectedFilter === 'All') {
      return this.requests;
    }

    return this.requests.filter(
      request =>
        request.status === this.selectedFilter
    );
  }


  /* =========================
     CHANGE FILTER
  ========================= */

  setFilter(
    filter:
      'All' |
      'Pending' |
      'Approved' |
      'Rejected'
  ): void {

    this.selectedFilter = filter;

  }


  /* =========================
     REQUEST COUNTS
  ========================= */

  getCount(
    status:
      'All' |
      'Pending' |
      'Approved' |
      'Rejected'
  ): number {

    if (status === 'All') {
      return this.requests.length;
    }

    return this.requests.filter(
      request =>
        request.status === status
    ).length;
  }


  /* =========================
     OPEN APPROVE MODAL
  ========================= */

  approveRequest(
    request: OrganizationRequest
  ): void {

    this.selectedRequest = request;

    this.approvalNotes = '';

    this.showApproveModal = true;

  }


  /* =========================
     CANCEL APPROVAL
  ========================= */

  cancelApproval(): void {

    this.showApproveModal = false;

    this.selectedRequest = null;

    this.approvalNotes = '';

  }


  /* =========================
     CONFIRM APPROVAL
  ========================= */

  confirmApproval(): void {

    if (!this.selectedRequest) {
      return;
    }

    /*
      Backend API will be connected here later.

      For now we update the frontend state only.
    */

    this.selectedRequest.status = 'Approved';

    console.log(
      'Approval confirmed:',
      {
        request: this.selectedRequest,
        notes: this.approvalNotes
      }
    );

    this.showApproveModal = false;

    this.selectedRequest = null;

    this.approvalNotes = '';

  }


  /* =========================
     OPEN REJECT MODAL
  ========================= */

  rejectRequest(
    request: OrganizationRequest
  ): void {

    this.selectedRequest = request;

    this.rejectionNotes = '';

    this.showRejectModal = true;

  }


  /* =========================
     CANCEL REJECTION
  ========================= */

  cancelRejection(): void {

    this.showRejectModal = false;

    this.selectedRequest = null;

    this.rejectionNotes = '';

  }


  /* =========================
     CONFIRM REJECTION
  ========================= */

  confirmRejection(): void {

    if (!this.selectedRequest) {
      return;
    }

    /*
      Backend API will be connected here later.

      For now we update the frontend state only.
    */

    this.selectedRequest.status = 'Rejected';

    console.log(
      'Rejection confirmed:',
      {
        request: this.selectedRequest,
        notes: this.rejectionNotes
      }
    );

    this.showRejectModal = false;

    this.selectedRequest = null;

    this.rejectionNotes = '';

  }

}