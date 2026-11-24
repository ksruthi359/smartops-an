import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';

import {
  InboxNotification,
  NotificationService,
} from '../../services/notification';

type ReadFilter = 'all' | 'unread' | 'read';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notifications.html',
  styleUrl: './notifications.css',
})
export class Notifications implements OnInit {
  notifications: InboxNotification[] = [];
  readFilter: ReadFilter = 'all';
  loading = false;
  markingRead = false;
  error = '';

  constructor(
    private readonly notificationService: NotificationService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  get unreadCount(): number {
    return this.notifications.filter(item => !item.is_read).length;
  }

  get filteredNotifications(): InboxNotification[] {
    if (this.readFilter === 'all') {
      return this.notifications;
    }

    const shouldBeRead = this.readFilter === 'read';
    return this.notifications.filter(item => item.is_read === shouldBeRead);
  }

  loadNotifications(): void {
    if (this.loading || this.markingRead) {
      return;
    }

    this.loading = true;
    this.error = '';

    this.notificationService.getInboxNotifications().subscribe({
      next: notifications => {
        this.notifications = notifications;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.error = 'Unable to load notifications. Please try again.';
        this.cdr.markForCheck();
      },
    });
  }

  markAsRead(item: InboxNotification): void {
    if (item.is_read || this.loading || this.markingRead) {
      return;
    }

    this.saveReadState(
      this.notificationService.markAsRead(item.id),
      'Unable to mark this notification as read.',
    );
  }

  markAllRead(): void {
    if (this.loading || this.markingRead || this.unreadCount === 0) {
      return;
    }

    this.saveReadState(
      this.notificationService.markAllAsRead(),
      'Unable to mark all notifications as read.',
    );
  }

  private saveReadState(
    request: Observable<unknown>,
    errorMessage: string,
  ): void {
    this.markingRead = true;
    this.error = '';

    request.subscribe({
      next: () => {
        this.markingRead = false;
        this.loadNotifications();
        this.cdr.markForCheck();
      },
      error: () => {
        this.markingRead = false;
        this.error = errorMessage;
        this.cdr.markForCheck();
      },
    });
  }
}