import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { RoleContextService, UserRole } from '../role-context.service';

@Component({
    selector: 'app-hr-dashboard',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, ButtonModule, SelectModule, TagModule],
    template: `
        <section class="flex flex-col gap-6">
            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <span class="text-sm text-muted-color">Dapper Technologies</span>
                    <h1 class="text-3xl font-semibold text-surface-950 dark:text-surface-0 m-0">{{ dashboard().title }}</h1>
                    <p class="text-muted-color mt-2 mb-0 max-w-3xl">{{ dashboard().subtitle }}</p>
                </div>
                <div class="flex items-center gap-3">
                    <span class="font-medium text-sm">Vista de perfil</span>
                    <p-select [(ngModel)]="selectedRole" [options]="roleContext.roles" optionLabel="label" optionValue="value" appendTo="body" styleClass="w-56" />
                </div>
            </div>

            <div class="grid grid-cols-12 gap-4">
                @for (metric of dashboard().metrics; track metric.label) {
                    <article class="col-span-12 md:col-span-6 xl:col-span-3 p-5 bg-surface-0 dark:bg-surface-900 border border-surface rounded-lg">
                        <div class="flex items-start justify-between gap-3">
                            <div>
                                <span class="text-muted-color text-sm">{{ metric.label }}</span>
                                <div class="text-3xl font-semibold mt-2">{{ metric.value }}</div>
                            </div>
                            <span class="w-10 h-10 rounded-lg flex items-center justify-center bg-primary-50 text-primary-600 dark:bg-primary-400/10 dark:text-primary-300">
                                <i [class]="metric.icon"></i>
                            </span>
                        </div>
                        <p class="text-sm text-muted-color mt-4 mb-0">{{ metric.detail }}</p>
                    </article>
                }
            </div>

            <div class="grid grid-cols-12 gap-4">
                <article class="col-span-12 xl:col-span-7 p-5 bg-surface-0 dark:bg-surface-900 border border-surface rounded-lg">
                    <div class="flex items-center justify-between gap-3 mb-4">
                        <h2 class="text-xl font-semibold m-0">{{ dashboard().mainTitle }}</h2>
                        <p-tag [value]="dashboard().tag" [severity]="dashboard().tagSeverity" />
                    </div>
                    <div class="grid grid-cols-12 gap-3">
                        @for (step of dashboard().items; track step.title; let index = $index) {
                            <div class="col-span-12 md:col-span-6 p-4 rounded-lg border border-surface bg-surface-50 dark:bg-surface-800">
                                <div class="flex items-center gap-3">
                                    <span class="w-8 h-8 rounded-full bg-primary text-primary-contrast flex items-center justify-center font-semibold">{{ index + 1 }}</span>
                                    <h3 class="m-0 font-semibold">{{ step.title }}</h3>
                                </div>
                                <p class="text-sm text-muted-color mb-0 mt-3">{{ step.text }}</p>
                            </div>
                        }
                    </div>
                </article>

                <article class="col-span-12 xl:col-span-5 p-5 bg-surface-0 dark:bg-surface-900 border border-surface rounded-lg">
                    <h2 class="text-xl font-semibold m-0 mb-4">Acciones rapidas</h2>
                    <div class="flex flex-col gap-3">
                        @for (action of dashboard().actions; track action.label) {
                            <a [routerLink]="action.route" class="p-4 rounded-lg border border-surface hover:bg-emphasis transition-colors no-underline text-color">
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
            </div>
        </section>
    `
})
export class HrDashboard {
    readonly roleContext = inject(RoleContextService);

    readonly dashboard = computed(() => this.dashboards[this.roleContext.currentRole()]);

    get selectedRole(): UserRole {
        return this.roleContext.currentRole();
    }

    set selectedRole(role: UserRole) {
        this.roleContext.setRole(role);
    }

