import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { RoleContextService } from '../role-context.service';
import { AttendanceService } from './attendance.service';

@Component({
    selector: 'app-attendance-report',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, SelectModule, TableModule, TagModule],
    template: `
        <section class="p-5 bg-surface-0 dark:bg-surface-900 border border-surface rounded-lg">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
                <div>
                    <h1 class="text-2xl font-semibold m-0">Reporte semanal de asistencia</h1>
                    <p class="text-muted-color mt-2 mb-0">{{ subtitle() }}</p>
                </div>
                <div class="flex flex-col md:flex-row md:items-center gap-3">
                    @if (weekOptions().length > 0) {
                        <p-select [ngModel]="attendance.selectedWeekIndex()" (ngModelChange)="attendance.selectWeek($event)" [options]="weekOptions()" optionLabel="label" optionValue="value" class="w-full md:w-72" />
                    }
                    @if (roleContext.currentRole() !== 'employee') {
                        <p-button label="Generar PDF" icon="pi pi-file-pdf" severity="danger" (onClick)="attendance.generatePdf()" />
                    }
                </div>
            </div>

            <p-table [value]="attendance.simplifiedReport()" [tableStyle]="{ 'min-width': '92rem' }">
                <ng-template #header>
                    <tr>
                        <th>Departamento</th>
                        <th>Empleado</th>
                        <th>Lunes</th>
                        <th>Martes</th>
                        <th>Miercoles</th>
                        <th>Jueves</th>
                        <th>Viernes</th>
                        <th>Sabado</th>
                        <th>Observaciones</th>
                        <th>Retardos</th>
                        <th>Con permiso</th>
                        <th>Acumulados</th>
                    </tr>
                </ng-template>
                <ng-template #body let-row>
                    <tr>
                        <td>{{ row.department }}</td>
                        <td>{{ row.employee }}</td>
                        <td>{{ row.monday }}</td>
                        <td>{{ row.tuesday }}</td>
                        <td>{{ row.wednesday }}</td>
                        <td>{{ row.thursday }}</td>
                        <td>{{ row.friday }}</td>
                        <td>{{ row.saturday }}</td>
                        <td><p-tag [value]="row.observations" [severity]="row.severity" /></td>
                        <td>{{ row.lateCount }}</td>
                        <td>{{ row.permissionLateCount }}</td>
                        <td>{{ row.accumulatedLateCount }}</td>
                    </tr>
                </ng-template>
                <ng-template #emptymessage>
                    <tr>
                        <td colspan="12" class="text-center py-6 text-muted-color">No se ha cargado ningun Excel.</td>
                    </tr>
                </ng-template>
            </p-table>
        </section>
    `
})
export class AttendanceReport {
    readonly roleContext = inject(RoleContextService);

    readonly attendance = inject(AttendanceService);

    readonly weekOptions = computed(() => this.attendance.weeks().map((week, value) => ({ label: week.label, value })));

    readonly subtitle = computed(() =>
        this.roleContext.currentRole() === 'employee'
            ? 'Consulta personal de entradas y salidas registradas.'
            : 'Resumen simplificado por empleado y semana.'
    );
}
