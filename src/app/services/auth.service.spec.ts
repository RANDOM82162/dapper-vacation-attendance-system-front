import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

describe('AuthService recovery', () => {
    let auth: AuthService;
    let http: HttpTestingController;
    const originalEnvironment = { ...environment };

    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
        Object.assign(environment, {
            firebaseApiKey: 'test-key',
            firebaseAuthUrl: 'https://identitytoolkit.googleapis.com/v1',
            useFirebaseEmulator: false
        });
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()]
        });
        auth = TestBed.inject(AuthService);
        http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        http.verify();
        Object.assign(environment, originalEnvironment);
    });

    it('requests a Firebase reset email without exposing an unknown account', async () => {
        const pending = auth.requestPasswordReset('  PERSONA@DAPPER.COM ');
        const request = http.expectOne('https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=test-key');
        expect(request.request.body).toEqual({ requestType: 'PASSWORD_RESET', email: 'persona@dapper.com' });
        request.flush({ error: { message: 'EMAIL_NOT_FOUND' } }, { status: 400, statusText: 'Bad Request' });
        await expectAsync(pending).toBeResolved();
    });

    it('verifies a password reset code before showing the account', async () => {
        const pending = auth.verifyPasswordResetCode('one-time-code');
        const request = http.expectOne('https://identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=test-key');
        expect(request.request.body).toEqual({ oobCode: 'one-time-code' });
        request.flush({ email: 'persona@dapper.com', requestType: 'PASSWORD_RESET' });
        await expectAsync(pending).toBeResolvedTo('persona@dapper.com');
    });

    it('confirms the new password using the one-time code', async () => {
        const pending = auth.confirmPasswordReset('one-time-code', 'new-password-123');
        const request = http.expectOne('https://identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=test-key');
        expect(request.request.body).toEqual({ oobCode: 'one-time-code', newPassword: 'new-password-123' });
        request.flush({ email: 'persona@dapper.com', requestType: 'PASSWORD_RESET' });
        await expectAsync(pending).toBeResolved();
        expect(auth.isAuthenticated()).toBeFalse();
    });

    it('stores the authenticated session in sessionStorage instead of localStorage', async () => {
        const pending = auth.login('persona@dapper.com', 'password-123');
        const loginRequest = http.expectOne('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=test-key');
        loginRequest.flush({
            idToken: 'session-id-token',
            refreshToken: 'session-refresh-token',
            localId: 'employee-uid',
            email: 'persona@dapper.com',
            expiresIn: '3600'
        });

        await Promise.resolve();
        const employeeRequest = http.expectOne(`${environment.apiBaseUrl}/employees/me`);
        employeeRequest.flush({
            status: 200,
            message: 'Empleado obtenido',
            data: { name: 'Persona', department: 'Desarrollo', role: 'Empleado', status: 'ACTIVO' }
        });
        await expectAsync(pending).toBeResolved();

        expect(sessionStorage.getItem('authSession')).toContain('session-refresh-token');
        expect(sessionStorage.getItem('authToken')).toBe('session-id-token');
        expect(localStorage.getItem('authSession')).toBeNull();
        expect(localStorage.getItem('authToken')).toBeNull();
    });

    it('migrates a previous localStorage session and removes the persistent token copy', () => {
        const previousSession = {
            uid: 'employee-uid',
            email: 'persona@dapper.com',
            idToken: 'previous-id-token',
            refreshToken: 'previous-refresh-token',
            expiresAt: Date.now() + 3600000,
            mode: 'firebase'
        };
        localStorage.setItem('authSession', JSON.stringify(previousSession));
        localStorage.setItem('authToken', previousSession.idToken);

        const migratedSession = (auth as unknown as { loadStoredSession: () => typeof previousSession | null }).loadStoredSession();

        expect(migratedSession).toEqual(previousSession);
        expect(sessionStorage.getItem('authSession')).toBe(JSON.stringify(previousSession));
        expect(sessionStorage.getItem('authToken')).toBe(previousSession.idToken);
        expect(localStorage.getItem('authSession')).toBeNull();
        expect(localStorage.getItem('authToken')).toBeNull();
    });
});