    dashboards = {
        employee: {
            title: 'Mi espacio de empleado',
            subtitle: 'Consulta tus vacaciones, tus dias disponibles y tu asistencia personal.',
            mainTitle: 'Pendientes personales',
            tag: 'Autoservicio',
            tagSeverity: 'success' as const,
            metrics: [
                { label: 'Dias disponibles', value: '12', detail: 'Saldo actual antes de nuevas solicitudes.', icon: 'pi pi-calendar' },
                { label: 'Solicitudes activas', value: '1', detail: 'Una solicitud pendiente de revision.', icon: 'pi pi-inbox' },
                { label: 'Ultimo registro', value: '18:01', detail: 'Salida registrada el ultimo dia laboral.', icon: 'pi pi-clock' },
                { label: 'Incidencias semana', value: '0', detail: 'Sin retardos o faltas en el resumen actual.', icon: 'pi pi-check-circle' }
            ],
            items: [
                { title: 'Crear solicitud', text: 'Registra fechas, motivo y envia la solicitud a tu responsable.' },
                { title: 'Dar seguimiento', text: 'Consulta si tu solicitud esta pendiente, aprobada, rechazada o requiere cambios.' },
                { title: 'Revisar saldo', text: 'Verifica cuantos dias tienes disponibles antes de solicitar.' },
                { title: 'Consultar asistencia', text: 'Solo puedes ver tus propias entradas, salidas e incidencias.' }
            ],
            actions: [
                { label: 'Nueva solicitud', text: 'Enviar vacaciones a revision.', icon: 'pi pi-plus', route: ['/vacaciones/nueva'] },
                { label: 'Mis solicitudes', text: 'Ver estado e historial.', icon: 'pi pi-list', route: ['/vacaciones/mis-solicitudes'] },
                { label: 'Mi asistencia', text: 'Consultar mis registros.', icon: 'pi pi-table', route: ['/asistencia/reporte'] }
            ]
        },
        manager: {
            title: 'Panel de jefe/director',
            subtitle: 'Revisa solicitudes, saldos y asistencia del equipo.',
            mainTitle: 'Trabajo de aprobacion',
            tag: 'Equipo',
            tagSeverity: 'warn' as const,
            metrics: [
                { label: 'Solicitudes pendientes', value: '3', detail: 'Dos con saldo suficiente y una para revisar.', icon: 'pi pi-inbox' },
                { label: 'Equipo activo', value: '8', detail: 'Empleados asignados al area.', icon: 'pi pi-users' },
                { label: 'Incidencias asistencia', value: '2', detail: 'Retardos o registros incompletos de la semana.', icon: 'pi pi-exclamation-triangle' },
                { label: 'Vacaciones aprobadas', value: '4', detail: 'Solicitudes autorizadas durante el mes.', icon: 'pi pi-check-square' }
            ],
            items: [
                { title: 'Revisar solicitudes', text: 'Autoriza, rechaza o solicita cambios con comentario.' },
                { title: 'Validar saldo', text: 'Comprueba dias disponibles antes de aprobar.' },
                { title: 'Cuidar cobertura', text: 'Evalua ausencias considerando el calendario del equipo.' },
                { title: 'Consultar asistencia', text: 'Visualiza registros del equipo, no de toda la empresa.' }
            ],
            actions: [
                { label: 'Solicitudes por aprobar', text: 'Atender pendientes del equipo.', icon: 'pi pi-check-square', route: ['/vacaciones/aprobaciones'] },
                { label: 'Saldos del equipo', text: 'Revisar dias disponibles.', icon: 'pi pi-calendar-clock', route: ['/vacaciones/saldos'] },
                { label: 'Reporte semanal de asistencia', text: 'Ver resumen semanal.', icon: 'pi pi-table', route: ['/asistencia/reporte'] }
            ]
        },
        admin: {
            title: 'Panel de administracion RH',
            subtitle: 'Administra empleados, vacaciones, asistencia y reportes.',
            mainTitle: 'Operacion de Recursos Humanos',
            tag: 'Control total',
            tagSeverity: 'danger' as const,
            metrics: [
                { label: 'Solicitudes pendientes', value: '6', detail: '4 esperan aprobacion y 2 requieren cambios.', icon: 'pi pi-inbox' },
                { label: 'Empleados registrados', value: '24', detail: 'Usuarios simulados para preparar el modelo.', icon: 'pi pi-users' },
                { label: 'Registros importados', value: '128', detail: 'Lecturas semanales desde Excel de huella.', icon: 'pi pi-clock' },
                { label: 'Reportes listos', value: '3', detail: 'Resumenes semanales preparados para PDF.', icon: 'pi pi-file-pdf' }
            ],
            items: [
                { title: 'Gestionar empleados', text: 'Mantiene perfiles, departamentos, jefes y estados.' },
                { title: 'Controlar saldos', text: 'Consulta y ajusta dias disponibles cuando RH lo autorice.' },
                { title: 'Procesar asistencia', text: 'Carga el Excel de la maquina de huella y simplifica la semana.' },
                { title: 'Generar reportes', text: 'Prepara reportes PDF para seguimiento interno.' }
            ],
            actions: [
                { label: 'Empleados', text: 'Administrar personal y roles.', icon: 'pi pi-users', route: ['/admin/empleados'] },
                { label: 'Cargar Excel', text: 'Importar registros de huella.', icon: 'pi pi-upload', route: ['/asistencia/cargar'] }
            ]
        }
    };
}
