import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { AuthService } from '@/app/services/auth.service';
import { RoleContextService } from '@/app/pages/hr/role-context.service';

@Component({
    selector: 'app-account-profile',
    standalone: true,
    imports: [CommonModule, RouterModule, ButtonModule, TagModule],
    template: `
        <section class="grid grid-cols-12 gap-4">
            <article class="col-span-12 lg:col-span-5 p-5 bg-surface-0 dark:bg-surface-900 border border-surface rounded-lg">
                <div class="flex items-center gap-4">
                    <span class="w-20 h-20 rounded-full bg-primary text-primary-contrast flex items-center justify-center text-2xl font-semibold shrink-0">{{ profileInitials() }}</span>
                    <div>
                        <h1 class="text-2xl font-semibold m-0">{{ auth.getDisplayName() }}</h1>
                        <p class="text-muted-color mt-2 mb-0">{{ employee()?.email || session()?.email || 'Sin correo registrado' }}</p>
                    </div>
                </div>

                <div class="grid grid-cols-12 gap-3 mt-5">
                    <div class="col-span-12 sm:col-span-6 p-3 rounded-lg border border-surface">
                        <span class="block text-sm text-muted-color">Perfil</span>
                        <p-tag [value]="roleContext.currentRoleLabel()" severity="info" styleClass="mt-2" />
                    </div>
                    <div class="col-span-12 sm:col-span-6 p-3 rounded-lg border border-surface">
                        <span class="block text-sm text-muted-color">Departamento</span>
                        <span class="block font-semibold mt-2">{{ employee()?.department || 'Sin departamento' }}</span>
                    </div>
                    <div class="col-span-12 sm:col-span-6 p-3 rounded-lg border border-surface">
                        <span class="block text-sm text-muted-color">Estado</span>
                        <span class="block font-semibold mt-2">{{ employee()?.status || 'Activo' }}</span>
                    </div>
                </div>
            </article>

            <article class="col-span-12 lg:col-span-7 p-5 bg-surface-0 dark:bg-surface-900 border border-surface rounded-lg">
                <h2 class="text-xl font-semibold mt-0 mb-4">Accesos de tu perfil</h2>
                <div class="grid grid-cols-12 gap-3">
                    @for (action of actions(); track action.label) {
                        <a [routerLink]="action.route" class="col-span-12 md:col-span-6 p-4 rounded-lg border border-surface hover:bg-emphasis transition-colors no-underline text-color">
                            <div class="flex items-center gap-3">
                                <span class="w-10 h-10 rounded-lg flex items-center justify-center bg-primary-50 text-primary-600 dark:bg-primary-400/10 dark:text-primary-300">
                                    <i [class]="action.icon"></i>
                                </span>
                                <div>
                                    <div class="font-semibold">{{ action.label }}</div>
                                    <p class="text-sm text-muted-color mb-0 mt-1">{{ action.text }}</p>
                                </div>
                            </div>
                        </a>
                    }
                </div>
            </article>
        </section>
    `
})
export class AccountProfile {
    readonly auth = inject(AuthService);
    readonly roleContext = inject(RoleContextService);

    readonly session = this.auth.session;
    readonly employee = this.auth.currentEmployee;

    readonly profileInitials = computed(() =>
        this.auth
            .getDisplayName()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase())
            .join('') || 'U'
    );

    readonly actions = computed(() => {
        switch (this.roleContext.currentRole()) {
            case 'employee':
                return [
                    { label: 'Nueva solicitud', text: 'Crear una solicitud de vacaciones.', icon: 'pi pi-plus', route: ['/vacaciones/nueva'] },
                    { label: 'Mis solicitudes', text: 'Consultar el estado de tus solicitudes.', icon: 'pi pi-list', route: ['/vacaciones/mis-solicitudes'] },
                    { label: 'Mis días disponibles', text: 'Revisar tu saldo actual.', icon: 'pi pi-calendar', route: ['/vacaciones/saldos'] },
                    { label: 'Mi asistencia', text: 'Consultar tu reporte semanal.', icon: 'pi pi-table', route: ['/asistencia/reporte'] }
                ];
            case 'manager':
                return [
                    { label: 'Nueva solicitud', text: 'Crear una solicitud de vacaciones.', icon: 'pi pi-plus', route: ['/vacaciones/nueva'] },
                    { label: 'Mis solicitudes', text: 'Consultar el estado de tus solicitudes.', icon: 'pi pi-list', route: ['/vacaciones/mis-solicitudes'] },
                    { label: 'Solicitudes por aprobar', text: 'Atender solicitudes pendientes.', icon: 'pi pi-check-square', route: ['/vacaciones/aprobaciones'] },
                    { label: 'Saldos', text: 'Consultar días disponibles.', icon: 'pi pi-calendar-clock', route: ['/vacaciones/saldos'] },
                    { label: 'Dashboard semanal', text: 'Abrir semanas cargadas.', icon: 'pi pi-chart-bar', route: ['/asistencia/dashboard'] },
                    { label: 'Reporte de asistencia', text: 'Revisar asistencia semanal.', icon: 'pi pi-table', route: ['/asistencia/reporte'] }
                ];
            default:
                return [
                    { label: 'Empleados', text: 'Administrar personal y roles.', icon: 'pi pi-users', route: ['/admin/empleados'] },
                    { label: 'Cargar Excel', text: 'Importar registros de huella.', icon: 'pi pi-upload', route: ['/asistencia/cargar'] },
                    { label: 'Dashboard semanal', text: 'Abrir semanas cargadas.', icon: 'pi pi-chart-bar', route: ['/asistencia/dashboard'] },
                    { label: 'Saldos', text: 'Editar días disponibles.', icon: 'pi pi-calendar-clock', route: ['/vacaciones/saldos'] }
                ];
        }
    });
}
