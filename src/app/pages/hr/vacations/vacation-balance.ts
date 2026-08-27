import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { VacationBalanceRecord, VacationRequest, VacationWorkflowService } from './vacation-workflow.service';

interface CalendarDay {
    date: Date;
    day: number;
    isCurrentMonth: boolean;
    isVacation: boolean;
}

interface CalendarMonth {
    label: string;
    days: CalendarDay[];
}

@Component({
    selector: 'app-vacation-balance',
    standalone: true,
    imports: [CommonModule, FormsModule, SelectModule, TableModule, TagModule],
    template: `
        <section class="p-5 bg-surface-0 dark:bg-surface-900 border border-surface rounded-lg">
            <h1 class="text-2xl font-semibold m-0">Dias disponibles</h1>
            <p class="text-muted-color mt-2 mb-5">Control centralizado de saldos y movimientos de vacaciones.</p>

            <p-table [value]="workflow.balances()" [tableStyle]="{ 'min-width': '65rem' }">
                <ng-template #header>
                    <tr>
                        <th>Empleado</th>
                        <th>Departamento</th>
                        <th>Saldo inicial</th>
                        <th>Usados</th>
                        <th>Disponibles</th>
                        <th>Ultimo movimiento</th>
                    </tr>
                </ng-template>
                <ng-template #body let-balance>
                    <tr>
                        <td>
                            <button type="button" class="p-0 border-0 bg-transparent text-primary font-semibold cursor-pointer" (click)="selectEmployee(balance)">
                                {{ balance.employee }}
                            </button>
                        </td>
                        <td>{{ balance.department }}</td>
                        <td>{{ balance.initial }}</td>
                        <td>{{ balance.used }}</td>
                        <td><p-tag [value]="balance.available + ' dias'" [severity]="balance.available > 5 ? 'success' : 'warn'" /></td>
                        <td>{{ balance.lastMove }}</td>
                    </tr>
                </ng-template>
            </p-table>

            @if (selectedEmployee) {
                <div class="mt-5 border-t border-surface pt-5">
                    <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                        <div>
                            <h2 class="text-xl font-semibold mt-0 mb-2">{{ selectedEmployee.employee }}</h2>
                            <p class="text-muted-color m-0">{{ selectedEmployee.department }}</p>
                        </div>

                        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 w-full lg:w-auto">
                            <div class="p-3 rounded-lg border border-surface">
                                <span class="block text-sm text-muted-color">Saldo inicial</span>
                                <span class="text-xl font-semibold">{{ selectedEmployee.initial }}</span>
                            </div>
                            <div class="p-3 rounded-lg border border-surface">
                                <span class="block text-sm text-muted-color">Usados</span>
                                <span class="text-xl font-semibold">{{ selectedEmployee.used }}</span>
                            </div>
                            <div class="p-3 rounded-lg border border-surface">
                                <span class="block text-sm text-muted-color">Disponibles</span>
                                <span class="text-xl font-semibold">{{ selectedEmployee.available }}</span>
                            </div>
                            <div class="p-3 rounded-lg border border-surface">
                                <span class="block text-sm text-muted-color">Tomados</span>
                                <span class="text-xl font-semibold">{{ takenDays(selectedEmployee.employee) }}</span>
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-12 gap-5 mt-5">
                        <div class="col-span-12 xl:col-span-7">
                            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                                <h3 class="text-lg font-semibold m-0">Calendario</h3>
                                <div class="flex flex-col sm:flex-row gap-2">
                                    <p-select [(ngModel)]="selectedMonth" [options]="monthOptions" optionLabel="label" optionValue="value" class="w-full sm:w-44" />
                                    <p-select [(ngModel)]="selectedYear" [options]="yearOptions(selectedEmployee.employee)" optionLabel="label" optionValue="value" class="w-full sm:w-32" />
                                </div>
                            </div>

                            @if (calendarMonth(selectedEmployee.employee); as month) {
                                <div class="border border-surface rounded-lg p-4">
                                    <div class="font-semibold mb-3">{{ month.label }}</div>
                                    <div class="grid grid-cols-7 gap-1 text-center text-xs text-muted-color mb-2">
                                        <span>L</span>
                                        <span>M</span>
                                        <span>M</span>
                                        <span>J</span>
                                        <span>V</span>
                                        <span>S</span>
                                        <span>D</span>
                                    </div>
                                    <div class="grid grid-cols-7 gap-1">
                                        @for (day of month.days; track day.date.toISOString()) {
                                            <div
                                                class="h-9 rounded-md flex items-center justify-center text-sm border"
                                                [ngClass]="{
                                                    'bg-primary text-primary-contrast border-primary font-semibold': day.isVacation,
                                                    'text-muted-color border-transparent': !day.isCurrentMonth,
                                                    'border-surface bg-surface-50 dark:bg-surface-800': day.isCurrentMonth && !day.isVacation
                                                }"
                                            >
                                                {{ day.day }}
                                            </div>
                                        }
                                    </div>
                                </div>
                            }
                        </div>

                        <div class="col-span-12 xl:col-span-5">
                            <h3 class="text-lg font-semibold mt-0 mb-3">Vacaciones tomadas</h3>
                            <p-table [value]="workflow.getTakenVacationRequests(selectedEmployee.employee)" [tableStyle]="{ 'min-width': '34rem' }">
                                <ng-template #header>
                                    <tr>
                                        <th>Folio</th>
                                        <th>Periodo</th>
                                        <th>Dias</th>
                                        <th>Estado</th>
                                    </tr>
                                </ng-template>
                                <ng-template #body let-request>
                                    <tr>
                                        <td>{{ request.id }}</td>
                                        <td>{{ workflow.formatPeriod(request) }}</td>
                                        <td>{{ request.days }}</td>
                                        <td><p-tag [value]="request.status" [severity]="workflow.getSeverity(request.status)" /></td>
                                    </tr>
                                </ng-template>
                                <ng-template #emptymessage>
                                    <tr>
                                        <td colspan="4" class="text-center py-5 text-muted-color">No hay vacaciones tomadas registradas.</td>
                                    </tr>
                                </ng-template>
                            </p-table>

                            <h3 class="text-lg font-semibold mt-5 mb-3">Todas las solicitudes</h3>
                            <p-table [value]="workflow.getRequestsByEmployee(selectedEmployee.employee)" [tableStyle]="{ 'min-width': '56rem' }">
                                <ng-template #header>
                                    <tr>
                                        <th>Folio</th>
                                        <th>Periodo</th>
                                        <th>Dias</th>
                                        <th>Responsable</th>
                                        <th>Estado</th>
                                        <th>Ultimo movimiento</th>
                                    </tr>
                                </ng-template>
                                <ng-template #body let-request>
                                    <tr>
                                        <td>{{ request.id }}</td>
                                        <td>{{ workflow.formatPeriod(request) }}</td>
                                        <td>{{ request.days }}</td>
                                        <td>{{ request.manager }}</td>
                                        <td><p-tag [value]="request.status" [severity]="workflow.getSeverity(request.status)" /></td>
                                        <td>{{ request.updatedAt }}</td>
                                    </tr>
                                </ng-template>
                            </p-table>
                        </div>
                    </div>
                </div>
            } @else {
                <div class="mt-5 border-t border-surface pt-5 text-muted-color">Selecciona un empleado para ver su historial.</div>
            }
        </section>
    `
})
export class VacationBalance {
    readonly workflow = inject(VacationWorkflowService);

