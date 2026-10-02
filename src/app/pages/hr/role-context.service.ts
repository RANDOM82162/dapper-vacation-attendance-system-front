import { Injectable, computed, signal } from '@angular/core';

export type UserRole = 'employee' | 'manager' | 'admin';

export type EmployeeRole = 'Empleado' | 'Jefe/Director' | 'Administrador';

export interface RoleOption {
    label: string;
    value: UserRole;
    description: string;
}

@Injectable({
    providedIn: 'root'
})
export class RoleContextService {
    readonly roles: RoleOption[] = [
        { label: 'Empleado', value: 'employee', description: 'Solicita vacaciones y consulta su informacion' },
        { label: 'Jefe / Director', value: 'manager', description: 'Autoriza solicitudes y revisa a su equipo' },
        { label: 'Administrador', value: 'admin', description: 'Gestiona empleados, asistencia y configuracion' }
    ];

    readonly currentRole = signal<UserRole>('employee');

    readonly currentRoleLabel = computed(() => this.roles.find((role) => role.value === this.currentRole())?.label ?? 'Empleado');

    setRole(role: UserRole) {
        this.currentRole.set(role);
    }

    setRoleFromEmployeeRole(role: EmployeeRole) {
        const roleMap: Record<EmployeeRole, UserRole> = {
            Empleado: 'employee',
            'Jefe/Director': 'manager',
            Administrador: 'admin'
        };

        this.currentRole.set(roleMap[role] || 'employee');
    }
}
