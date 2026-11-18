import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const isAuthEndpoint = /\/auth\/(login|register|refresh)$/.test(request.url);

  const token = auth.getToken();
  const authenticatedRequest = token && !isAuthEndpoint
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(authenticatedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || isAuthEndpoint || request.url.includes('/auth/logout')) {
        return throwError(() => error);
      }

      return auth.refresh().pipe(
        switchMap(accessToken => next(request.clone({
          setHeaders: { Authorization: `Bearer ${accessToken}` },
        }))),
        catchError(refreshError => {
          auth.clearSession();
          void router.navigateByUrl('/login');
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
