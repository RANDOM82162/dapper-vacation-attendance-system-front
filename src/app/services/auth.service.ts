import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { type EmployeeRole, RoleContextService, type UserRole } from '@/app/pages/hr/role-context.service';

export type AuthMode = 'firebase';

interface FirebaseLoginResponse {
    idToken: string;
    email: string;
    refreshToken: string;
    localId: string;
    expiresIn: string;
}

interface FirebaseUpdatePasswordResponse {
    idToken: string;
    email: string;
    refreshToken: string;
    localId: string;
    expiresIn?: string;
}

interface FirebasePasswordResetResponse {
    email: string;
    requestType: string;
}

export interface EmployeeProfile {
    _id?: string;
    uid?: string;
    employeeNumber?: string;
    name: string;
    email?: string;
    department: string;
    role: EmployeeRole;
    status: 'ACTIVO' | 'INACTIVO';
}

interface ApiResponse<T> {
    status: number;
    message: string;
    data: T;
}

export interface AuthSession {
    uid: string;
    email: string;
    idToken: string;
    refreshToken: string;
    expiresAt: number;
    mode: AuthMode;
    employee?: EmployeeProfile;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly http = inject(HttpClient);
    private readonly roleContext = inject(RoleContextService);
    private readonly sessionStorageKey = 'authSession';

    readonly session = signal<AuthSession | null>(this.loadStoredSession());

    readonly currentEmployee = signal<EmployeeProfile | null>(this.session()?.employee || null);

    readonly loading = signal(false);

    readonly isAuthenticated = signal(Boolean(this.session()));

    constructor() {
        const employee = this.currentEmployee();
        if (employee) {
            this.roleContext.setRoleFromEmployeeRole(employee.role);
        }
    }

    async login(email: string, password: string) {
        const useFirebaseEmulator = Boolean((environment as typeof environment & { useFirebaseEmulator?: boolean }).useFirebaseEmulator);

        if (!useFirebaseEmulator && (!environment.firebaseApiKey || environment.firebaseApiKey === 'PON_AQUI_TU_FIREBASE_WEB_API_KEY')) {
            throw new Error('Falta configurar firebaseApiKey en src/environments/environment.ts');
        }

        this.loading.set(true);

        try {
            const firebaseResponse = await firstValueFrom(
                this.http.post<FirebaseLoginResponse>(`${environment.firebaseAuthUrl}/accounts:signInWithPassword?key=${environment.firebaseApiKey}`, {
                    email,
                    password,
                    returnSecureToken: true
                })
            );

            const session: AuthSession = {
                uid: firebaseResponse.localId,
                email: firebaseResponse.email,
                idToken: firebaseResponse.idToken,
                refreshToken: firebaseResponse.refreshToken,
                expiresAt: Date.now() + Number(firebaseResponse.expiresIn || 3600) * 1000,
                mode: 'firebase'
            };

            this.setSession(session);
            await this.loadCurrentEmployee();

            return this.session();
        } finally {
            this.loading.set(false);
        }
    }

    async loadCurrentEmployee() {
        const token = this.getToken();
        if (!token) return null;

        const response = await firstValueFrom(
            this.http.get<ApiResponse<EmployeeProfile>>(`${environment.apiBaseUrl}/employees/me`, {
                headers: new HttpHeaders({ Authorization: `Bearer ${token}` })
            })
        );

        const employee = response.data;
        const nextSession = this.session();

        if (nextSession) {
            this.setSession({ ...nextSession, employee });
        }

        this.currentEmployee.set(employee);
        this.roleContext.setRoleFromEmployeeRole(employee.role);
        return employee;
    }

    async changePassword(newPassword: string) {
        const currentSession = this.session();

        if (!currentSession || currentSession.mode !== 'firebase') {
            throw new Error('Solo las cuentas reales pueden cambiar contraseña.');
        }

        if (!newPassword || newPassword.length < 6) {
            throw new Error('La contraseña debe tener al menos 6 caracteres.');
        }

        const useFirebaseEmulator = Boolean((environment as typeof environment & { useFirebaseEmulator?: boolean }).useFirebaseEmulator);

        if (!useFirebaseEmulator && (!environment.firebaseApiKey || environment.firebaseApiKey === 'PON_AQUI_TU_FIREBASE_WEB_API_KEY')) {
            throw new Error('Falta configurar firebaseApiKey en src/environments/environment.ts');
        }

        const response = await firstValueFrom(
            this.http.post<FirebaseUpdatePasswordResponse>(`${environment.firebaseAuthUrl}/accounts:update?key=${environment.firebaseApiKey}`, {
                idToken: currentSession.idToken,
                password: newPassword,
                returnSecureToken: true
            })
        );

        this.setSession({
            ...currentSession,
            uid: response.localId || currentSession.uid,
            email: response.email || currentSession.email,
            idToken: response.idToken || currentSession.idToken,
            refreshToken: response.refreshToken || currentSession.refreshToken,
            expiresAt: Date.now() + Number(response.expiresIn || 3600) * 1000
        });
    }

