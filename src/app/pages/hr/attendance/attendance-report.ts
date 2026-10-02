import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { RoleContextService } from '../role-context.service';
import { AttendanceDayField, AttendanceForgivenessOptions, AttendancePdfColumnKey, AttendanceService, AttendanceSummaryRow } from './attendance.service';

@Component({
    selector: 'app-attendance-report',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, DialogModule, InputNumberModule, InputTextModule, SelectModule, TableModule, TagModule],
    template: `
        <section class="p-5 bg-surface-0 dark:bg-surface-900 border border-surface rounded-lg">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
                <div>
                    <h1 class="text-2xl font-semibold m-0">Reporte semanal de asistencia</h1>
                    <p class="text-muted-color mt-2 mb-0">{{ subtitle() }}</p>
                </div>
                <div class="flex flex-col md:flex-row md:items-center gap-3">
                    <div class="flex flex-col sm:flex-row sm:items-center gap-2">
                        <p-select
                            [ngModel]="selectedMonth()"
                            (ngModelChange)="changeSelectedMonth($event)"
                            [options]="monthOptions"
                            optionLabel="label"
                            optionValue="value"
                            appendTo="body"
                            class="w-full md:w-44"
                        />
                        <p-inputnumber
                            [ngModel]="selectedYear()"
                            (ngModelChange)="changeSelectedYear($event)"
                            [min]="2020"
                            [max]="2100"
                            [useGrouping]="false"
                            inputStyleClass="w-28"
                        />
                        <p-button label="Buscar" icon="pi pi-search" [loading]="loadingStoredWeek() || attendance.loadingStoredImports()" (onClick)="loadStoredWeeksForPeriod()" />
                    </div>
                    @if (canSeeFullAttendanceReport()) {
                        <div class="flex flex-col sm:flex-row sm:items-center gap-2">
                            <input
                                pInputText
                                type="time"
                                class="w-full sm:w-32"
                                [ngModel]="attendance.workdayStartTime()"
                                (ngModelChange)="attendance.setWorkdayStartTime($event)"
                                title="Hora de entrada"
                            />
                            <p-inputnumber
                                [ngModel]="attendance.lateToleranceMinutes()"
                                (ngModelChange)="attendance.setLateToleranceMinutes($event)"
                                [min]="0"
                                [max]="59"
                                suffix=" min"
                                inputStyleClass="w-28"
                                title="Minutos de tolerancia"
                            />
                            <p-inputnumber
                                [ngModel]="attendance.lateRecordsForSaturday()"
                                (ngModelChange)="attendance.setLateRecordsForSaturday($event)"
                                [min]="1"
                                [max]="20"
                                inputStyleClass="w-24"
                                title="Retardos por sábado"
                            />
                        </div>
                    }
                    <div class="flex items-center gap-2">
                        <p-button icon="pi pi-chevron-left" severity="secondary" size="small" outlined [disabled]="!canGoToPreviousWeek() || loadingStoredWeek()" (onClick)="goToPreviousWeek()" />
                        @if (weekOptions().length > 0) {
                            <p-select [ngModel]="attendance.selectedWeekIndex()" (ngModelChange)="selectWeek($event)" [options]="weekOptions()" optionLabel="label" optionValue="value" appendTo="body" class="w-full md:w-72" />
                        }
                        <p-button icon="pi pi-chevron-right" severity="secondary" size="small" outlined [disabled]="!canGoToNextWeek() || loadingStoredWeek()" (onClick)="goToNextWeek()" />
                    </div>
                    @if (canSeeFullAttendanceReport()) {
                        <p-button label="Generar PDF" icon="pi pi-file-pdf" severity="danger" (onClick)="attendance.generatePdf()" />
                    }
                </div>
            </div>

            @if (currentWeekLabel()) {
                <h2 class="text-xl font-semibold mt-0 mb-5">{{ currentWeekLabel() }}</h2>
            }

            <div class="grid grid-cols-12 gap-3 mb-5">
                <div class="col-span-12 md:col-span-3 p-4 border border-surface rounded-lg">
                    <div class="text-sm text-muted-color">Empleados</div>
                    <div class="text-2xl font-semibold mt-1">{{ attendance.simplifiedReport().length }}</div>
                </div>
                <div class="col-span-12 md:col-span-3 p-4 border border-surface rounded-lg">
                    <div class="text-sm text-muted-color">Retardos de la semana</div>
                    <div class="text-2xl font-semibold mt-1">{{ totalLates() }}</div>
                </div>
                <div class="col-span-12 md:col-span-3 p-4 border border-surface rounded-lg">
                    <div class="text-sm text-muted-color">Sábados acumulados</div>
                    <div class="text-2xl font-semibold mt-1">{{ accumulatedSaturdays() }}</div>
                </div>
                <div class="col-span-12 md:col-span-3 p-4 border border-surface rounded-lg">
                    <div class="text-sm text-muted-color">Sábados pendientes</div>
                    <div class="text-2xl font-semibold mt-1">{{ pendingSaturdays() }}</div>
                </div>
            </div>

            @if (loadingStoredWeek()) {
                <div class="py-5 text-center text-muted-color border border-dashed border-surface rounded-lg mb-5">
                    Recuperando semana guardada...
                </div>
            }

            <p-table [value]="attendance.simplifiedReport()" [tableStyle]="{ 'min-width': '112rem' }">
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

            @if (errorMessage()) {
                <p class="mt-3 mb-0 text-sm text-red-500">{{ errorMessage() }}</p>
            }

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
export class AttendanceReport implements OnInit {
    private readonly route = inject(ActivatedRoute);

    private readonly router = inject(Router);

    readonly roleContext = inject(RoleContextService);

    readonly attendance = inject(AttendanceService);

    readonly weekOptions = computed(() => this.attendance.weeks().map((week, value) => ({ label: week.label, value })));

    readonly currentWeekLabel = computed(() => this.attendance.weeks()[this.attendance.selectedWeekIndex()]?.label || '');

    readonly subtitle = computed(() =>
        this.roleContext.currentRole() === 'employee' && !this.attendance.isCurrentUserDirection()
            ? 'Consulta personal de entradas y salidas registradas.'
            : `Resumen simplificado por empleado y semana. Retardo después de las ${this.attendance.lateStartTimeLabel()}.`
    );

    readonly totalLates = computed(() => this.attendance.simplifiedReport().reduce((total, row) => total + row.lateCount, 0));

    readonly accumulatedSaturdays = computed(() => this.attendance.simplifiedReport().reduce((total, row) => total + row.accumulatedSaturdayCount, 0));

    readonly pendingSaturdays = computed(() => this.attendance.simplifiedReport().filter((row) => row.saturdayStatus === 'Pendiente').length);

    readonly errorMessage = signal('');

    readonly loadingStoredWeek = signal(false);

    readonly selectedMonth = signal(new Date().getMonth() + 1);

    readonly selectedYear = signal(new Date().getFullYear());

    readonly monthOptions = [
        { label: 'Enero', value: 1 },
        { label: 'Febrero', value: 2 },
        { label: 'Marzo', value: 3 },
        { label: 'Abril', value: 4 },
        { label: 'Mayo', value: 5 },
        { label: 'Junio', value: 6 },
        { label: 'Julio', value: 7 },
        { label: 'Agosto', value: 8 },
        { label: 'Septiembre', value: 9 },
        { label: 'Octubre', value: 10 },
        { label: 'Noviembre', value: 11 },
        { label: 'Diciembre', value: 12 }
    ];

    permissionDialog = false;

    selectedPermissionCell: { row: AttendanceSummaryRow; field: AttendanceDayField; value: string } | null = null;

    forgivenessDialog = false;

    selectedForgivenessRow: AttendanceSummaryRow | null = null;

    forgivenessOptions: AttendanceForgivenessOptions = {};

    private initialForgivenessOptions: AttendanceForgivenessOptions = {};

    async ngOnInit() {
        const selectedWeekKey = this.route.snapshot.queryParamMap.get('semana');
        this.attendance.clearReportSnapshotResidue();

        if (this.attendance.importedReport()) {
            return;
        }

        if (!selectedWeekKey) {
            await this.loadStoredWeeksForPeriod();
            return;
        }

        this.loadingStoredWeek.set(true);
        this.errorMessage.set('');

        try {
            await this.attendance.openStoredWeek(selectedWeekKey);
            this.syncSelectedPeriodFromCurrentWeek();
        } catch (error) {
            this.errorMessage.set('No pude recuperar la semana guardada desde la base de datos. Revisa que el backend y MongoDB estén encendidos.');
            console.error(error);
        } finally {
            this.loadingStoredWeek.set(false);
        }
    }

    canGoToPreviousWeek() {
        return this.attendance.selectedWeekIndex() > 0;
    }

    canGoToNextWeek() {
        return this.attendance.selectedWeekIndex() < this.attendance.weeks().length - 1;
    }

    async goToPreviousWeek() {
        if (!this.canGoToPreviousWeek()) return;

        await this.selectWeek(this.attendance.selectedWeekIndex() - 1);
    }

    async goToNextWeek() {
        if (!this.canGoToNextWeek()) return;

        await this.selectWeek(this.attendance.selectedWeekIndex() + 1);
    }

    async selectWeek(index: number) {
        this.errorMessage.set('');
        this.loadingStoredWeek.set(true);

        try {
            await this.attendance.openReportWeek(index);
            this.syncWeekRoute();
        } catch (error) {
            this.errorMessage.set('No pude abrir esta semana.');
            console.error(error);
        } finally {
            this.loadingStoredWeek.set(false);
        }
    }

    changeSelectedMonth(month: unknown) {
        const normalizedMonth = Number(month);
        if (!Number.isFinite(normalizedMonth)) return;

        this.selectedMonth.set(normalizedMonth);
        void this.loadStoredWeeksForPeriod();
    }

    changeSelectedYear(year: unknown) {
        const normalizedYear = Number(year);
        if (!Number.isFinite(normalizedYear)) return;

        this.selectedYear.set(normalizedYear);
        void this.loadStoredWeeksForPeriod();
    }

    async loadStoredWeeksForPeriod() {
        this.errorMessage.set('');
        this.loadingStoredWeek.set(true);

        try {
            await this.attendance.loadStoredImports({
                month: this.selectedMonth(),
                year: this.selectedYear()
            });

            const weeks = this.attendance.getStoredWeeksFromLoadedImports({
                month: this.selectedMonth(),
                year: this.selectedYear()
            });

            this.attendance.weeks.set(weeks);

            if (weeks.length === 0) {
                this.attendance.selectedWeekIndex.set(0);
                this.attendance.importedReport.set([]);
                this.syncWeekRoute();
                return;
            }

            await this.selectWeek(weeks.length - 1);
        } catch (error) {
            this.errorMessage.set('No pude cargar las semanas guardadas. Revisa que el backend y MongoDB estén encendidos.');
            console.error(error);
        } finally {
            this.loadingStoredWeek.set(false);
        }
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

    canEditPermissions() {
        return this.canSeeFullAttendanceReport();
    }

    canSeeFullAttendanceReport() {
        return this.roleContext.currentRole() !== 'employee' || this.attendance.isCurrentUserDirection();
    }

    editableAttendanceCellClass() {
        return this.canEditPermissions() ? 'cursor-pointer' : '';
    }

    openPermissionDialog(row: AttendanceSummaryRow, field: AttendanceDayField, value: string) {
        if (!this.canEditPermissions()) return;
        if (this.attendance.isVacationAttendanceCell(value)) return;

        this.errorMessage.set('');
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

    private countLateWorkdays(row: AttendanceSummaryRow) {
        return [row.monday, row.tuesday, row.wednesday, row.thursday, row.friday].filter((value) => this.attendance.isLateAttendanceCell(value)).length;
    }

    private resolveErrorMessage(error: unknown, fallback: string) {
        const apiError = error as { error?: { message?: string }; message?: string };
        return apiError.error?.message || apiError.message || fallback;
    }

    private syncWeekRoute() {
        const week = this.attendance.weeks()[this.attendance.selectedWeekIndex()];

        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: week?.weekKey ? { semana: week.weekKey } : {},
            replaceUrl: true
        });
    }

    private syncSelectedPeriodFromCurrentWeek() {
        const week = this.attendance.weeks()[this.attendance.selectedWeekIndex()];
        const firstDate = week?.dates[0];
        if (!firstDate) return;

        this.selectedMonth.set(firstDate.getMonth() + 1);
        this.selectedYear.set(firstDate.getFullYear());
    }

}