    selectedEmployee: VacationBalanceRecord | null = null;

    selectedMonth = new Date().getMonth();

    selectedYear = new Date().getFullYear();

    readonly monthOptions = [
        { label: 'Enero', value: 0 },
        { label: 'Febrero', value: 1 },
        { label: 'Marzo', value: 2 },
        { label: 'Abril', value: 3 },
        { label: 'Mayo', value: 4 },
        { label: 'Junio', value: 5 },
        { label: 'Julio', value: 6 },
        { label: 'Agosto', value: 7 },
        { label: 'Septiembre', value: 8 },
        { label: 'Octubre', value: 9 },
        { label: 'Noviembre', value: 10 },
        { label: 'Diciembre', value: 11 }
    ];

    selectEmployee(employee: VacationBalanceRecord) {
        if (this.selectedEmployee?.employee === employee.employee) {
            this.selectedEmployee = null;
            return;
        }

        this.selectedEmployee = employee;
        this.syncCalendarToEmployee(employee.employee);
    }

    takenDays(employee: string) {
        return this.workflow.getTakenVacationRequests(employee).reduce((total, request) => total + request.days, 0);
    }

    calendarMonth(employee: string): CalendarMonth {
        const vacationDates = new Set(this.workflow.getTakenVacationRequests(employee).flatMap((request) => this.datesInRequest(request)));
        const monthKey = `${this.selectedYear}-${String(this.selectedMonth + 1).padStart(2, '0')}`;

        return this.buildCalendarMonth(monthKey, vacationDates);
    }

    yearOptions(employee: string) {
        const currentYear = new Date().getFullYear();
        const requestYears = this.workflow
            .getRequestsByEmployee(employee)
            .flatMap((request) => [request.startDate.slice(0, 4), request.endDate.slice(0, 4)])
            .map(Number);
        const years = Array.from(new Set([currentYear - 1, currentYear, currentYear + 1, ...requestYears])).sort((first, second) => first - second);

        return years.map((year) => ({ label: String(year), value: year }));
    }

    private syncCalendarToEmployee(employee: string) {
        const firstTakenRequest = this.workflow.getTakenVacationRequests(employee)[0];
        if (!firstTakenRequest) return;

        const firstDate = new Date(`${firstTakenRequest.startDate}T00:00:00`);
        this.selectedMonth = firstDate.getMonth();
        this.selectedYear = firstDate.getFullYear();
    }

    private buildCalendarMonth(monthKey: string, vacationDates: Set<string>): CalendarMonth {
        const [year, month] = monthKey.split('-').map(Number);
        const firstDate = new Date(year, month - 1, 1);
        const startOffset = (firstDate.getDay() + 6) % 7;
        const startDate = new Date(year, month - 1, 1 - startOffset);
        const days = Array.from({ length: 42 }, (_, index) => {
            const date = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + index);
            const isoDate = this.formatIsoDate(date);

            return {
                date,
                day: date.getDate(),
                isCurrentMonth: date.getMonth() === month - 1,
                isVacation: vacationDates.has(isoDate)
            };
        });

        return {
            label: new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' }).format(firstDate),
            days
        };
    }

    private datesInRequest(request: VacationRequest) {
        const dates: string[] = [];
        const cursor = new Date(`${request.startDate}T00:00:00`);
        const end = new Date(`${request.endDate}T00:00:00`);

        while (cursor <= end) {
            const day = cursor.getDay();
            if (day !== 0 && day !== 6) {
                dates.push(this.formatIsoDate(cursor));
            }
            cursor.setDate(cursor.getDate() + 1);
        }

        return dates;
    }

    private formatIsoDate(date: Date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}