    async requestPasswordReset(email: string) {
        this.assertFirebaseConfigured();

        try {
            await firstValueFrom(
                this.http.post(`${environment.firebaseAuthUrl}/accounts:sendOobCode?key=${environment.firebaseApiKey}`, {
                    requestType: 'PASSWORD_RESET',
                    email: email.trim().toLowerCase()
                })
            );
        } catch (error) {
            // Firebase puede revelar si existe una cuenta; la pantalla siempre da la misma respuesta.
            if (this.firebaseErrorCode(error) === 'EMAIL_NOT_FOUND') return;
            throw error;
        }
    }

    async verifyPasswordResetCode(code: string) {
        this.assertFirebaseConfigured();
        const response = await firstValueFrom(
            this.http.post<FirebasePasswordResetResponse>(`${environment.firebaseAuthUrl}/accounts:resetPassword?key=${environment.firebaseApiKey}`, {
                oobCode: code
            })
        );
        if (response.requestType !== 'PASSWORD_RESET') throw new Error('El enlace no corresponde a un cambio de contraseña.');
        return response.email;
    }

    async confirmPasswordReset(code: string, newPassword: string) {
        this.assertFirebaseConfigured();
        if (newPassword.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres.');

        await firstValueFrom(
            this.http.post<FirebasePasswordResetResponse>(`${environment.firebaseAuthUrl}/accounts:resetPassword?key=${environment.firebaseApiKey}`, {
                oobCode: code,
                newPassword
            })
        );
        this.logout();
    }

    logout() {
        if (typeof window !== 'undefined') {
            this.clearAuthStorage(window.sessionStorage);
            this.clearAuthStorage(window.localStorage);
        }

        this.session.set(null);
        this.currentEmployee.set(null);
        this.isAuthenticated.set(false);
        this.roleContext.setRole('employee');
    }

    getToken() {
        const session = this.session();
        return session?.idToken || this.getStoredToken();
    }

    getDisplayName() {
        return this.currentEmployee()?.name || this.session()?.email || 'Usuario';
    }

    getEmployeeName() {
        return this.currentEmployee()?.name || '';
    }

    getEmployeeNumber() {
        return this.currentEmployee()?.employeeNumber || '';
    }

    getEmployeeDepartment() {
        return this.currentEmployee()?.department || 'Desarrollo';
    }

    getCurrentUserRole(): UserRole | null {
        const employeeRole = this.currentEmployee()?.role || this.session()?.employee?.role;
        if (!employeeRole) return null;

        const roleMap: Record<EmployeeRole, UserRole> = {
            Empleado: 'employee',
            'Jefe/Director': 'manager',
            Administrador: 'admin'
        };

        return roleMap[employeeRole] || null;
    }

    private setSession(session: AuthSession) {
        this.session.set(session);
        this.isAuthenticated.set(Boolean(session));

        if (typeof window !== 'undefined') {
            this.clearAuthStorage(window.localStorage);
            window.sessionStorage.setItem(this.sessionStorageKey, JSON.stringify(session));
            window.sessionStorage.setItem('authToken', session.idToken);
        }
    }

    private loadStoredSession() {
        if (typeof window === 'undefined') return null;

        const sessionStorage = window.sessionStorage;
        const localStorage = window.localStorage;
        const storedValue = sessionStorage.getItem(this.sessionStorageKey) || localStorage.getItem(this.sessionStorageKey);
        this.clearAuthStorage(localStorage);
        if (!storedValue) return null;

        try {
            const parsedSession = JSON.parse(storedValue) as AuthSession;

            if (parsedSession.mode !== 'firebase' || !parsedSession.idToken) {
                this.clearAuthStorage(sessionStorage);
                return null;
            }

            // Migra sesiones anteriores una vez; después los tokens solo viven en esta pestaña.
            sessionStorage.setItem(this.sessionStorageKey, JSON.stringify(parsedSession));
            sessionStorage.setItem('authToken', parsedSession.idToken);
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('accessToken');
            return parsedSession;
        } catch {
            this.clearAuthStorage(sessionStorage);
            return null;
        }
    }

    private getStoredToken() {
        if (typeof window === 'undefined') return null;

        return window.sessionStorage.getItem('authToken') || window.sessionStorage.getItem('token') || window.sessionStorage.getItem('accessToken');
    }

    private clearAuthStorage(storage: Storage) {
        storage.removeItem(this.sessionStorageKey);
        storage.removeItem('authToken');
        storage.removeItem('token');
        storage.removeItem('accessToken');
    }

    private assertFirebaseConfigured() {
        const useFirebaseEmulator = Boolean((environment as typeof environment & { useFirebaseEmulator?: boolean }).useFirebaseEmulator);
        if (!useFirebaseEmulator && (!environment.firebaseApiKey || environment.firebaseApiKey === 'PON_AQUI_TU_FIREBASE_WEB_API_KEY')) {
            throw new Error('Falta configurar Firebase Auth para este entorno.');
        }
    }

    private firebaseErrorCode(error: unknown) {
        const response = error as { error?: { error?: { message?: string } } };
        return response.error?.error?.message || '';
    }
}
