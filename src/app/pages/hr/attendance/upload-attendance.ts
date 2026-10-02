import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { FileUploadModule } from 'primeng/fileupload';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { RoleContextService } from '../role-context.service';
import { AttendanceDayField, AttendanceForgivenessOptions, AttendancePdfColumnKey, AttendanceService, AttendanceSummaryRow } from './attendance.service';

@Component({
    selector: 'app-upload-attendance',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, DialogModule, FileUploadModule, InputNumberModule, InputTextModule, SelectModule, TableModule, TagModule, TextareaModule],
    template: `
        <section class="grid grid-cols-12 gap-4">
            <div class="col-span-12 lg:col-span-5 p-5 bg-surface-0 dark:bg-surface-900 border border-surface rounded-lg">
                <h1 class="text-2xl font-semibold m-0">Cargar registro de asistencia</h1>
                <p class="text-muted-color mt-2 mb-5">Sube el Excel generado desde la máquina de huella para crear el resumen semanal.</p>

                <div class="mb-5 p-4 rounded-lg border border-surface bg-surface-50 dark:bg-surface-800">
                    <div class="flex items-center justify-between gap-3 mb-3">
                        <div>
                            <h2 class="text-lg font-semibold m-0">Configuración de asistencia</h2>
                            <p class="text-sm text-muted-color mt-1 mb-0">Reglas usadas para calcular retardos y sábados generados.</p>
                        </div>
                        @if (attendance.savingAttendanceSettings()) {
                            <p-tag value="Guardando" severity="info" />
                        }
                    </div>
                    <div class="grid grid-cols-12 gap-3">
                        <div class="col-span-12 md:col-span-4">
                            <label for="workdayStartTime" class="block font-semibold mb-2">Hora de entrada</label>
                            <input
                                id="workdayStartTime"
                                pInputText
                                type="time"
                                class="w-full"
                                [ngModel]="attendance.workdayStartTime()"
                                (ngModelChange)="attendance.setWorkdayStartTime($event)"
                            />
                        </div>
                        <div class="col-span-12 md:col-span-4">
                            <label for="lateTolerance" class="block font-semibold mb-2">Tolerancia</label>
                            <p-inputnumber
                                inputId="lateTolerance"
                                [ngModel]="attendance.lateToleranceMinutes()"
                                (ngModelChange)="attendance.setLateToleranceMinutes($event)"
                                [min]="0"
                                [max]="59"
                                suffix=" min"
                                class="w-full"
                            />
                        </div>
                        <div class="col-span-12 md:col-span-4">
                            <label for="lateRecordsForSaturday" class="block font-semibold mb-2">Retardos por sábado</label>
                            <p-inputnumber
                                inputId="lateRecordsForSaturday"
                                [ngModel]="attendance.lateRecordsForSaturday()"
                                (ngModelChange)="attendance.setLateRecordsForSaturday($event)"
                                [min]="1"
                                [max]="20"
                                class="w-full"
                            />
                        </div>
                    </div>
                    <p class="text-sm text-muted-color mt-2 mb-0">Con el valor actual, el retardo inicia después de las {{ attendance.lateStartTimeLabel() }}.</p>
                </div>

                <div class="mb-5">
                    <div class="flex items-center justify-between gap-3 mb-2">
                        <label for="excludedPeople" class="block font-semibold">Personas excluidas</label>
                        <p-button label="Restaurar valores predeterminados" icon="pi pi-refresh" size="small" severity="secondary" text (onClick)="attendance.resetExcludedPeople()" />
                    </div>
                    <textarea
                        id="excludedPeople"
                        pTextarea
                        rows="4"
                        class="w-full"
                        [ngModel]="attendance.excludedPeopleText()"
                        (ngModelChange)="attendance.setExcludedPeopleFromText($event)"
                    ></textarea>
                    <p class="text-sm text-muted-color mt-2 mb-0">Una persona por línea o separadas por coma. Estas personas no aparecerán en la vista previa ni en el PDF.</p>
                </div>

                <div class="flex flex-wrap items-center gap-3">
                    <p-fileupload mode="basic" chooseLabel="Seleccionar Excel" chooseIcon="pi pi-upload" accept=".xlsx,.xls,.csv" [auto]="true" [customUpload]="true" (uploadHandler)="onFileUpload($event)" />
                    @if (attendance.importedReport()) {
                        <p-button label="Guardar en base de datos" icon="pi pi-database" severity="success" [loading]="attendance.savingToDatabase()" (onClick)="saveToDatabase()" />
                        <p-button label="Generar PDF" icon="pi pi-file-pdf" severity="danger" (onClick)="attendance.generatePdf()" />
                    }
                </div>

                @if (fileName()) {
                    <p class="mt-3 mb-0 text-sm text-muted-color">Archivo cargado: {{ fileName() }}</p>
                }

                @if (saveMessage()) {
                    <p class="mt-3 mb-0 text-sm text-green-500">{{ saveMessage() }}</p>
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
                        <li>Se agrupa por empleado, semana y sábado.</li>
                        <li>Se identifican retardos, acumulados y sábados pendientes.</li>
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
                <p-table [value]="previewRows()" [tableStyle]="{ 'min-width': '112rem' }">
                    <ng-template #header>
                        <tr>
                            <th>PDF</th>
                            @if (canSeeFullAttendanceReport()) {
                                <th>Ajustes</th>
                            }
                            @for (column of attendance.pdfColumns; track column.key) {
                                <th [ngClass]="pdfColumnClass(column.key)">
                                    <div class="flex items-center gap-2">
                                        <span>{{ column.label }}</span>
                                        <button
                                            type="button"
                                            class="p-0 border-0 bg-transparent cursor-pointer"
                                            [ngClass]="attendance.isPdfColumnVisible(column.key) ? 'text-primary' : 'text-muted-color opacity-60'"
                                            (click)="togglePdfColumn($event, column.key)"
                                            [title]="attendance.isPdfColumnVisible(column.key) ? 'Ocultar en PDF' : 'Mostrar en PDF'"
                                        >
                                            <i [class]="pdfColumnIcon(column.key)"></i>
                                        </button>
                                    </div>
                                </th>
                            }
                        </tr>
                    </ng-template>
                    <ng-template #body let-row>
                        <tr [ngClass]="rowClass(row)">
                            <td>
                                <button
                                    type="button"
                                    class="p-0 border-0 bg-transparent cursor-pointer"
                                    [ngClass]="attendance.isPdfRowVisible(row) ? 'text-primary' : 'text-muted-color opacity-60'"
                                    (click)="togglePdfRow(row)"
                                    [title]="attendance.isPdfRowVisible(row) ? 'Ocultar fila en PDF' : 'Mostrar fila en PDF'"
                                >
                                    <i [class]="pdfRowIcon(row)"></i>
                                </button>
                            </td>
                            @if (canSeeFullAttendanceReport()) {
                                <td>
                                    <p-button
                                        icon="pi pi-check-circle"
                                        severity="secondary"
                                        size="small"
                                        outlined
                                        [disabled]="!hasForgivableItems(row) || attendance.updatingPermission()"
                                        [title]="hasForgivableItems(row) ? 'Editar observaciones perdonadas' : 'Sin observaciones por editar'"
                                        (onClick)="openForgivenessDialog(row)"
                                    />
                                </td>
                            }
                            <td [ngClass]="pdfColumnClass('department')">{{ row.department }}</td>
                            <td [ngClass]="pdfColumnClass('employee')">{{ row.employee }}</td>
                            <td [ngClass]="[attendanceCellClass(row.monday), pdfColumnClass('monday'), editableAttendanceCellClass()]" (click)="openPermissionDialog(row, 'monday', row.monday)">
                                <span class="inline-flex items-center gap-2">
                                    <span>{{ row.monday }}</span>
                                    @if (canEditPermissions()) {
                                        <i class="pi pi-angle-down text-xs text-muted-color"></i>
                                    }
                                </span>
                            </td>
                            <td [ngClass]="[attendanceCellClass(row.tuesday), pdfColumnClass('tuesday'), editableAttendanceCellClass()]" (click)="openPermissionDialog(row, 'tuesday', row.tuesday)">
                                <span class="inline-flex items-center gap-2">
                                    <span>{{ row.tuesday }}</span>
                                    @if (canEditPermissions()) {
                                        <i class="pi pi-angle-down text-xs text-muted-color"></i>
                                    }
                                </span>
                            </td>
                            <td [ngClass]="[attendanceCellClass(row.wednesday), pdfColumnClass('wednesday'), editableAttendanceCellClass()]" (click)="openPermissionDialog(row, 'wednesday', row.wednesday)">
                                <span class="inline-flex items-center gap-2">
                                    <span>{{ row.wednesday }}</span>
                                    @if (canEditPermissions()) {
                                        <i class="pi pi-angle-down text-xs text-muted-color"></i>
                                    }
                                </span>
                            </td>
                            <td [ngClass]="[attendanceCellClass(row.thursday), pdfColumnClass('thursday'), editableAttendanceCellClass()]" (click)="openPermissionDialog(row, 'thursday', row.thursday)">
                                <span class="inline-flex items-center gap-2">
                                    <span>{{ row.thursday }}</span>
                                    @if (canEditPermissions()) {
                                        <i class="pi pi-angle-down text-xs text-muted-color"></i>
                                    }
                                </span>
                            </td>
                            <td [ngClass]="[attendanceCellClass(row.friday), pdfColumnClass('friday'), editableAttendanceCellClass()]" (click)="openPermissionDialog(row, 'friday', row.friday)">
                                <span class="inline-flex items-center gap-2">
                                    <span>{{ row.friday }}</span>
                                    @if (canEditPermissions()) {
                                        <i class="pi pi-angle-down text-xs text-muted-color"></i>
                                    }
                                </span>
                            </td>
                            <td [ngClass]="[attendanceCellClass(row.saturday), pdfColumnClass('saturday'), editableAttendanceCellClass()]" (click)="openPermissionDialog(row, 'saturday', row.saturday)">
                                <span class="inline-flex items-center gap-2">
                                    <span>{{ row.saturday }}</span>
                                    @if (canEditPermissions()) {
                                        <i class="pi pi-angle-down text-xs text-muted-color"></i>
                                    }
                                </span>
                            </td>
                            <td [ngClass]="pdfColumnClass('saturdayDueDate')">{{ row.saturdayDueDate }}</td>
                            <td [ngClass]="pdfColumnClass('saturdayStatus')"><p-tag [value]="row.saturdayStatus" [severity]="saturdaySeverity(row.saturdayStatus)" /></td>
                            <td [ngClass]="pdfColumnClass('observations')"><p-tag [value]="row.observations" [severity]="row.severity" /></td>
                            <td [ngClass]="pdfColumnClass('lateCount')">{{ row.lateCount }}</td>
                            <td [ngClass]="pdfColumnClass('permissionLateCount')">{{ row.permissionLateCount }}</td>
                            <td [ngClass]="pdfColumnClass('accumulatedLateCount')">{{ row.accumulatedLateCount }}</td>
                            <td [ngClass]="pdfColumnClass('accumulatedSaturdayCount')">{{ row.accumulatedSaturdayCount }}</td>
                        </tr>
                    </ng-template>
                    <ng-template #emptymessage>
                        <tr>
                            <td [attr.colspan]="canSeeFullAttendanceReport() ? 17 : 16" class="text-center py-6 text-muted-color">No se ha cargado ningún Excel.</td>
                        </tr>
                    </ng-template>
                </p-table>
            </div>

            <p-dialog [(visible)]="permissionDialog" [modal]="true" [draggable]="false" [dismissableMask]="true" [style]="{ width: 'min(420px, 92vw)' }" header="Permiso">
                @if (selectedPermissionCell) {
                    <div class="flex flex-col gap-3">
                        <div>
                            <span class="block text-sm text-muted-color">Empleado</span>
                            <span class="font-semibold">{{ selectedPermissionCell.row.employee }}</span>
                        </div>
                        <div>
                            <span class="block text-sm text-muted-color">Registro actual</span>
                            <span class="font-semibold">{{ selectedPermissionCell.value }}</span>
                        </div>
                    </div>
                }

                <ng-template #footer>
                    <p-button label="Cancelar" icon="pi pi-times" severity="secondary" text (onClick)="closePermissionDialog()" />
                    <p-button label="Quitar permiso" icon="pi pi-undo" severity="secondary" outlined [loading]="attendance.updatingPermission()" [disabled]="!selectedPermissionCell || !attendance.isPermissionAttendanceCell(selectedPermissionCell.value)" (onClick)="setPermission(false)" />
                    <p-button label="Marcar permiso" icon="pi pi-check" [loading]="attendance.updatingPermission()" (onClick)="setPermission(true)" />
                </ng-template>
            </p-dialog>

            <p-dialog [(visible)]="forgivenessDialog" [modal]="true" [draggable]="false" [dismissableMask]="true" [style]="{ width: 'min(460px, 92vw)' }" header="Editar observaciones">
                @if (selectedForgivenessRow) {
                    <div class="flex flex-col gap-4">
                        <div>
                            <span class="block text-sm text-muted-color">Empleado</span>
                            <span class="font-semibold">{{ selectedForgivenessRow.employee }}</span>
                        </div>
                        <p class="m-0 text-sm text-muted-color">Marca para perdonar. Desmarca para volver a contar la observación.</p>
                        <div class="flex flex-col gap-3">
                            <label class="flex items-center justify-between gap-4 p-3 border border-surface rounded-lg">
                                <span>
                                    <span class="block font-medium">Retardos de la semana</span>
                                    <span class="block text-sm text-muted-color">{{ forgivenessLateCountLabel(selectedForgivenessRow) }}</span>
                                </span>
                                <input type="checkbox" [(ngModel)]="forgivenessOptions.forgiveLateCount" [disabled]="!canToggleLateForgiveness(selectedForgivenessRow)" />
                            </label>
                            <label class="flex items-center justify-between gap-4 p-3 border border-surface rounded-lg">
                                <span>
                                    <span class="block font-medium">Sábados pendientes</span>
                                    <span class="block text-sm text-muted-color">{{ forgivenessSaturdayCountLabel(selectedForgivenessRow) }}</span>
                                </span>
                                <input type="checkbox" [(ngModel)]="forgivenessOptions.forgiveAccumulatedSaturdayCount" [disabled]="!canToggleAccumulatedSaturdayForgiveness(selectedForgivenessRow)" />
                            </label>
                            <label class="flex items-center justify-between gap-4 p-3 border border-surface rounded-lg">
                                <span>
                                    <span class="block font-medium">Días acumulados</span>
                                    <span class="block text-sm text-muted-color">{{ forgivenessAccumulatedLateCountLabel(selectedForgivenessRow) }}</span>
                                </span>
                                <input type="checkbox" [(ngModel)]="forgivenessOptions.forgiveAccumulatedLateCount" [disabled]="!canToggleAccumulatedLateForgiveness(selectedForgivenessRow)" />
                            </label>
                        </div>
                    </div>
                }

                <ng-template #footer>
                    <p-button label="Cancelar" icon="pi pi-times" severity="secondary" text (onClick)="closeForgivenessDialog()" />
                    <p-button label="Guardar cambios" icon="pi pi-check" [loading]="attendance.updatingPermission()" [disabled]="!hasForgivenessChanges()" (onClick)="applyForgiveness()" />
                </ng-template>
            </p-dialog>
        </section>
    `
})
export class UploadAttendance {
    readonly attendance = inject(AttendanceService);

