import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppMenuitem } from '@/app/layout/components/menuitem/app.menuitem';
import { RoleContextService } from '@/app/pages/hr/role-context.service';

@Component({
    selector: '[app-menu]',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    templateUrl: './app.menu.html'
})
export class AppMenu {
    private roleContext = inject(RoleContextService);

    model = computed<any[]>(() => {
        const shared = [
            {
                label: 'Panel',
                icon: 'pi pi-home',
                path: '/',
                routerLink: ['/'],
                items: [{ label: 'Panel principal', icon: 'pi pi-chart-line', routerLink: ['/'] }]
            }
        ];

        const employee = [
            {
                label: 'Vacaciones',
                icon: 'pi pi-calendar',
                path: '/vacaciones',
                routerLink: ['/vacaciones/nueva'],
                items: [
                    { label: 'Nueva solicitud', icon: 'pi pi-plus', routerLink: ['/vacaciones/nueva'] },
                    { label: 'Mis solicitudes', icon: 'pi pi-list', routerLink: ['/vacaciones/mis-solicitudes'] },
                    { label: 'Mis dias disponibles', icon: 'pi pi-clock', routerLink: ['/vacaciones/saldos'] }
                ]
            },
            {
                label: 'Asistencia',
                icon: 'pi pi-id-card',
                path: '/asistencia',
                routerLink: ['/asistencia/reporte'],
                items: [{ label: 'Mi asistencia', icon: 'pi pi-table', routerLink: ['/asistencia/reporte'] }]
            }
        ];

        const manager = [
            {
                label: 'Equipo',
                icon: 'pi pi-users',
                path: '/vacaciones/aprobaciones',
                routerLink: ['/vacaciones/aprobaciones'],
                items: [
                    { label: 'Solicitudes por aprobar', icon: 'pi pi-check-square', routerLink: ['/vacaciones/aprobaciones'] },
                    { label: 'Historial de solicitudes', icon: 'pi pi-history', routerLink: ['/vacaciones/historial'] },
                    { label: 'Saldos del equipo', icon: 'pi pi-calendar-clock', routerLink: ['/vacaciones/saldos'] }
                ]
            },
            {
                label: 'Asistencia',
                icon: 'pi pi-id-card',
                path: '/asistencia',
                routerLink: ['/asistencia/reporte'],
                items: [{ label: 'Reporte semanal de asistencia', icon: 'pi pi-table', routerLink: ['/asistencia/reporte'] }]
            }
        ];

        const adminAttendance = [
            {
                label: 'Asistencia',
                icon: 'pi pi-id-card',
                path: '/asistencia',
                routerLink: ['/asistencia/reporte'],
                items: [
                    { label: 'Reporte semanal de asistencia', icon: 'pi pi-table', routerLink: ['/asistencia/reporte'] },
                    { label: 'Cargar Excel', icon: 'pi pi-upload', routerLink: ['/asistencia/cargar'] }
                ]
            }
        ];

        const adminTeam = [
            {
                label: 'Equipo',
                icon: 'pi pi-users',
                path: '/equipo',
                items: [
                    { label: 'Solicitudes por aprobar', icon: 'pi pi-check-square', routerLink: ['/vacaciones/aprobaciones'] },
                    { label: 'Historial de solicitudes', icon: 'pi pi-history', routerLink: ['/vacaciones/historial'] },
                    { label: 'Saldos del equipo', icon: 'pi pi-calendar-clock', routerLink: ['/vacaciones/saldos'] }
                ]
            }
        ];

        const admin = [
            {
                label: 'Administracion',
                icon: 'pi pi-briefcase',
                path: '/admin',
                routerLink: ['/admin/empleados'],
                items: [
                    { label: 'Empleados', icon: 'pi pi-users', routerLink: ['/admin/empleados'] }
                ]
            }
        ];

        switch (this.roleContext.currentRole()) {
            case 'employee':
                return [...shared, ...employee];
            case 'manager':
                return [...shared, ...manager];
            default:
                return [...shared, ...adminTeam, ...adminAttendance, ...admin];
        }
    });
}
