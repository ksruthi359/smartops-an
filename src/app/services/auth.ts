import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, switchMap, tap } from 'rxjs';

export interface UserInformation {
  'User Id': number;
  Username: string;
  Role: string;
  'Is SuperUser'?: boolean;
  'Is Superuser'?: boolean;
  'Session Id'?: number;
  'Organization Id'?: number | null;
  Organization?: {
    'Organization Id': number;
    'Organization Name': string;
    Slug: string;
    Is_Active?: boolean;
    AI_Enabled?: boolean;
  } | null;
}

interface CredentialsResponse {
  Message: string;
  'User Information': UserInformation;
  'Confirmation Token': string;
}

export interface LoginResponse {
  Message?: string;
  'User Information': UserInformation;
  Access: string;
  Refresh?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl =
    'http://127.0.0.1:8000/api/v1/auth';

  constructor(private http: HttpClient) {}
login(
  username: string,
  password: string
): Observable<LoginResponse> {
  return this.http.post<CredentialsResponse>(
    `${this.apiUrl}/login/`,
    { username, password }
  ).pipe(
    switchMap((credentials) => {
      const confirmationToken =
        credentials['Confirmation Token'];

      if (!confirmationToken) {
        throw new Error('Login confirmation token is missing.');
      }

      return this.http.post<LoginResponse>(
        `${this.apiUrl}/session/confirm/`,
        { confirmation_token: confirmationToken }
      ).pipe(
        map((response): LoginResponse => ({
          ...response,
          'User Information': {
            ...credentials['User Information'],
            ...response['User Information'],
            Organization:
              response['User Information'].Organization ??
              credentials['User Information'].Organization
          }
        }))
      );
    }),
    tap((response) => {
      if (!response.Access) {
        throw new Error('Access token is missing.');
      }

      localStorage.setItem('access_token', response.Access);

      if (response.Refresh) {
        localStorage.setItem('refresh_token', response.Refresh);
      } else {
        localStorage.removeItem('refresh_token');
      }

      localStorage.setItem(
        'user',
        JSON.stringify(response['User Information'])
      );
    })
  );
}
  getAccessToken(): string | null {
    const token = localStorage.getItem('access_token');

    if (
      !token ||
      token === 'undefined' ||
      token === 'null'
    ) {
      return null;
    }

    return token;
  }

  getUser(): UserInformation | null {
    const user = localStorage.getItem('user');

    if (!user) {
      return null;
    }

    try {
      return JSON.parse(user) as UserInformation;
    } catch {
      return null;
    }
  }
 
  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }

  isLoggedIn(): boolean {
    return !!this.getAccessToken();
  }
}