    readonly roleContext = inject(RoleContextService);

    readonly fileName = signal('');

    readonly errorMessage = signal('');

    readonly saveMessage = signal('');

    readonly weekOptions = computed(() => this.attendance.weeks().map((week, value) => ({ label: week.label, value })));

    readonly previewRows = computed(() => (this.attendance.importedReport() ? this.attendance.simplifiedReport() : []));

    permissionDialog = false;

    selectedPermissionCell: { row: AttendanceSummaryRow; field: AttendanceDayField; value: string } | null = null;

    forgivenessDialog = false;

    selectedForgivenessRow: AttendanceSummaryRow | null = null;

    forgivenessOptions: AttendanceForgivenessOptions = {};

    private initialForgivenessOptions: AttendanceForgivenessOptions = {};

    canSeeFullAttendanceReport() {
        return this.roleContext.currentRole() !== 'employee' || this.attendance.isCurrentUserDirection();
    }

    canEditPermissions() {
        return this.canSeeFullAttendanceReport();
    }

    editableAttendanceCellClass() {
        return this.canEditPermissions() ? 'cursor-pointer' : '';
    }

    saturdaySeverity(status: string) {
        if (status === 'Se presentó') return 'success';
        if (status === 'Pendiente') return 'danger';
        return 'secondary';
    }

