import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { TagModule } from 'primeng/tag';
import { AuthService } from '@/app/services/auth.service';
import { LayoutService } from '@/app/layout/service/layout.service';
import { RoleContextService } from '@/app/pages/hr/role-context.service';
import { EmployeesApiService } from '@/app/pages/hr/admin/employees-api.service';

@Component({
    selector: 'app-account-settings',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, PasswordModule, TagModule],
    template: `
        <section class="grid grid-cols-12 gap-4">
            <article class="col-span-12 lg:col-span-6 p-5 bg-surface-0 dark:bg-surface-900 border border-surface rounded-lg">
                <h1 class="text-2xl font-semibold mt-0 mb-2">Configuración</h1>
                <p class="text-muted-color mt-0 mb-5">Preferencias de la sesión actual.</p>

                <div class="flex items-center justify-between gap-4 py-4 border-t border-surface">
                    <div>
                        <div class="font-semibold">Tema</div>
                        <p class="text-sm text-muted-color mt-1 mb-0">{{ layoutService.isDarkTheme() ? 'Oscuro' : 'Claro' }}</p>
                    </div>
                    <p-button [label]="layoutService.isDarkTheme() ? 'Usar claro' : 'Usar oscuro'" [icon]="layoutService.isDarkTheme() ? 'pi pi-sun' : 'pi pi-moon'" severity="secondary" [outlined]="true" (onClick)="toggleTheme()" />
                </div>

                <div class="flex items-center justify-between gap-4 py-4 border-t border-surface">
                    <div>
                        <div class="font-semibold">Sesión</div>
                        <p class="text-sm text-muted-color mt-1 mb-0">Cuenta conectada</p>
                    </div>
                    <p-tag [value]="roleContext.currentRoleLabel()" severity="info" />
                </div>
            </article>

            <article class="col-span-12 lg:col-span-6 p-5 bg-surface-0 dark:bg-surface-900 border border-surface rounded-lg">
                <h2 class="text-xl font-semibold mt-0 mb-2">Cuenta</h2>
                <p class="text-muted-color mt-0 mb-5">Consulta tu correo y actualiza tu acceso.</p>

                <div class="flex flex-col gap-2 mb-5">
                    <label for="accountEmail" class="font-medium">Correo electrónico</label>
                    <div class="flex flex-col sm:flex-row gap-2">
                        <input id="accountEmail" pInputText type="email" class="w-full" [(ngModel)]="emailDraft" [readonly]="!canEditEmail()" autocomplete="email" />
                        @if (canEditEmail()) {
                            <p-button label="Guardar correo" icon="pi pi-save" severity="secondary" [outlined]="true" [loading]="savingEmail()" [disabled]="!canSaveEmail()" (onClick)="changeEmail()" />
                        }
                    </div>
                    @if (canEditEmail()) {
                        <small class="text-muted-color">Como administrador puedes actualizar tu correo de acceso.</small>
                    } @else {
                        <small class="text-muted-color">Para cambiar el correo electrónico, contacta con el administrador.</small>
                    }
                    @if (emailMessage()) {
                        <div [class]="emailMessageClass()">{{ emailMessage() }}</div>
                    }
                </div>

                <div class="grid grid-cols-1 gap-4">
                    <div class="flex flex-col gap-2">
                        <label for="newPassword" class="font-medium">Nueva contraseña</label>
                        <p-password
                            inputId="newPassword"
                            [(ngModel)]="newPassword"
                            styleClass="w-full"
                            inputStyleClass="w-full"
                            [toggleMask]="true"
                            [feedback]="false"
                            autocomplete="new-password"
                        />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label for="confirmPassword" class="font-medium">Confirmar contraseña</label>
                        <p-password
                            inputId="confirmPassword"
                            [(ngModel)]="confirmPassword"
                            styleClass="w-full"
                            inputStyleClass="w-full"
                            [toggleMask]="true"
                            [feedback]="false"
                            autocomplete="new-password"
                        />
                    </div>

                    @if (passwordMessage()) {
                        <div [class]="passwordMessageClass()">{{ passwordMessage() }}</div>
                    }

                    <div class="flex justify-end">
                        <p-button label="Cambiar contraseña" icon="pi pi-key" [loading]="savingPassword()" [disabled]="!canChangePassword()" (onClick)="changePassword()" />
                    </div>
                </div>
            </article>

        </section>
    `
})
export class AccountSettings {
    readonly auth = inject(AuthService);
    readonly roleContext = inject(RoleContextService);
    readonly layoutService = inject(LayoutService);
    readonly employeesApi = inject(EmployeesApiService);
    readonly savingEmail = signal(false);
    readonly savingPassword = signal(false);
    readonly emailMessage = signal('');
    readonly emailMessageClass = signal('text-sm text-muted-color');
    readonly passwordMessage = signal('');
    readonly passwordMessageClass = signal('text-sm text-muted-color');
    readonly accountEmail = computed(() => this.auth.currentEmployee()?.email || this.auth.session()?.email || 'Sin correo registrado');

