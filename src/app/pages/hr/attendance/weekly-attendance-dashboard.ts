import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { AttendanceDashboardWeek, AttendanceService, AttendanceStoredImport } from './attendance.service';

@Component({
    selector: 'app-weekly-attendance-dashboard',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, DialogModule, InputNumberModule, SelectModule, TableModule, TagModule],
    template: `
        <section class="p-5 bg-surface-0 dark:bg-surface-900 border border-surface rounded-lg mb-4">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
                <div>
                    <h1 class="text-2xl font-semibold m-0">Dashboard semanal</h1>
                    <p class="text-muted-color mt-2 mb-0">Selecciona una semana para revisar el detalle de asistencia.</p>
                </div>
                <p-button label="Cargar Excel" icon="pi pi-upload" severity="secondary" (onClick)="goToUpload()" />
            </div>

            @if (weeks().length > 0) {
                <div class="border border-surface rounded-lg overflow-hidden">
                    <div class="grid grid-cols-12 gap-3 px-4 py-3 text-sm font-semibold bg-surface-100 dark:bg-surface-800">
                        <div class="col-span-12 md:col-span-3">Semana</div>
                        <div class="col-span-6 md:col-span-2">Empleados</div>
                        <div class="col-span-6 md:col-span-2">Retardos</div>
                        <div class="col-span-6 md:col-span-2">Faltas</div>
                        <div class="col-span-6 md:col-span-2">Sábados pendientes</div>
                        <div class="col-span-12 md:col-span-1 text-right">Detalle</div>
                    </div>
                    @for (week of weeks(); track week.label) {
                        <div class="grid grid-cols-12 gap-3 items-center px-4 py-3 border-t border-surface">
                            <div class="col-span-12 md:col-span-3 flex items-center gap-2">
                                <span class="font-semibold">{{ week.label }}</span>
                            </div>
                            <div class="col-span-6 md:col-span-2">{{ week.totalEmployees }}</div>
                            <div class="col-span-6 md:col-span-2">{{ week.totalLates }}</div>
                            <div class="col-span-6 md:col-span-2">{{ week.totalMissing }}</div>
                            <div class="col-span-6 md:col-span-2">{{ week.pendingSaturdays }}</div>
                            <div class="col-span-12 md:col-span-1 md:text-right">
                                <p-button icon="pi pi-arrow-right" severity="secondary" size="small" outlined (onClick)="openWeek(week)" />
                            </div>
                        </div>
                    }
                </div>
            } @else if (storedWeekCards().length > 0) {
                <div class="border border-surface rounded-lg overflow-hidden">
                    <div class="grid grid-cols-12 gap-3 px-4 py-3 text-sm font-semibold bg-surface-100 dark:bg-surface-800">
                        <div class="col-span-12 md:col-span-3">Semana</div>
                        <div class="col-span-12 md:col-span-5">Archivo</div>
                        <div class="col-span-12 md:col-span-3">Fecha de carga</div>
                        <div class="col-span-4 md:col-span-1 text-right">Detalle</div>
                    </div>
                    @for (week of storedWeekCards(); track week.weekKey) {
                        <div class="grid grid-cols-12 gap-3 items-center px-4 py-3 border-t border-surface">
                            <div class="col-span-12 md:col-span-3 font-semibold">{{ week.weekLabel }}</div>
                            <div class="col-span-12 md:col-span-5 text-muted-color">{{ week.sourceFileName || 'Archivo sin nombre' }}</div>
                            <div class="col-span-12 md:col-span-3 text-muted-color">{{ week.uploadedAtLabel }}</div>
                            <div class="col-span-4 md:col-span-1 text-right">
                                <p-button icon="pi pi-arrow-right" severity="secondary" size="small" outlined (onClick)="openStoredWeek(week.weekKey)" />
                            </div>
                        </div>
                    }
                </div>
            } @else {
                <div class="py-8 text-center border border-dashed border-surface rounded-lg">
                    <div class="font-semibold mb-2">Sin semanas guardadas</div>
                    <p class="text-muted-color mt-0 mb-0">No hay semanas para el mes y año seleccionados.</p>
                </div>
            }
        </section>

        <section class="p-5 bg-surface-0 dark:bg-surface-900 border border-surface rounded-lg">
            <div class="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-5">
                <div>
                    <h2 class="text-xl font-semibold m-0">Historial de cargas</h2>
                    <p class="text-muted-color mt-2 mb-0">Consulta los Excel guardados y abre semanas anteriores por mes y año.</p>
                </div>
                <div class="flex flex-col md:flex-row md:items-center gap-3">
                    <p-select [ngModel]="selectedMonth()" (ngModelChange)="changeSelectedMonth($event)" [options]="monthOptions" optionLabel="label" optionValue="value" class="w-full md:w-44" />
                    <p-inputnumber [ngModel]="selectedYear()" (ngModelChange)="changeSelectedYear($event)" [min]="2020" [max]="2100" [useGrouping]="false" inputStyleClass="w-28" />
                    <p-button label="Buscar" icon="pi pi-search" [loading]="attendance.loadingStoredImports()" (onClick)="loadStoredImports()" />
                </div>
            </div>

            <p-table [value]="attendance.storedImports()" [tableStyle]="{ 'min-width': '64rem' }">
                <ng-template #header>
                    <tr>
                        <th>Archivo</th>
                        <th>Fecha de carga</th>
                        <th>Semanas guardadas</th>
                        <th>Semanas omitidas</th>
                        <th>Registros</th>
                        <th>Consultar</th>
                        <th>Acciones</th>
                    </tr>
                </ng-template>
                <ng-template #body let-importItem>
                    <tr>
                        <td>{{ importItem.sourceFileName || 'Archivo sin nombre' }}</td>
                        <td>{{ formatUploadDate(importItem) }}</td>
                        <td><p-tag [value]="(importItem.insertedWeeks?.length ?? savedWeeks(importItem).length) + ''" severity="success" /></td>
                        <td><p-tag [value]="(importItem.skippedWeeks?.length ?? 0) + ''" severity="secondary" /></td>
                        <td>{{ importItem.insertedRecords ?? '-' }} guardados</td>
                        <td>
                            <div class="flex flex-wrap gap-2">
                                @for (week of savedWeeks(importItem); track week.weekKey) {
                                    <p-button [label]="week.weekLabel" size="small" severity="secondary" outlined (onClick)="openStoredWeek(week.weekKey)" />
                                }
                            </div>
                        </td>
                        <td>
                            @if (importItem._id) {
                                <p-button icon="pi pi-trash" label="Eliminar" severity="danger" size="small" outlined (onClick)="confirmDeleteImport(importItem)" />
                            }
                        </td>
                    </tr>
                </ng-template>
                <ng-template #emptymessage>
                    <tr>
                        <td colspan="7" class="text-center py-6 text-muted-color">No hay cargas guardadas para este periodo.</td>
                    </tr>
                </ng-template>
            </p-table>

            @if (historyError()) {
                <p class="mt-3 mb-0 text-sm text-red-500">{{ historyError() }}</p>
            }
        </section>

        <p-dialog [(visible)]="deleteDialogVisible" [modal]="true" [draggable]="false" [dismissableMask]="true" [style]="{ width: 'min(440px, 92vw)' }" header="Eliminar carga">
            @if (selectedImportToDelete()) {
                <div class="flex flex-col gap-3">
                    <p class="m-0">Esta acción eliminará la carga del historial y los registros de asistencia guardados desde ese Excel.</p>
                    <div class="p-3 rounded-lg border border-surface">
                        <div class="text-sm text-muted-color">Archivo</div>
                        <div class="font-semibold">{{ selectedImportToDelete()?.sourceFileName || 'Archivo sin nombre' }}</div>
                        <div class="text-sm text-muted-color mt-3">Fecha de carga</div>
                        <div class="font-semibold">{{ formatUploadDate(selectedImportToDelete()!) }}</div>
                    </div>
                </div>
            }

            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" severity="secondary" text (onClick)="cancelDeleteImport()" />
                <p-button label="Eliminar" icon="pi pi-trash" severity="danger" [loading]="attendance.deletingStoredImport()" (onClick)="deleteImport()" />
            </ng-template>
        </p-dialog>
    `
})
export class WeeklyAttendanceDashboard implements OnInit {
    private readonly router = inject(Router);