    attendanceCellClass(value: unknown) {
        if (this.attendance.isVacationAttendanceCell(value)) {
            return 'bg-emerald-100 text-emerald-900 font-medium dark:bg-emerald-950/50 dark:text-emerald-200';
        }

        if (this.attendance.isMissingAttendanceCell(value)) {
            return 'bg-red-100 text-red-900 font-medium dark:bg-red-950/50 dark:text-red-200';
        }

        if (this.attendance.isPermissionAttendanceCell(value)) {
            return 'bg-blue-100 text-blue-900 font-medium dark:bg-blue-950/50 dark:text-blue-200';
        }

        if (this.attendance.isLateAttendanceCell(value)) {
            return 'bg-yellow-100 text-yellow-900 font-medium';
        }

        return '';
    }

    rowClass(row: AttendanceSummaryRow) {
        if (!this.attendance.isPdfRowVisible(row)) return 'opacity-50 bg-surface-100 dark:bg-surface-800/70';
        if (row.severity === 'danger') return 'bg-red-50 dark:bg-red-950/30';
        if (row.severity === 'warn') return 'bg-yellow-50 dark:bg-yellow-950/30';

        return null;
    }

    togglePdfColumn(event: MouseEvent, columnKey: AttendancePdfColumnKey) {
        event.stopPropagation();
        this.attendance.togglePdfColumn(columnKey);
    }

