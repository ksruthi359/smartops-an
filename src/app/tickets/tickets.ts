import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Ticket, TicketService } from '../services/ticket';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule,RouterLink],
  templateUrl: './tickets.html',
  styleUrl: './tickets.css'
})
export class Tickets implements OnInit {
  tickets: Ticket[] = [];
  loading = false;
  error = '';

  searchTerm = '';
  selectedOrganization = '';
  selectedStatus = '';
  selectedPriority = '';

  organizationOptions: string[] = [];
  statusOptions: string[] = [];
  priorityOptions: string[] = [];

  constructor(
    private readonly ticketService: TicketService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadTickets();
  }

  get filteredTickets(): Ticket[] {
    const query = this.searchTerm.trim().toLowerCase();

    return this.tickets.filter((ticket) => {
      const matchesSearch = !query || [
        ticket.ticket_id,
        ticket.ticket_name,
        ticket.organization_name,
        ticket.requester
      ].some((value) => String(value ?? '').toLowerCase().includes(query));

      const matchesOrganization =
        !this.selectedOrganization ||
        ticket.organization_name === this.selectedOrganization;

      const matchesStatus =
        !this.selectedStatus ||
        this.statusKey(ticket.status) === this.selectedStatus;

      const matchesPriority =
        !this.selectedPriority ||
        this.priorityKey(ticket.priority) === this.selectedPriority;

      return matchesSearch && matchesOrganization &&
        matchesStatus && matchesPriority;
    });
  }

  loadTickets(): void {
    if (this.loading) {
      return;
    }

    this.loading = true;
    this.error = '';

    this.ticketService.getSuperAdminTickets().subscribe({
      next: (tickets) => {
        this.loading = false;

        if (Array.isArray(tickets)) {
          this.tickets = tickets;
          this.updateFilterOptions();
        } else {
          this.error = 'Unexpected response from the tickets API.';
        }

        this.cdr.detectChanges();
      },
      error: (error: unknown) => {
        this.loading = false;
        this.error = this.getErrorMessage(error);
        this.cdr.detectChanges();
      }
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedOrganization = '';
    this.selectedStatus = '';
    this.selectedPriority = '';
  }

  statusKey(status: string | null | undefined): string {
    return (status ?? '').trim().toLowerCase().replace(/[\s_]+/g, '-');
  }

  priorityKey(priority: string | null | undefined): string {
    return (priority ?? '').trim().toLowerCase();
  }

  statusLabel(status: string | null | undefined): string {
    return this.statusKey(status).replace(/-/g, ' ').toUpperCase() || '—';
  }

  priorityLabel(priority: string | null | undefined): string {
    return this.priorityKey(priority).toUpperCase() || '—';
  }

  trackByTicket(_index: number, ticket: Ticket): number {
    return ticket.id;
  }

  private updateFilterOptions(): void {
    this.organizationOptions = this.uniqueOptions(
      this.tickets.map((ticket) => ticket.organization_name)
    );
    this.statusOptions = this.uniqueOptions(
      this.tickets.map((ticket) => this.statusKey(ticket.status))
    );
    this.priorityOptions = this.uniqueOptions(
      this.tickets.map((ticket) => this.priorityKey(ticket.priority))
    );

    if (!this.organizationOptions.includes(this.selectedOrganization)) {
      this.selectedOrganization = '';
    }

    if (!this.statusOptions.includes(this.selectedStatus)) {
      this.selectedStatus = '';
    }

    if (!this.priorityOptions.includes(this.selectedPriority)) {
      this.selectedPriority = '';
    }
  }

  private uniqueOptions(values: (string | null)[]): string[] {
    const populatedValues = values.filter(
      (value): value is string => Boolean(value)
    );

    return [...new Set(populatedValues)].sort((a, b) => a.localeCompare(b));
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      switch (error.status) {
        case 0:
          return 'Cannot connect to Django. Check that the backend is running.';
        case 401:
          return 'Your session has expired. Please log in again.';
        case 403:
          return 'You do not have permission to view tickets across organizations.';
        case 404:
          return 'The Super Admin tickets endpoint was not found.';
        default:
          return 'Unable to load tickets.';
      }
    }

    return error instanceof Error ? error.message : 'Unable to load tickets.';
  }
}