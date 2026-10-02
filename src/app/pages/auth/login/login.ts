import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { InputIcon } from 'primeng/inputicon';
import { IconField } from 'primeng/iconfield';
import { AuthService } from '@/app/services/auth.service';
import { LayoutService } from '@/app/layout/service/layout.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [ButtonModule, CheckboxModule, InputTextModule, PasswordModule, FormsModule, RouterModule, RippleModule, InputIcon, IconField],
    templateUrl: './login.html'
})
export class Login {
    private readonly auth = inject(AuthService);
    private readonly router = inject(Router);
    private readonly layoutService = inject(LayoutService);

    email: string = '';

    password: string = '';

    checked: boolean = false;

    readonly errorMessage = signal('');

    readonly loading = this.auth.loading;

    readonly brandLogo = computed(() => (this.layoutService.isDarkTheme() ? '/layout/images/dapper-light.png' : '/layout/images/dapper-black.png'));

    async signIn() {
        this.errorMessage.set('');

        try {
            await this.auth.login(this.email, this.password);
            await this.router.navigate(['/']);
        } catch (error) {
            this.errorMessage.set(this.getLoginErrorMessage(error));
        }
    }

    private getLoginErrorMessage(error: unknown) {
        const apiError = error as { error?: { error?: { message?: string }; message?: string }; message?: string };
        const firebaseMessage = apiError.error?.error?.message || apiError.error?.message || apiError.message || '';

        if (firebaseMessage.includes('INVALID_LOGIN_CREDENTIALS') || firebaseMessage.includes('INVALID_PASSWORD') || firebaseMessage.includes('EMAIL_NOT_FOUND')) {
            return 'Correo o contraseña incorrectos.';
        }

        return firebaseMessage || 'No pude iniciar sesión. Revisa tus credenciales.';
    }
}