    togglePdfRow(row: AttendanceSummaryRow) {
        this.attendance.togglePdfRow(row);
    }

    pdfColumnIcon(columnKey: AttendancePdfColumnKey) {
        return this.attendance.isPdfColumnVisible(columnKey) ? 'pi pi-eye' : 'pi pi-eye-slash';
    }

    pdfRowIcon(row: AttendanceSummaryRow) {
        return this.attendance.isPdfRowVisible(row) ? 'pi pi-eye' : 'pi pi-eye-slash';
    }

    pdfColumnClass(columnKey: AttendancePdfColumnKey) {
        return this.attendance.isPdfColumnVisible(columnKey) ? '' : 'opacity-50 bg-surface-100 dark:bg-surface-800/70';
    }

    hasForgivableItems(row: AttendanceSummaryRow) {
        return this.canToggleLateForgiveness(row) || this.canToggleAccumulatedSaturdayForgiveness(row) || this.canToggleAccumulatedLateForgiveness(row);
    }

    openForgivenessDialog(row: AttendanceSummaryRow) {
        this.errorMessage.set('');
        this.selectedForgivenessRow = row;
        this.initialForgivenessOptions = {
            forgiveLateCount: Boolean(row.forgivenLateCount),
            forgiveAccumulatedSaturdayCount: Boolean(row.forgivenAccumulatedSaturdayCount),
            forgiveAccumulatedLateCount: Boolean(row.forgivenAccumulatedLateCount)
        };
        this.forgivenessOptions = {
            forgiveLateCount: Boolean(row.forgivenLateCount) || row.lateCount > 0,
            forgiveAccumulatedSaturdayCount: Boolean(row.forgivenAccumulatedSaturdayCount) || row.accumulatedSaturdayCount > 0,
            forgiveAccumulatedLateCount: Boolean(row.forgivenAccumulatedLateCount) || row.accumulatedLateCount > 0
        };
        this.forgivenessDialog = true;
    }

