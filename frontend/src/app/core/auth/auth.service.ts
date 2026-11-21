import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, share, throwError } from 'rxjs';
import { catchError, finalize, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
}

export interface MessageResponse {
  message: string;
  email: string;
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  initials: string;
}

const ACCESS_TOKEN_KEY = 'hanaptracker.accessToken';
const REFRESH_TOKEN_KEY = 'hanaptracker.refreshToken';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly accessToken = signal<string | null>(null);
  private refreshToken: string | null = null;
  private refreshInFlight$: Observable<string> | null = null;
  private readonly currentUserSignal = signal<AuthUser | null>(null);

  readonly isAuthenticated = this.accessToken.asReadonly();
  readonly currentUser = this.currentUserSignal.asReadonly();

  constructor() {
    this.restoreSession();
  }

  getToken(): string | null {
    return this.accessToken();
  }

  setToken(token: string): void {
    this.accessToken.set(token);
    this.persist();
    this.currentUserSignal.set(this.userFromToken(token));
  }

  clearSession(): void {
    this.accessToken.set(null);
    this.refreshToken = null;
    this.currentUserSignal.set(null);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  register(email: string, password: string, displayName: string) {
    return this.http.post<MessageResponse>(`${environment.apiUrl}/auth/register`, {
      email,
      password,
      displayName,
    });
  }

  verifyEmail(token: string) {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/verify-email`, { token }).pipe(
      tap(response => this.applySession(response)),
    );
  }

  resendVerification(email: string) {
    return this.http.post<MessageResponse>(`${environment.apiUrl}/auth/resend-verification`, { email });
  }

  login(email: string, password: string) {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, { email, password }).pipe(
      tap(response => this.applySession(response)),
    );
  }

  refresh(): Observable<string> {
    if (!this.refreshToken) {
      return throwError(() => new Error('No refresh token is available'));
    }
    if (!this.refreshInFlight$) {
      const body = { refreshToken: this.refreshToken };
      this.refreshInFlight$ = this.http.post<AuthResponse>(`${environment.apiUrl}/auth/refresh`, body).pipe(
        tap(response => this.applySession(response)),
        map(response => response.accessToken),
        catchError(error => {
          this.clearSession();
          return throwError(() => error);
        }),
        finalize(() => {
          this.refreshInFlight$ = null;
        }),
        share(),
      );
    }
    return this.refreshInFlight$;
  }

  logout(): Observable<void> {
    const refreshToken = this.refreshToken;
    if (!refreshToken) {
      this.clearSession();
      return of(void 0);
    }
    return this.http.post<void>(`${environment.apiUrl}/auth/logout`, { refreshToken }).pipe(
      tap(() => this.clearSession()),
      catchError(() => {
        this.clearSession();
        return of(void 0);
      }),
    );
  }

  private applySession(response: AuthResponse): void {
    this.accessToken.set(response.accessToken);
    this.refreshToken = response.refreshToken;
    this.currentUserSignal.set(this.userFromToken(response.accessToken));
    this.persist();
  }

  private restoreSession(): void {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!accessToken || !refreshToken) {
      return;
    }
    this.accessToken.set(accessToken);
    this.refreshToken = refreshToken;
    this.currentUserSignal.set(this.userFromToken(accessToken));
  }

  private persist(): void {
    const accessToken = this.accessToken();
    if (accessToken && this.refreshToken) {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, this.refreshToken);
    }
  }

  private userFromToken(token: string): AuthUser | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) as {
        sub?: string;
        email?: string;
        displayName?: string;
      };
      const email = payload.email ?? '';
      const displayName = (payload.displayName?.trim() || this.displayNameFromEmail(email)).trim() || 'User';
      const initials = displayName
        .split(/\s+/)
        .filter(Boolean)
        .map(part => part.charAt(0))
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'U';
      return {
        id: payload.sub ?? '',
        email,
        displayName,
        initials,
      };
    } catch {
      return null;
    }
  }

  private displayNameFromEmail(email: string): string {
    const localPart = email.split('@')[0] || 'User';
    return localPart
      .split(/[._-]+/)
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
