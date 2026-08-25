import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { FileUploadModule } from 'primeng/fileupload';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { AttendanceService } from './attendance.service';

@Component({
    selector: 'app-upload-attendance',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, FileUploadModule, SelectModule, TableModule, TagModule],
    template: `
        <section class="grid grid-cols-12 gap-4">
            <div class="col-span-12 lg:col-span-5 p-5 bg-surface-0 dark:bg-surface-900 border border-surface rounded-lg">
                <h1 class="text-2xl font-semibold m-0">Cargar registro de asistencia</h1>
                <p class="text-muted-color mt-2 mb-5">Sube el Excel generado desde la maquina de huella para crear el resumen semanal.</p>

                <div class="flex flex-wrap items-center gap-3">
                    <p-fileupload mode="basic" chooseLabel="Seleccionar Excel" chooseIcon="pi pi-upload" accept=".xlsx,.xls,.csv" [auto]="true" [customUpload]="true" (uploadHandler)="onFileUpload($event)" />
                    @if (attendance.importedReport()) {
                        <p-button label="Generar PDF" icon="pi pi-file-pdf" severity="danger" (onClick)="attendance.generatePdf()" />
                    }
                </div>

                @if (fileName()) {
                    <p class="mt-3 mb-0 text-sm text-muted-color">Archivo cargado: {{ fileName() }}</p>
                }

                @if (errorMessage()) {
                    <p class="mt-3 mb-0 text-sm text-red-500">{{ errorMessage() }}</p>
                }

                <div class="mt-5 p-4 rounded-lg border border-dashed border-surface">
                    <div class="font-semibold mb-2">Proceso esperado</div>
                    <ol class="m-0 pl-5 text-muted-color leading-7">
                        <li>RH descarga el archivo desde USB.</li>
                        <li>Se carga el Excel al sistema.</li>
                        <li>El sistema lee entradas y salidas.</li>
                        <li>Se agrupa por empleado, semana y sabado.</li>
                        <li>Se genera un resumen listo para PDF.</li>
                    </ol>
                </div>
            </div>

            <div class="col-span-12 lg:col-span-7 p-5 bg-surface-0 dark:bg-surface-900 border border-surface rounded-lg">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                    <div>
                        <h2 class="text-xl font-semibold m-0">Vista previa</h2>
                    </div>
                    @if (weekOptions().length > 0) {
                        <p-select [ngModel]="attendance.selectedWeekIndex()" (ngModelChange)="attendance.selectWeek($event)" [options]="weekOptions()" optionLabel="label" optionValue="value" class="w-full md:w-72" />
                    } @else {
                        <p-tag value="Sin archivo cargado" severity="info" />
                    }
                </div>
                <p-table [value]="previewRows()" [tableStyle]="{ 'min-width': '92rem' }">
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
            </div>
        </section>
    `
})
export class UploadAttendance {
    readonly attendance = inject(AttendanceService);

    readonly fileName = signal('');

    readonly errorMessage = signal('');

    readonly weekOptions = computed(() => this.attendance.weeks().map((week, value) => ({ label: week.label, value })));

    readonly previewRows = computed(() => (this.attendance.importedReport() ? this.attendance.simplifiedReport() : []));

    async onFileUpload(event: { files?: File[] }) {
        const file = event.files?.[0];
        if (!file) return;

        this.errorMessage.set('');
        this.fileName.set(file.name);

        try {
            await this.attendance.importWorkbook(file);
        } catch (error) {
            this.errorMessage.set('No pude procesar este archivo. Revisa que sea el Excel original de la maquina.');
            console.error(error);
        }
    }
}
