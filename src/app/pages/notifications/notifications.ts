import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  NotificationItem,
  NotificationService
} from '../../services/notification';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notifications.html',
  styleUrl: './notifications.css'
})
export class Notifications implements OnInit {

  notifications: NotificationItem[] = [];
  loading = false;
  error = '';

  channelFilter = 'All Channels';
  statusFilter = 'All';

  // Frontend-only read/unread tracking
  readNotificationIds = new Set<string>();

  constructor(
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.loading = true;
    this.error = '';

    this.notificationService.getNotifications().subscribe({
      next: (data: NotificationItem[]) => {
        console.log('Notifications received:', data);

        this.notifications = data;
        this.loading = false;

        this.cdr.detectChanges();
      },

      error: (err: any) => {
        console.error('Notifications loading error:', err);

        this.error =
          'Unable to load notifications. Please check the backend and login token.';

        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Filter notifications
  get filteredNotifications(): NotificationItem[] {
    return this.notifications.filter(item => {
      const channelMatches =
        this.channelFilter === 'All Channels' ||
        item.channel === this.channelFilter;

      const statusMatches =
        this.statusFilter === 'All' ||
        item.status === this.statusFilter;

      return channelMatches && statusMatches;
    });
  }

  // Display delivery status
  statusLabel(status: string): string {
    if (status === 'SUCCESS') return 'Sent';
    if (status === 'FAILED') return 'Failed';
    return 'Pending';
  }
  
getDisplayTitle(item: NotificationItem): string {
  const title = (item.title || '')
    .replace(/^SmartOps\s*-\s*/i, '')
    .trim();

  const match = title.match(
    /^(TICKET_[A-Z_]+)\s*-\s*(TKT?-\d+)$/i
  );

  if (!match) {
    return title;
  }

  const event = match[1].toUpperCase();
  const ticketId = match[2];

  const messages: Record<string, string> = {
    TICKET_CREATED: `New ticket ${ticketId} created`,
    TICKET_UPDATED: `Ticket ${ticketId} has been updated`,
    TICKET_ASSIGNED: `Ticket ${ticketId} has been assigned`,
    TICKET_REOPENED: `Ticket ${ticketId} has been reopened`,
    TICKET_RESOLVED: `Ticket ${ticketId} has been resolved`,
    TICKET_CLOSED: `Ticket ${ticketId} has been closed`
  };

  return messages[event] || title;
}


  // Unique key for read tracking
  private notificationKey(item: NotificationItem): string {
    return `${item.channel}-${item.id}`;
  }

  // Unread notification count
  get unreadCount(): number {
    return this.notifications.filter(
      item => !this.isRead(item)
    ).length;
  }

  // Check whether notification is read
  isRead(item: NotificationItem): boolean {
    return this.readNotificationIds.has(
      this.notificationKey(item)
    );
  }

  // Mark individual notification as read
  markAsRead(item: NotificationItem): void {
    this.readNotificationIds.add(
      this.notificationKey(item)
    );
  }

  // Mark all notifications as read
  markAllRead(): void {
    this.notifications.forEach(item => {
      this.markAsRead(item);
    });
  }

  // Clean HTML email content for compact cards
  getCleanMessage(message: string | null | undefined): string {
    if (!message) return '';

    // Extract the meaningful ticket event message
    // from the HTML email template.
    const eventMessage = message.match(
      /<strong>\s*Message\s*<\/strong>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i
    );

    if (eventMessage) {
      return this.stripHtml(eventMessage[1]);
    }

    // Fallback: convert HTML to plain text
    const text = this.stripHtml(message);

    // Prefer a short ticket event sentence
    const ticketMessage = text.match(
      /Ticket\s+[A-Z]+-\d+[^.!?]*[.!?]/i
    );

    if (ticketMessage) {
      return ticketMessage[0].trim();
    }

    return text.length > 150
      ? text.substring(0, 150).trim() + '...'
      : text;
  }

  // Remove HTML tags without rendering HTML
  private stripHtml(value: string): string {
    return value
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Retry failed deliveries
  retryNotification(item: NotificationItem): void {
    if (item.status !== 'FAILED') return;

    this.notificationService.retryNotification(item).subscribe({
      next: () => {
        this.loadNotifications();
      },

      error: (err: any) => {
        console.error('Retry error:', err);
        this.error = 'Failed to retry delivery.';
        this.cdr.detectChanges();
      }
    });
  }
}
