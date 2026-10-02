import { Component, inject, OnInit, signal } from '@angular/core';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@/app/services/auth.service';

@Component({
    selector: 'app-new-password',
    standalone: true,
    imports: [ButtonModule, PasswordModule, RouterModule, FormsModule],
    templateUrl: './newpassword.html'
})
export class NewPassword implements OnInit {
    private readonly auth = inject(AuthService);
    private readonly route = inject(ActivatedRoute);
    private code = '';

    password = '';
    confirmPassword = '';
    readonly email = signal('');
    readonly verifying = signal(true);
    readonly saving = signal(false);
    readonly completed = signal(false);
    readonly errorMessage = signal('');

    async ngOnInit() {
        this.code = this.route.snapshot.queryParamMap.get('oobCode') || '';
        const mode = this.route.snapshot.queryParamMap.get('mode');
        if (!this.code || mode !== 'resetPassword') {
            this.errorMessage.set('El enlace de recuperación no es válido. Solicita uno nuevo.');
            this.verifying.set(false);
            return;
        }

        try {
            this.email.set(await this.auth.verifyPasswordResetCode(this.code));
        } catch {
            this.errorMessage.set('El enlace de recuperación no es válido o ya venció. Solicita uno nuevo.');
        } finally {
            this.verifying.set(false);
        }
    }

    async savePassword() {
        if (this.saving() || !this.email()) return;
        if (this.password.length < 6) {
            this.errorMessage.set('La contraseña debe tener al menos 6 caracteres.');
            return;
        }
        if (this.password !== this.confirmPassword) {
            this.errorMessage.set('Las contraseñas no coinciden.');
            return;
        }

        this.saving.set(true);
        this.errorMessage.set('');
        try {
            await this.auth.confirmPasswordReset(this.code, this.password);
            this.password = '';
            this.confirmPassword = '';
            this.completed.set(true);
        } catch {
            this.errorMessage.set('No se pudo cambiar la contraseña. El enlace pudo haber vencido; solicita uno nuevo.');
        } finally {
            this.saving.set(false);
        }
    }
}
