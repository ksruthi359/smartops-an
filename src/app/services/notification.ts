
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { forkJoin, map, Observable } from 'rxjs';

export interface DeliveryRecord {
  id: number;
  event_type: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  attempt_count: number;
  created_at: string;
  delivered_at?: string | null;
  subject?: string;
  message?: string;
  error_message?: string;
  response_body?: string;
  payload?: Record<string, unknown>;
}

export interface NotificationItem {
  id: number;
  channel: 'Email' | 'Webhook';
  title: string;
  message: string;
  eventType: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  timestamp: string;
  ticketId: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly apiUrl = 'http://127.0.0.1:8000/api/v1';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');

    return new HttpHeaders({
      Authorization: `Bearer ${token ?? ''}`
    });
  }

  getNotifications(): Observable<NotificationItem[]> {
    return forkJoin({
      emails: this.http.get<DeliveryRecord[]>(
        `${this.apiUrl}/email-deliveries/`,
        { headers: this.getHeaders() }
      ),
      webhooks: this.http.get<DeliveryRecord[]>(
        `${this.apiUrl}/webhook-deliveries/`,
        { headers: this.getHeaders() }
      )
    }).pipe(
      map(({ emails, webhooks }) =>
        [
          ...emails.map(item => this.convert(item, 'Email')),
          ...webhooks.map(item => this.convert(item, 'Webhook'))
        ].sort(
          (a, b) =>
            new Date(b.timestamp).getTime() -
            new Date(a.timestamp).getTime()
        )
      )
    );
  }

  retryNotification(item: NotificationItem): Observable<unknown> {
    const endpoint =
      item.channel === 'Email'
        ? 'email-deliveries'
        : 'webhook-deliveries';

    return this.http.post(
      `${this.apiUrl}/${endpoint}/${item.id}/retry/`,
      {},
      { headers: this.getHeaders() }
    );
  }

  private convert(
    record: DeliveryRecord,
    channel: 'Email' | 'Webhook'
  ): NotificationItem {
    const payload = record.payload ?? {};

    const ticketId = String(
      payload['ticket_id'] ??
      payload['ticket_number'] ??
      ''
    );

    const event = (record.event_type || 'Notification')
      .replace(/[_.]/g, ' ');

    return {
      id: record.id,
      channel,
      title:
        record.subject ||
        (ticketId
          ? `Ticket ${ticketId}: ${event}`
          : `${event} notification`),
      message:
        record.message ||
        record.error_message ||
        record.response_body ||
        `${event} via ${channel}`,
      eventType: record.event_type,
      status: record.status,
      timestamp: record.created_at,
      ticketId
    };
  }
}