    closeForgivenessDialog() {
        this.forgivenessDialog = false;
        this.selectedForgivenessRow = null;
        this.forgivenessOptions = {};
        this.initialForgivenessOptions = {};
    }

    hasForgivenessChanges() {
        return (
            Boolean(this.forgivenessOptions.forgiveLateCount) !== Boolean(this.initialForgivenessOptions.forgiveLateCount) ||
            Boolean(this.forgivenessOptions.forgiveAccumulatedSaturdayCount) !== Boolean(this.initialForgivenessOptions.forgiveAccumulatedSaturdayCount) ||
            Boolean(this.forgivenessOptions.forgiveAccumulatedLateCount) !== Boolean(this.initialForgivenessOptions.forgiveAccumulatedLateCount)
        );
    }

    canToggleLateForgiveness(row: AttendanceSummaryRow) {
        return row.lateCount > 0 || Boolean(row.forgivenLateCount);
    }

    canToggleAccumulatedSaturdayForgiveness(row: AttendanceSummaryRow) {
        return row.accumulatedSaturdayCount > 0 || Boolean(row.forgivenAccumulatedSaturdayCount);
    }

    canToggleAccumulatedLateForgiveness(row: AttendanceSummaryRow) {
        return row.accumulatedLateCount > 0 || Boolean(row.forgivenAccumulatedLateCount);
    }

