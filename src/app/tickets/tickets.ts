import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TicketService, Ticket } from '../services/ticket';

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tickets.html',
  styleUrl: './tickets.css'
})
export class Tickets implements OnInit {

  tickets: Ticket[] = [];
  loading = false;
  error = '';

  constructor(
    private ticketService: TicketService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadTickets();
  }

  loadTickets(): void {
    this.loading = true;
    this.error = '';

    this.ticketService.getTickets().subscribe({

      next: (data: Ticket[]) => {

        console.log('Tickets received:', data);

        this.tickets = data;
        this.loading = false;

        this.cdr.detectChanges();
      },

      error: (err: any) => {

        console.error('Ticket API error:', err);

        this.error = 'Unable to load tickets.';
        this.loading = false;

        this.cdr.detectChanges();
      }

    });
  }
}