import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';

function buildToken(email = 'alex@example.com', sub = 'user-1', displayName = 'Alex Rivera'): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ sub, email, displayName }));
  return `${header}.${payload}.signature`;
}

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), AuthService],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('stores access and refresh tokens after successful login', () => {
    const accessToken = buildToken();
    service.login('alex@example.com', 'password123').subscribe(response => {
      expect(response.accessToken).toBe(accessToken);
    });

    const request = http.expectOne(req => req.url.endsWith('/auth/login'));
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      email: 'alex@example.com',
      password: 'password123',
    });
    request.flush({ accessToken, refreshToken: 'refresh-token', expiresInSeconds: 900 });

    expect(service.getToken()).toBe(accessToken);
    expect(service.isAuthenticated()).toBe(accessToken);
    expect(localStorage.getItem('hanaptracker.accessToken')).toBe(accessToken);
    expect(localStorage.getItem('hanaptracker.refreshToken')).toBe('refresh-token');
    expect(service.currentUser()?.email).toBe('alex@example.com');
    expect(service.currentUser()?.displayName).toBe('Alex Rivera');
  });

  it('clears the access token and authentication state on logout', () => {
    service.setToken(buildToken());
    localStorage.setItem('hanaptracker.refreshToken', 'refresh-token');
    service.clearSession();

    expect(service.getToken()).toBeNull();
    expect(service.isAuthenticated()).toBeNull();
    expect(localStorage.getItem('hanaptracker.accessToken')).toBeNull();
    expect(service.currentUser()).toBeNull();
  });
});
