import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { AuthService } from '@/app/services/auth.service';

@Component({
    standalone: true,
    selector: 'app-forgot-password',
    imports: [ButtonModule, FormsModule, InputTextModule, RouterModule],
    templateUrl: './forgotpassword.html'
})
export class ForgotPassword {
    private readonly auth = inject(AuthService);

    email = '';
    readonly sending = signal(false);
    readonly sent = signal(false);
    readonly errorMessage = signal('');

    async sendResetEmail() {
        if (this.sending() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim())) {
            this.errorMessage.set('Escribe un correo válido.');
            return;
        }

        this.sending.set(true);
        this.errorMessage.set('');
        try {
            await this.auth.requestPasswordReset(this.email);
            this.sent.set(true);
        } catch {
            this.errorMessage.set('No se pudo enviar el correo. Inténtalo de nuevo más tarde.');
        } finally {
            this.sending.set(false);
        }
    }
}
