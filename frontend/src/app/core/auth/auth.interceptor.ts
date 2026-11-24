import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

const AUTH_ENDPOINT =
  /\/auth\/(login|register|refresh|verify-email|resend-verification|forgot-password|reset-password)\/?$/;

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const isAuthEndpoint = AUTH_ENDPOINT.test(request.url);

  // Never send Bearer tokens to public auth routes — an expired JWT makes Spring return 401
  // before the controller runs when the resource-server filter is on the same chain.
  let outgoing = request;
  if (isAuthEndpoint) {
    if (request.headers.has('Authorization')) {
      outgoing = request.clone({ headers: request.headers.delete('Authorization') });
    }
  } else {
    const token = auth.getToken();
    if (token) {
      outgoing = request.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
    }
  }

  return next(outgoing).pipe(
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