    forgivenessLateCountLabel(row: AttendanceSummaryRow) {
        const count = row.forgivenLateCount ? this.countLateWorkdays(row) : row.lateCount;
        return row.forgivenLateCount ? `${count} perdonado(s)` : `${count} registrado(s)`;
    }

    forgivenessSaturdayCountLabel(row: AttendanceSummaryRow) {
        const count = row.forgivenAccumulatedSaturdayCount ? row.forgivenOriginalAccumulatedSaturdayCount ?? row.accumulatedSaturdayCount : row.accumulatedSaturdayCount;
        return row.forgivenAccumulatedSaturdayCount ? `${count} perdonado(s)` : `${count} pendiente(s)`;
    }

    forgivenessAccumulatedLateCountLabel(row: AttendanceSummaryRow) {
        const count = row.forgivenAccumulatedLateCount ? row.forgivenOriginalAccumulatedLateCount ?? row.accumulatedLateCount : row.accumulatedLateCount;
        return row.forgivenAccumulatedLateCount ? `${count} perdonado(s)` : `${count} acumulado(s)`;
    }

    async applyForgiveness() {
        if (!this.selectedForgivenessRow || !this.hasForgivenessChanges()) return;

        const changedOptions: AttendanceForgivenessOptions = {};

        if (Boolean(this.forgivenessOptions.forgiveLateCount) !== Boolean(this.initialForgivenessOptions.forgiveLateCount)) {
            changedOptions.forgiveLateCount = Boolean(this.forgivenessOptions.forgiveLateCount);
        }

        if (Boolean(this.forgivenessOptions.forgiveAccumulatedSaturdayCount) !== Boolean(this.initialForgivenessOptions.forgiveAccumulatedSaturdayCount)) {
            changedOptions.forgiveAccumulatedSaturdayCount = Boolean(this.forgivenessOptions.forgiveAccumulatedSaturdayCount);
        }

        if (Boolean(this.forgivenessOptions.forgiveAccumulatedLateCount) !== Boolean(this.initialForgivenessOptions.forgiveAccumulatedLateCount)) {
            changedOptions.forgiveAccumulatedLateCount = Boolean(this.forgivenessOptions.forgiveAccumulatedLateCount);
        }

        try {
            await this.attendance.forgiveAttendanceObservations(
                this.selectedForgivenessRow.employee,
                changedOptions,
                this.selectedForgivenessRow.attendanceRecordId
            );
            this.closeForgivenessDialog();
        } catch (error) {
            this.errorMessage.set(this.resolveErrorMessage(error, 'No pude actualizar las observaciones. Revisa que el backend esté encendido.'));
            console.error(error);
        }
    }

