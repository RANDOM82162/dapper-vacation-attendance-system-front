import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

@Component({
    selector: 'app-employees',
    standalone: true,
    imports: [CommonModule, ButtonModule, TableModule, TagModule],
    template: `
        <section class="p-5 bg-surface-0 dark:bg-surface-900 border border-surface rounded-lg">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
                <div>
                    <h1 class="text-2xl font-semibold m-0">Empleados</h1>
                    <p class="text-muted-color mt-2 mb-0">Base para relacionar usuarios, departamentos, jefes y saldos.</p>
                </div>
                <p-button label="Nuevo empleado" icon="pi pi-plus" />
            </div>

            <p-table [value]="employees" [tableStyle]="{ 'min-width': '65rem' }">
                <ng-template #header>
                    <tr>
                        <th>Nombre</th>
                        <th>Departamento</th>
                        <th>Perfil</th>
                        <th>Jefe directo</th>
                        <th>Estado</th>
                    </tr>
                </ng-template>
                <ng-template #body let-employee>
                    <tr>
                        <td>{{ employee.name }}</td>
                        <td>{{ employee.department }}</td>
                        <td>{{ employee.role }}</td>
                        <td>{{ employee.manager }}</td>
                        <td><p-tag [value]="employee.status" [severity]="employee.severity" /></td>
                    </tr>
                </ng-template>
            </p-table>
        </section>
    `
})
export class Employees {
    employees = [
        { name: 'Jose Alejandro Paz', department: 'Desarrollo', role: 'Empleado', manager: 'Mariana Torres', status: 'Activo', severity: 'success' },
        { name: 'Mariana Torres', department: 'Desarrollo', role: 'Jefe / Director', manager: 'Direccion general', status: 'Activo', severity: 'success' },
        { name: 'Laura Herrera', department: 'Recursos Humanos', role: 'Administrador', manager: 'Direccion general', status: 'Activo', severity: 'success' }
    ];
}
