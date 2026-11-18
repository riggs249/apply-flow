import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { LoginPageComponent } from './login-page.component';

describe('LoginPageComponent', () => {
  let fixture: ComponentFixture<LoginPageComponent>;
  let component: LoginPageComponent;
  let auth: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['login']);
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    await TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [
        provideAnimationsAsync(),
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(LoginPageComponent);
    component = fixture.componentInstance;
  });

  it('does not submit invalid email or password', () => {
    component.submit();

    expect(component.form.invalid).toBeTrue();
    expect(auth.login).not.toHaveBeenCalled();
  });

  it('navigates to applications after successful login', () => {
    auth.login.and.returnValue(of({
      accessToken: 'access',
      refreshToken: 'refresh',
      expiresInSeconds: 900,
    }));
    component.form.setValue({ email: 'alex@example.com', password: 'password123' });

    component.submit();

    expect(auth.login).toHaveBeenCalledOnceWith('alex@example.com', 'password123');
    expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/applications');
  });

  it('shows an error after invalid credentials', () => {
    auth.login.and.returnValue(throwError(() => new Error('Unauthorized')));
    component.form.setValue({ email: 'alex@example.com', password: 'password123' });

    component.submit();

    expect(component.error).toContain('Unable to sign in');
    expect(component.loading).toBeFalse();
  });
});
