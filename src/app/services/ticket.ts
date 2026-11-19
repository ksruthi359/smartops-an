import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Ticket {
  id: number;
  ticket_id: string;
  ticket_name: string;
  description: string;
  summary: string;
  category: string;
  priority: string;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class TicketService {

  private apiUrl = 'http://127.0.0.1:8000/api/v1/tickets/';

  constructor(private http: HttpClient) {}

  getTickets(): Observable<Ticket[]> {

    const token = localStorage.getItem('access_token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.get<Ticket[]>(this.apiUrl, { headers });
  }
}