    emailDraft = this.accountEmail();
    newPassword = '';
    confirmPassword = '';

    toggleTheme() {
        this.layoutService.toggleTheme();
    }

    canEditEmail() {
        const employee = this.auth.currentEmployee();
        return Boolean(employee?._id && employee.role === 'Administrador');
    }

    canSaveEmail() {
        const nextEmail = this.emailDraft.trim().toLowerCase();
        const currentEmail = this.accountEmail().trim().toLowerCase();

        return this.canEditEmail() && !this.savingEmail() && nextEmail !== currentEmail && this.isValidEmail(nextEmail);
    }

    async changeEmail() {
        this.emailMessage.set('');

        if (!this.canEditEmail()) {
            this.showEmailError('Solo el administrador puede cambiar su correo desde configuración.');
            return;
        }

        const employee = this.auth.currentEmployee();
        const nextEmail = this.emailDraft.trim().toLowerCase();

        if (!employee?._id) {
            this.showEmailError('No se encontró el perfil de empleado para actualizar el correo.');
            return;
        }

        if (!this.isValidEmail(nextEmail)) {
            this.showEmailError('Escribe un correo válido.');
            return;
        }

        this.savingEmail.set(true);

        try {
            await firstValueFrom(this.employeesApi.updateEmployee(employee._id, { email: nextEmail }));
            await this.auth.loadCurrentEmployee();
            this.emailDraft = this.accountEmail();
            this.emailMessageClass.set('text-sm text-green-500');
            this.emailMessage.set('Correo actualizado correctamente.');
        } catch (error) {
            this.showEmailError(error instanceof Error ? error.message : 'No se pudo cambiar el correo.');
        } finally {
            this.savingEmail.set(false);
        }
    }

    canChangePassword() {
        return !this.savingPassword() && this.newPassword.length >= 6 && this.newPassword === this.confirmPassword;
    }

    async changePassword() {
        this.passwordMessage.set('');

        if (this.newPassword.length < 6) {
            this.showPasswordError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        if (this.newPassword !== this.confirmPassword) {
            this.showPasswordError('Las contraseñas no coinciden.');
            return;
        }

        this.savingPassword.set(true);

        try {
            await this.auth.changePassword(this.newPassword);
            this.newPassword = '';
            this.confirmPassword = '';
            this.passwordMessageClass.set('text-sm text-green-500');
            this.passwordMessage.set('Contraseña actualizada correctamente.');
        } catch (error) {
            this.showPasswordError(error instanceof Error ? error.message : 'No se pudo cambiar la contraseña.');
        } finally {
            this.savingPassword.set(false);
        }
    }

    private showPasswordError(message: string) {
        this.passwordMessageClass.set('text-sm text-red-500');
        this.passwordMessage.set(message);
    }

    private showEmailError(message: string) {
        this.emailMessageClass.set('text-sm text-red-500');
        this.emailMessage.set(message);
    }

    private isValidEmail(email: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
}