    readonly attendance = inject(AttendanceService);

    readonly weeks = computed(() => this.attendance.dashboardWeeks());

    readonly storedWeekCards = computed(() =>
        this.attendance.storedImports().flatMap((importItem) =>
            this.savedWeeks(importItem).map((week) => ({
                ...week,
                sourceFileName: importItem.sourceFileName,
                uploadedAtLabel: this.formatUploadDate(importItem)
            }))
        )
    );

    readonly selectedMonth = signal(new Date().getMonth() + 1);

    readonly selectedYear = signal(new Date().getFullYear());

    readonly historyError = signal('');

    readonly selectedImportToDelete = signal<AttendanceStoredImport | null>(null);

    deleteDialogVisible = false;

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

    ngOnInit() {
        this.loadStoredImports();
    }

    openWeek(week: AttendanceDashboardWeek) {
        this.attendance.selectWeek(week.index);
        this.router.navigate(['/asistencia/reporte']);
    }

    goToUpload() {
        this.router.navigate(['/asistencia/cargar']);
    }

    async loadStoredImports() {
        this.historyError.set('');

        try {
            await this.attendance.loadStoredImports({
                month: this.selectedMonth(),
                year: this.selectedYear()
            });
        } catch (error) {
            this.historyError.set('No pude cargar el historial de asistencias. Revisa que el backend esté encendido.');
            console.error(error);
        }
    }