    openPermissionDialog(row: AttendanceSummaryRow, field: AttendanceDayField, value: string) {
        if (!this.canEditPermissions()) return;
        if (this.attendance.isVacationAttendanceCell(value)) return;

        this.selectedPermissionCell = { row, field, value };
        this.permissionDialog = true;
    }

    closePermissionDialog() {
        this.permissionDialog = false;
        this.selectedPermissionCell = null;
    }

    async setPermission(hasPermission: boolean) {
        if (!this.selectedPermissionCell) return;

        try {
            await this.attendance.setManualPermission(
                this.selectedPermissionCell.row.employee,
                this.selectedPermissionCell.field,
                hasPermission,
                this.selectedPermissionCell.row.attendanceRecordId
            );
            this.closePermissionDialog();
        } catch (error) {
            this.errorMessage.set(this.resolveErrorMessage(error, 'No pude actualizar el permiso. Revisa que el backend esté encendido.'));
            console.error(error);
        }
    }

    private countLateWorkdays(row: AttendanceSummaryRow) {
        return [row.monday, row.tuesday, row.wednesday, row.thursday, row.friday].filter((value) => this.attendance.isLateAttendanceCell(value)).length;
    }

    async onFileUpload(event: { files?: File[] }) {
        const file = event.files?.[0];
        if (!file) return;

        this.errorMessage.set('');
        this.saveMessage.set('');
        this.fileName.set(file.name);

        try {
            await this.attendance.importWorkbook(file);
        } catch (error) {
            this.errorMessage.set('No pude procesar este archivo. Revisa que sea el Excel original de la máquina.');
            console.error(error);
        }
    }

    async saveToDatabase() {
        this.errorMessage.set('');
        this.saveMessage.set('');

        try {
            const result = await this.attendance.saveImportedWeeks(this.fileName());
            const savedText = `${result.insertedWeeks.length} semana${result.insertedWeeks.length === 1 ? '' : 's'} guardada${result.insertedWeeks.length === 1 ? '' : 's'}`;
            const skippedText = `${result.skippedWeeks.length} semana${result.skippedWeeks.length === 1 ? '' : 's'} omitida${result.skippedWeeks.length === 1 ? '' : 's'} por ya existir`;
            this.saveMessage.set(`${savedText}. ${skippedText}.`);
        } catch (error) {
            this.errorMessage.set(this.resolveErrorMessage(error, 'No pude guardar la asistencia en la base de datos. Revisa que el backend esté encendido.'));
            console.error(error);
        }
    }

    private resolveErrorMessage(error: unknown, fallback: string) {
        const apiError = error as { error?: { message?: string }; message?: string };
        return apiError.error?.message || apiError.message || fallback;
    }
}
