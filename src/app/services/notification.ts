import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, forkJoin, map, Observable, tap } from 'rxjs';

import { AuthService } from './auth';

export interface InboxNotification {
  id: number;
  title: string;
  message: string;
  ticket: string;
  channel: string;
  created_at: string;
  is_read: boolean;
}

interface InboxApiRecord {
  id: number;
  title: string;
  description: string;
  ticket: string;
  channel: string;
  created_at: string;
  read: boolean;
}

interface InboxPage {
  results: InboxApiRecord[];
}

interface MarkReadResponse {
  id: number;
  is_read: boolean;
  message: string;
}

interface MarkAllReadResponse {
  updated_count: number;
  message: string;
}

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
  providedIn: 'root',
})
export class NotificationService {
  private readonly apiUrl = 'http://127.0.0.1:8000/api/v1';

  private readonly unreadCountSubject = new BehaviorSubject<number>(0);
  readonly unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService,
  ) {}

  getInboxNotifications(): Observable<InboxNotification[]> {
    return this.http.get<InboxApiRecord[] | InboxPage>(
      `${this.apiUrl}/notifications/`,
      { headers: this.getHeaders() },
    ).pipe(
      map(response => Array.isArray(response) ? response : response.results),
      map(rows => rows.map((row): InboxNotification => ({
        id: row.id,
        title: row.title,
        message: row.description,
        ticket: row.ticket,
        channel: row.channel,
        created_at: row.created_at,
        is_read: row.read,
      }))),
      tap(notifications => {
        const unreadCount = notifications.filter(item => !item.is_read).length;
        this.unreadCountSubject.next(unreadCount);
      }),
    );
  }

  markAsRead(id: number): Observable<MarkReadResponse> {
    return this.http.post<MarkReadResponse>(
      `${this.apiUrl}/notifications/${id}/read/`,
      {},
      { headers: this.getHeaders() },
    );
  }

  markAllAsRead(): Observable<MarkAllReadResponse> {
    return this.http.post<MarkAllReadResponse>(
      `${this.apiUrl}/notifications/mark-all-read/`,
      {},
      { headers: this.getHeaders() },
    );
  }

  getNotifications(): Observable<NotificationItem[]> {
    const headers = this.getHeaders();

    return forkJoin({
      emails: this.http.get<DeliveryRecord[]>(
        `${this.apiUrl}/email-deliveries/`,
        { headers },
      ),
      webhooks: this.http.get<DeliveryRecord[]>(
        `${this.apiUrl}/webhook-deliveries/`,
        { headers },
      ),
    }).pipe(
      map(({ emails, webhooks }) => [
        ...emails.map(record => this.convert(record, 'Email')),
        ...webhooks.map(record => this.convert(record, 'Webhook')),
      ].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )),
    );
  }

  retryNotification(item: NotificationItem): Observable<unknown> {
    const endpoint =
      item.channel === 'Email' ? 'email-deliveries' : 'webhook-deliveries';

    return this.http.post(
      `${this.apiUrl}/${endpoint}/${item.id}/retry/`,
      {},
      { headers: this.getHeaders() },
    );
  }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getAccessToken();

    return token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();
  }

  private convert(
    record: DeliveryRecord,
    channel: NotificationItem['channel'],
  ): NotificationItem {
    const payload = record.payload ?? {};
    const ticketId = String(payload['ticket_id'] ?? payload['ticket_number'] ?? '');
    const event = (record.event_type || 'Notification').replace(/[_.]/g, ' ');

    return {
      id: record.id,
      channel,
      title: record.subject ||
        (ticketId ? `Ticket ${ticketId}: ${event}` : `${event} notification`),
      message: record.message ||
        record.error_message ||
        record.response_body ||
        `${event} via ${channel}`,
      eventType: record.event_type,
      status: record.status,
      timestamp: record.created_at,
      ticketId,
    };
  }
}