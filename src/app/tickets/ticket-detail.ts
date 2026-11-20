import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, finalize, of, switchMap, tap } from 'rxjs';
import {HttpClient,HttpErrorResponse,HttpHeaders} from '@angular/common/http';
import {ChangeDetectorRef,Component,DestroyRef,OnInit,inject} from '@angular/core';
import { FormsModule } from '@angular/forms';


interface TicketEvent {
  id: number;
  performed_by: string | null;
  action: string;
  description: string | null;
  created_at: string;
}

interface TicketDetails {
  ticket_id: string;
  ticket_name: string;
  description: string | null;
  status: string;
  priority: string;
  category: string | null;
  created_at: string | null;
  updated_at: string | null;
  sla_resolution_due_date: string | null;
  requester: string | null;
  organization_name: string | null;
  team: string | number | null;
  comments: TicketEvent[];
  files: unknown[];
  ai_results: unknown[];
  activity: TicketEvent[];
}

type DetailTab = 'comments' | 'files' | 'ai' | 'activity';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [CommonModule, RouterLink,FormsModule],
  template: `
    <main class="detail-page">
      <a class="back-link" routerLink="/super-admin/tickets">
        ← Back to All Tickets
      </a>

      <p *ngIf="loading" role="status">Loading ticket…</p>
      <p *ngIf="error" class="detail-error" role="alert">{{ error }}</p>

      <div *ngIf="ticket as item" class="detail-grid">
        <div class="detail-main">
          <section class="detail-card">
            <p class="ticket-number">{{ item.ticket_id }}</p>
            <h1>{{ item.ticket_name }}</h1>

            <div class="badges">
              <span>{{ item.status | uppercase }}</span>
              <span>{{ item.priority | uppercase }}</span>
            </div>

            <p class="description">
              {{ item.description || 'No description provided.' }}
            </p>
          </section>

          <div class="detail-tabs" role="group" aria-label="Ticket information">
            <button type="button"
                    [attr.aria-pressed]="activeTab === 'comments'"
                    (click)="activeTab = 'comments'">
              Comments ({{ item.comments.length }})
            </button>

            <button type="button"
                    [attr.aria-pressed]="activeTab === 'files'"
                    (click)="activeTab = 'files'">
              Files ({{ item.files.length }})
            </button>

            <button type="button"
                    [attr.aria-pressed]="activeTab === 'ai'"
                    (click)="activeTab = 'ai'">
              AI ({{ item.ai_results.length }})
            </button>

            <button type="button"
                    [attr.aria-pressed]="activeTab === 'activity'"
                    (click)="activeTab = 'activity'">
              Activity ({{ item.activity.length }})
            </button>
          </div>

          <section *ngIf="activeTab === 'comments'" aria-label="Comments">
            <p *ngIf="!item.comments.length" class="detail-card muted">
              No comments yet.
            </p>

            <article *ngFor="let comment of item.comments"
                     class="detail-card event-card">
              <div class="event-heading">
                <strong>{{ comment.performed_by || 'Unknown author' }}</strong>
                <time [attr.datetime]="comment.created_at">
                  {{ comment.created_at | date:'medium' }}
                </time>
              </div>
              <p>{{ comment.description }}</p>
            </article>
            <form class="detail-card comment-form" (ngSubmit)="postComment()">
              <textarea
                name="comment"
                [(ngModel)]="commentText"
                aria-label="Add a comment"
                placeholder="Add a comment..."
                rows="4"
                [disabled]="postingComment"
                required
              ></textarea>

              <p *ngIf="commentError" class="detail-error" role="alert">
                {{ commentError }}
              </p>

              <button type="submit" [disabled]="postingComment || !commentText.trim()">
                {{ postingComment ? 'Posting…' : 'Post Comment' }}
              </button>
            </form>
          
          </section>

          <section *ngIf="activeTab === 'files'"
                   class="detail-card" aria-label="Files">
            <p class="muted">
              {{ item.files.length ? item.files.length + ' attachment(s).' : 'No files attached.' }}
            </p>
          </section>

          <section *ngIf="activeTab === 'ai'"
                   class="detail-card" aria-label="AI results">
            <p class="muted">
              {{ item.ai_results.length ? item.ai_results.length + ' AI result(s).' : 'No AI results yet.' }}
            </p>
          </section>

          <section *ngIf="activeTab === 'activity'" aria-label="Activity">
            <p *ngIf="!item.activity.length" class="detail-card muted">
              No activity yet.
            </p>

            <article *ngFor="let event of item.activity"
                     class="detail-card event-card">
              <div class="event-heading">
                <strong>{{ event.action }}</strong>
                <time [attr.datetime]="event.created_at">
                  {{ event.created_at | date:'medium' }}
                </time>
              </div>
              <p>{{ event.description }}</p>
              <small *ngIf="event.performed_by" class="muted">
                By {{ event.performed_by }}
              </small>
            </article>
          </section>
        </div>

        <aside class="detail-card">
          <h2>Details</h2>

          <dl>
            <div>
              <dt>Requester</dt>
              <dd>{{ item.requester || '—' }}</dd>
            </div>
            <div>
              <dt>Organization</dt>
              <dd>{{ item.organization_name || '—' }}</dd>
            </div>
            <div>
              <dt>Team</dt>
              <dd>{{ item.team ?? 'Unassigned' }}</dd>
            </div>
            <div>
              <dt>Category</dt>
              <dd>{{ item.category || '—' }}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{{ (item.created_at | date:'mediumDate') || '—' }}</dd>
            </div>
            <div>
              <dt>Updated</dt>
              <dd>{{ (item.updated_at | date:'mediumDate') || '—' }}</dd>
            </div>
            <div>
              <dt>SLA Resolution Due</dt>
              <dd>{{ (item.sla_resolution_due_date | date:'medium') || '—' }}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </main>
  `,
  styles: [`
    .detail-page {
      padding: 24px;
      color: #111827;
      font-family: Inter, Arial, sans-serif;
    }

    .back-link { color: #0f766e; }

    .detail-grid {
      display: grid;
      grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
      align-items: start;
      gap: 20px;
      margin-top: 18px;
    }

    .detail-main { min-width: 0; }

    .detail-card {
      padding: 22px;
      border: 1px solid #d8dee6;
      border-radius: 12px;
      background: #fff;
    }

    h1 { margin: 6px 0 12px; font-size: 24px; }
    h2 { margin: 0 0 10px; font-size: 18px; }
    .ticket-number, .muted, dt { color: #64748b; }
    .ticket-number, dl { margin: 0; }
    .detail-error { color: #991b1b; }

    .badges {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .badges span {
      padding: 4px 10px;
      border-radius: 999px;
      background: #e6f4f3;
      font-size: 12px;
    }

    .description, .event-card p {
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      line-height: 1.6;
    }

    dl div {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 0;
      border-bottom: 1px solid #e2e8f0;
    }

    dd {
      margin: 0;
      text-align: right;
      overflow-wrap: anywhere;
    }

    .detail-tabs {
      display: inline-flex;
      flex-wrap: wrap;
      gap: 4px;
      margin: 20px 0 14px;
      padding: 4px;
      border-radius: 8px;
      background: #e8edf1;
    }

    .detail-tabs button {
      padding: 8px 12px;
      border: 0;
      border-radius: 6px;
      background: transparent;
      color: #526176;
      font: inherit;
      cursor: pointer;
    }

    .detail-tabs button[aria-pressed="true"] {
      background: #fff;
      color: #111827;
      box-shadow: 0 1px 2px rgb(15 23 42 / 10%);
    }

    .event-card + .event-card { margin-top: 12px; }

    .event-heading {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 8px;
    }

    .event-heading time { color: #64748b; font-size: 13px; }
    .event-card p { margin: 10px 0 0; }

    .comment-form {
  display: grid;
  gap: 12px;
  margin-top: 16px;
}

.comment-form textarea {
  box-sizing: border-box;
  width: 100%;
  padding: 12px;
  border: 1px solid #d8dee6;
  border-radius: 8px;
  background: #f5f7f9;
  color: inherit;
  font: inherit;
  resize: vertical;
}

.comment-form button {
  justify-self: end;
  padding: 10px 16px;
  border: 0;
  border-radius: 8px;
  background: #137c73;
  color: #fff;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.comment-form button:disabled {
  opacity: 0.55;
  cursor: default;
}

    @media (max-width: 900px) {
      .detail-grid { grid-template-columns: minmax(0, 1fr); }
    }
  `]
})
export class TicketDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  ticket: TicketDetails | null = null;
  loading = true;
  error = '';
  activeTab: DetailTab = 'comments';
  commentText = '';
  postingComment = false;
  commentError = '';

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap((params) => {
        this.ticket = null;
        this.activeTab = 'comments';
        this.commentText = '';
        this.postingComment = false;
        this.commentError = '';
        this.loading = true;
        this.error = '';

        const id = params.get('id');
        const token = localStorage.getItem('access_token');

        if (!id || !/^[1-9]\d*$/.test(id)) {
          this.error = 'Invalid ticket ID.';
          return of(null);
        }

        if (!token) {
          this.error = 'Please log in again.';
          return of(null);
        }

        const headers = new HttpHeaders({
          Authorization: `Bearer ${token}`
        });

        return this.http.get<TicketDetails>(
          `http://127.0.0.1:8000/api/v1/super_admin_dashboard/tickets/${id}/`,
          { headers }
        ).pipe(
          catchError((error: HttpErrorResponse) => {
            this.error = this.getErrorMessage(error);
            return of(null);
          })
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((ticket) => {
      this.ticket = ticket;
      this.loading = false;
      this.cdr.markForCheck();
    });
  }
postComment(): void {
  const ticket = this.ticket;
  const id = this.route.snapshot.paramMap.get('id');
  const comment = this.commentText.trim();

  if (!ticket || !id || !comment || this.postingComment) {
    return;
  }

  const token = localStorage.getItem('access_token');

  if (!token) {
    this.commentError = 'Please log in again to post a comment.';
    return;
  }

  const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
  const apiUrl = 'http://127.0.0.1:8000/api/v1';

  this.commentError = '';
  this.postingComment = true;

  this.http.post(
    `${apiUrl}/tickets/${id}/comments/`,
    { comment },
    { headers }
  ).pipe(
    tap(() => {
      if (this.ticket === ticket) {
        this.commentText = '';
      }
    }),
    switchMap(() =>
      this.http.get<TicketDetails>(
        `${apiUrl}/super_admin_dashboard/tickets/${id}/`,
        { headers }
      ).pipe(
        catchError(() => {
          if (this.ticket === ticket) {
            this.commentError =
              'Comment saved. Reload the page to see it.';
          }
          return of(null);
        })
      )
    ),
    takeUntilDestroyed(this.destroyRef),
    finalize(() => {
      if (this.ticket === ticket) {
        this.postingComment = false;
        this.cdr.markForCheck();
      }
    })
  ).subscribe({
    next: (updatedTicket) => {
      if (updatedTicket && this.ticket === ticket) {
        this.postingComment = false;
        this.ticket = updatedTicket;
        this.cdr.markForCheck();
      }
    },
    error: (error: HttpErrorResponse) => {
      if (this.ticket === ticket) {
        this.commentError =
          error.error?.Error ||
          error.error?.detail ||
          'Unable to post the comment. Please try again.';
      }
    }
  });
}
  private getErrorMessage(error: HttpErrorResponse): string {
    switch (error.status) {
      case 0:
        return 'Cannot connect to Django. Check that the backend is running.';
      case 401:
        return 'Please log in again.';
      case 403:
        return 'You do not have permission to view this ticket.';
      case 404:
        return 'Ticket not found.';
      default:
        return 'Unable to load ticket details.';
    } 
}
  }
