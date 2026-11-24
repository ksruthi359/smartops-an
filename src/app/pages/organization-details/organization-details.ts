import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import {
  forkJoin,
  switchMap,
  map,
  catchError,
  startWith,
  of
} from 'rxjs';

import {
  Organization,
  OrganizationService,
  OrganizationUser,
  OrganizationTicket
} from '../../services/organization';

interface UserDetails extends OrganizationUser {
  raisedTickets: OrganizationTicket[];
  assignedTickets: OrganizationTicket[];
  resolvedCount: number;
  pendingCount: number;
}

interface PageData {
  organization: Organization | null;
  users: UserDetails[];
  tickets: OrganizationTicket[];
  usernames: Record<number, string>;
  ticketStatuses: Record<string, number>;
  totalUsers: number;
  activeUsers: number;
  totalTickets: number;
  assignedTickets: number;
  unassignedTickets: number;
  openTickets: number;
  loading: boolean;
  error: string;
}

@Component({
  selector: 'app-organization-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './organization-details.html',
  styleUrl: './organization-details.css'
})
export class OrganizationDetails {

  private route = inject(ActivatedRoute);
  private organizationService = inject(OrganizationService);

  activeTab: 'overview' | 'users' | 'tickets' | 'workload' =
    'overview';

  userSearch = '';
  ticketSearch = '';
  statusFilter = '';
  priorityFilter = '';
  assignmentFilter = '';

  selectedUser: UserDetails | null = null;

  private emptyPage: PageData = {
    organization: null,
    users: [],
    tickets: [],
    usernames: {},
    ticketStatuses: {},
    totalUsers: 0,
    activeUsers: 0,
    totalTickets: 0,
    assignedTickets: 0,
    unassignedTickets: 0,
    openTickets: 0,
    loading: false,
    error: ''
  };

  // Load organization, users and tickets

  page$ = this.route.paramMap.pipe(

    switchMap(params => {

      const id = Number(params.get('id'));

      this.activeTab = 'overview';
      this.selectedUser = null;
      this.userSearch = '';
      this.ticketSearch = '';
      this.statusFilter = '';
      this.priorityFilter = '';
      this.assignmentFilter = '';

      if (!Number.isSafeInteger(id) || id <= 0) {
        return of({
          ...this.emptyPage,
          error: 'Invalid organization ID.'
        });
      }

      return forkJoin({

        organizations:
          this.organizationService.getOrganizations(),

        users:
          this.organizationService.getUsers(),

        ticketResponse:
          this.organizationService.getAllTickets()

      }).pipe(

        map(({ organizations, users, ticketResponse }): PageData => {

          // Selected organization

          const organization = organizations.find(
            item => item.id === id
          ) ?? null;

          if (!organization) {
            return {
              ...this.emptyPage,
              error: 'Organization not found.'
            };
          }

          // Users API response

          const allUsers = Array.isArray(users)
            ? users
            : users.results;

          const organizationUsers = allUsers.filter(
            user => user.organization_id === id
          );

          // Selected organization tickets

          const organizationTickets = ticketResponse.Data.filter(
            ticket => ticket.organization_id === id
          );

          const usernames: Record<number, string> = {};

          allUsers.forEach(user => {
            usernames[user.id] = user.username;
          });

          // User-wise raised and assigned tickets

          const userDetails: UserDetails[] =
            organizationUsers.map(user => {

              const raisedTickets =
                organizationTickets.filter(
                  ticket => ticket.created_by_id === user.id
                );

              const assignedTickets =
                organizationTickets.filter(
                  ticket => ticket.assigned_to === user.id
                );

              return {
                ...user,
                raisedTickets,
                assignedTickets,

                resolvedCount: assignedTickets.filter(
                  ticket =>
                    ticket.status === 'Resolved' ||
                    ticket.status === 'Closed'
                ).length,

                pendingCount: assignedTickets.filter(
                  ticket =>
                    !['Resolved', 'Closed', 'Invalid']
                      .includes(ticket.status)
                ).length
              };

            });

          // Ticket status summary

          const ticketSummary =
            ticketResponse['Organization Breakdown'].find(
              item => item['Organization ID'] === id
            );

          return {
            organization,
            users: userDetails,
            tickets: organizationTickets,
            usernames,

            ticketStatuses:
              ticketSummary?.['Status Breakdown'] ?? {},

            totalUsers: userDetails.length,

            activeUsers: userDetails.filter(
              user => user.is_active
            ).length,

            totalTickets: organizationTickets.length,

            assignedTickets: organizationTickets.filter(
              ticket => ticket.assigned_to !== null
            ).length,

            unassignedTickets: organizationTickets.filter(
              ticket => ticket.assigned_to === null
            ).length,

            openTickets: organizationTickets.filter(
              ticket => ticket.status === 'Open'
            ).length,

            loading: false,
            error: ''
          };

        }),

        startWith({
          ...this.emptyPage,
          loading: true
        }),

        catchError(err => {

          console.error('Organization details error:', err);

          return of({
            ...this.emptyPage,
            error: 'Unable to load organization details.'
          });

        })

      );

    })

  );

  // Search users

  filterUsers(users: UserDetails[]): UserDetails[] {

    const search = this.userSearch.trim().toLowerCase();

    return users.filter(user =>

      [
        user.username,
        user.first_name,
        user.last_name,
        user.email,
        user.role
      ].join(' ').toLowerCase().includes(search)

    );

  }

  // Search and filter tickets

  filterTickets(
    tickets: OrganizationTicket[],
    usernames: Record<number, string>
  ): OrganizationTicket[] {

    const search = this.ticketSearch.trim().toLowerCase();

    return tickets.filter(ticket => {

      const matchesSearch = [

        ticket.ticket_id,
        ticket.ticket_name,
        this.getUsername(ticket.created_by_id, usernames),
        this.getUsername(ticket.assigned_to, usernames)

      ].join(' ').toLowerCase().includes(search);

      const matchesStatus =
        !this.statusFilter ||
        ticket.status === this.statusFilter;

      const matchesPriority =
        !this.priorityFilter ||
        ticket.priority === this.priorityFilter;

      const matchesAssignment =
        !this.assignmentFilter ||
        (
          this.assignmentFilter === 'assigned' &&
          ticket.assigned_to !== null
        ) ||
        (
          this.assignmentFilter === 'unassigned' &&
          ticket.assigned_to === null
        );

      return matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesAssignment;

    });

  }

  // Get username from user ID

  getUsername(
    id: number | null,
    usernames: Record<number, string>
  ): string {

    if (id === null) {
      return '—';
    }

    return usernames[id] || `User #${id}`;

  }

  // Get team members

  getTeamMembers(users: UserDetails[]): UserDetails[] {

    return users.filter(
      user => user.role === 'Team Member'
    );

  }

  // Open user information popup

  viewUser(user: UserDetails): void {

    this.selectedUser = user;

  }

  // Close user information popup

  closeUser(): void {

    this.selectedUser = null;

  }

  // Open tickets tab with filter

  openTickets(assignment = '', status = ''): void {

    this.activeTab = 'tickets';

    this.assignmentFilter = assignment;
    this.statusFilter = status;
    this.priorityFilter = '';
    this.ticketSearch = '';

  }

}