    changeSelectedMonth(month: unknown) {
        const normalizedMonth = Number(month);
        if (!Number.isFinite(normalizedMonth)) return;

        this.selectedMonth.set(normalizedMonth);
        void this.loadStoredImports();
    }

    changeSelectedYear(year: unknown) {
        const normalizedYear = Number(year);
        if (!Number.isFinite(normalizedYear)) return;

        this.selectedYear.set(normalizedYear);
        void this.loadStoredImports();
    }

    async openStoredWeek(weekKey: string) {
        this.historyError.set('');

        try {
            await this.attendance.openStoredWeek(weekKey);
            this.router.navigate(['/asistencia/reporte'], { queryParams: { semana: weekKey } });
        } catch (error) {
            this.historyError.set('No pude abrir esta semana guardada.');
            console.error(error);
        }
    }

    confirmDeleteImport(importItem: AttendanceStoredImport) {
        this.historyError.set('');
        this.selectedImportToDelete.set(importItem);
        this.deleteDialogVisible = true;
    }

    cancelDeleteImport() {
        this.deleteDialogVisible = false;
        this.selectedImportToDelete.set(null);
    }

    async deleteImport() {
        const importItem = this.selectedImportToDelete();
        const importId = importItem?._id;
        if (!importId) return;

        this.historyError.set('');

        try {
            await this.attendance.deleteStoredImport(importId);
            this.cancelDeleteImport();
        } catch (error) {
            this.historyError.set('No pude eliminar esta carga de asistencia.');
            console.error(error);
        }
    }

    formatUploadDate(importItem: AttendanceStoredImport) {
        if (!importItem.uploadedAtTS && !importItem.uploadedAtISO) return 'Fecha no disponible';

        return new Intl.DateTimeFormat('es-MX', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(importItem.uploadedAtTS ?? importItem.uploadedAtISO!));
    }

    savedWeeks(importItem: AttendanceStoredImport) {
        if (importItem.weeks?.length) {
            const selectedMonth = String(this.selectedMonth()).padStart(2, '0');
            const selectedYear = String(this.selectedYear());

            return importItem.weeks.filter((week) => {
                const belongsToSelectedPeriod = week.weekStartDate.startsWith(`${selectedYear}-${selectedMonth}`) || week.weekEndDate.startsWith(`${selectedYear}-${selectedMonth}`);
                return week.status === 'GUARDADA' && belongsToSelectedPeriod;
            });
        }

        return (importItem.insertedWeeks || []).map((weekKey) => ({
            weekKey,
            weekLabel: weekKey.replace('_', ' a '),
            weekStartDate: '',
            weekEndDate: '',
            status: 'GUARDADA' as const
        }));
    }
}
