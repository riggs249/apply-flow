import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('authGuard', () => {
  it('allows activation when an access token is present', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { isAuthenticated: () => 'access-token' } },
        { provide: Router, useValue: { parseUrl: (url: string) => url } },
      ],
    });

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, {} as never),
    );
    expect(result).toBeTrue();
  });

  it('redirects unauthenticated users to login', () => {
    const router = { parseUrl: (url: string) => url };
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { isAuthenticated: () => null } },
        { provide: Router, useValue: router },
      ],
    });

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, {} as never),
    );
    expect(JSON.stringify(result)).toBe(JSON.stringify('/login'));
  });
});
