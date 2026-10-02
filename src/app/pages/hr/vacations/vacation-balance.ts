import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { VacationBalanceRecord, VacationRequest, VacationWorkflowService } from './vacation-workflow.service';
import { VacationBalancesApiService, VacationBalanceDto } from './vacation-balances-api.service';
import { VacationRequestDto, VacationRequestsApiService } from './vacation-requests-api.service';
import { ToastService } from '@/app/services/toast.service';
import { EmployeesApiService, EmployeeDto } from '../admin/employees-api.service';
import { RoleContextService } from '../role-context.service';

interface VacationBalanceRow extends VacationBalanceRecord {
    backendId: string;
    employeeId?: string;
    year: number;
    hireDate?: string;
    serviceYears?: number;
    legalDays?: number;
    periodStartDate?: string;
    periodEndDate?: string;
}

interface EmployeeOption {
    label: string;
    value: string;
    employee: EmployeeDto;
}

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
    imports: [CommonModule, FormsModule, ButtonModule, DialogModule, InputTextModule, SelectModule, TableModule, TagModule],
    template: `
        <section class="p-5 bg-surface-0 dark:bg-surface-900 border border-surface rounded-lg">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
                <div>
                    <h1 class="text-2xl font-semibold m-0">Días disponibles</h1>
                    <p class="text-muted-color mt-2 mb-0">{{ balanceView === 'vigentes' ? 'Consulta los saldos utilizables del ciclo actual.' : 'Consulta los saldos que vencieron en ciclos anteriores.' }}</p>
                </div>
                @if (isAdmin() && balanceView === 'vigentes') {
                    <p-button label="Nuevo saldo" icon="pi pi-plus" (onClick)="openCreateBalanceDialog()" />
                }
            </div>

            <div role="tablist" aria-label="Vista de saldos" class="inline-flex w-full sm:w-auto rounded-lg border border-surface p-1 mb-5">
                <button
                    type="button"
                    role="tab"
                    [attr.aria-selected]="balanceView === 'vigentes'"
                    [class]="balanceView === 'vigentes' ? 'flex-1 sm:flex-none px-4 py-2 rounded-md bg-primary text-primary-contrast font-semibold' : 'flex-1 sm:flex-none px-4 py-2 rounded-md text-muted-color hover:bg-emphasis'"
                    (click)="setBalanceView('vigentes')"
                >
                    Saldos vigentes <span class="ml-2">{{ currentBalances.length }}</span>
                </button>
                <button
                    type="button"
                    role="tab"
                    [attr.aria-selected]="balanceView === 'historial'"
                    [class]="balanceView === 'historial' ? 'flex-1 sm:flex-none px-4 py-2 rounded-md bg-primary text-primary-contrast font-semibold' : 'flex-1 sm:flex-none px-4 py-2 rounded-md text-muted-color hover:bg-emphasis'"
                    (click)="setBalanceView('historial')"
                >
                    Historial de ciclos <span class="ml-2">{{ historicalBalances.length }}</span>
                </button>
            </div>

            @if (errorMessage) {
                <div class="mb-4 p-4 rounded-lg border border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
                    {{ errorMessage }}
                </div>
            }

            <p-table [value]="visibleBalances" [loading]="loading" [paginator]="true" [rows]="25" [rowsPerPageOptions]="[10, 25, 50]" [tableStyle]="{ 'min-width': '72rem' }">
                <ng-template #header>
                    <tr>
                        <th>Empleado</th>
                        <th>Departamento</th>
                        <th>Saldo inicial</th>
                        <th>Antigüedad</th>
                        <th>Periodo legal</th>
                        <th>Vence</th>
                        <th>Usados</th>
                        <th>{{ balanceView === 'historial' ? 'Remanente vencido' : 'Disponibles' }}</th>
                        <th>Último movimiento</th>
                        @if (isAdmin() && balanceView === 'vigentes') {
                            <th>Acciones</th>
                        }
                    </tr>
                </ng-template>
                <ng-template #body let-balance>
                    <tr>
                        <td>
                            <button type="button" class="p-0 border-0 bg-transparent text-primary font-semibold cursor-pointer" (click)="selectEmployee(balance)">
                                {{ balance.employee }}
                            </button>
                            @if (isHistoricalBalance(balance)) {
                                <p-tag value="Ciclo vencido" severity="secondary" class="ml-2" />
                            }
                        </td>
                        <td>{{ balance.department }}</td>
                        <td>{{ balance.initial }}</td>
                        <td>{{ balance.serviceYears || 0 }} año(s)</td>
                        <td>{{ formatLegalPeriod(balance) }}</td>
                        <td>{{ formatBalanceExpiry(balance) }}</td>
                        <td>{{ balance.used }}</td>
                        <td><p-tag [value]="balance.available + ' días'" [severity]="isHistoricalBalance(balance) ? 'secondary' : balance.available > 5 ? 'success' : 'warn'" /></td>
                        <td>{{ balance.lastMove }}</td>
                        @if (isAdmin() && balanceView === 'vigentes') {
                            <td>
                                <div class="flex flex-wrap gap-2">
                                    <p-button label="Editar saldo" icon="pi pi-pencil" size="small" [outlined]="true" severity="secondary" (onClick)="openBalanceDialog(balance)" />
                                    <p-button label="Eliminar" icon="pi pi-trash" size="small" [outlined]="true" severity="danger" [disabled]="!balance.backendId" (onClick)="openDeleteBalanceDialog(balance)" />
                                </div>
                            </td>
                        }
                    </tr>
                </ng-template>
                <ng-template #emptymessage>
                    <tr>
                        <td [attr.colspan]="isAdmin() && balanceView === 'vigentes' ? 10 : 9" class="text-center py-6 text-muted-color">
                            {{ balanceView === 'historial' ? 'No hay ciclos anteriores vencidos.' : 'No hay saldos vigentes registrados.' }}
                        </td>
                    </tr>
                </ng-template>
            </p-table>

            @if (selectedEmployee) {
                <div class="mt-5 border-t border-surface pt-5">
                    <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                        <div>
                            <h2 class="text-xl font-semibold mt-0 mb-2">{{ selectedEmployee.employee }}</h2>
                            <p class="text-muted-color m-0">{{ selectedEmployee.department }}</p>
                            @if (isHistoricalBalance(selectedEmployee)) {
                                <p class="text-sm text-muted-color mt-2 mb-0">Este ciclo venció; su remanente no está disponible para nuevas solicitudes.</p>
                            }
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
                                <span class="block text-sm text-muted-color">{{ isHistoricalBalance(selectedEmployee) ? 'Remanente vencido' : 'Disponibles' }}</span>
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
                            <p-table [value]="takenVacationRequests(selectedEmployee.employee)" [tableStyle]="{ 'min-width': '34rem' }">
                                <ng-template #header>
                                    <tr>
                                        <th>Folio</th>
                                        <th>Periodo</th>
                                        <th>Días</th>
                                        <th>Estado</th>
                                    </tr>
                                </ng-template>
                                <ng-template #body let-request>
                                    <tr>
                                        <td>{{ request.id }}</td>
                                        <td>{{ formatPeriod(request) }}</td>
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
                            <p-table [value]="requestsByEmployee(selectedEmployee.employee)" [tableStyle]="{ 'min-width': '56rem' }">
                                <ng-template #header>
                                    <tr>
                                        <th>Folio</th>
                                        <th>Periodo</th>
                                        <th>Días</th>
                                        <th>Estado</th>
                                        <th>Último movimiento</th>
                                    </tr>
                                </ng-template>
                                <ng-template #body let-request>
                                    <tr>
                                        <td>{{ request.id }}</td>
                                        <td>{{ formatPeriod(request) }}</td>
                                        <td>{{ request.days }}</td>
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

            <p-dialog [(visible)]="balanceDialog" [modal]="true" [draggable]="false" [dismissableMask]="true" [style]="{ width: 'min(560px, 92vw)' }" [header]="editingBalanceId ? 'Editar saldo de vacaciones' : 'Nuevo saldo de vacaciones'">
                @if (balanceDraft) {
                    <div class="grid grid-cols-12 gap-4">
                        @if (editingBalanceId) {
                            <div class="col-span-12">
                                <span class="block text-sm text-muted-color">Empleado</span>
                                <span class="font-semibold">{{ balanceDraft.employeeName }}</span>
                            </div>
                        } @else {
                            <div class="col-span-12">
                                <label class="block font-medium mb-2" for="balanceEmployee">Empleado</label>
                                <p-select inputId="balanceEmployee" [(ngModel)]="selectedEmployeeIdForBalance" [options]="availableEmployeeOptions" optionLabel="label" optionValue="value" class="w-full" appendTo="body" (ngModelChange)="syncDraftEmployee()" />
                            </div>
                        }
                        <div class="col-span-12 md:col-span-6">
                            <label class="block font-medium mb-2" for="balanceYear">Año</label>
                            <input id="balanceYear" pInputText type="number" class="w-full" [(ngModel)]="balanceDraft.year" (ngModelChange)="handleBalanceYearChange()" />
                        </div>
                        <div class="col-span-12 md:col-span-6">
                            <label class="block font-medium mb-2" for="initialDays">Saldo inicial</label>
                            <input id="initialDays" pInputText type="number" class="w-full" [(ngModel)]="balanceDraft.initialDays" />
                        </div>
                        <div class="col-span-12 md:col-span-6">
                            <label class="block font-medium mb-2" for="usedDays">Usados</label>
                            <input id="usedDays" pInputText type="number" class="w-full" [(ngModel)]="balanceDraft.usedDays" />
                        </div>
                        <div class="col-span-12 md:col-span-6">
                            <label class="block font-medium mb-2" for="availableDays">Disponibles</label>
                            <input id="availableDays" pInputText type="number" class="w-full" [ngModel]="calculatedAvailableDays()" readonly />
                        </div>
                    </div>
                }

                <ng-template #footer>
                    <p-button label="Cancelar" icon="pi pi-times" severity="secondary" text (onClick)="closeBalanceDialog()" />
                    <p-button label="Guardar" icon="pi pi-check" [loading]="savingBalance" [disabled]="!canSaveBalance()" (onClick)="saveBalance()" />
                </ng-template>
            </p-dialog>

            <p-dialog [(visible)]="deleteDialog" [modal]="true" [draggable]="false" [dismissableMask]="true" [style]="{ width: 'min(460px, 92vw)' }" header="Confirmar eliminación">
                @if (balanceToDelete) {
                    <p class="mt-0 mb-2">¿Seguro que quieres eliminar este saldo?</p>
                    <p class="text-muted-color mt-0 mb-0">
                        {{ balanceToDelete.employee }} - {{ balanceToDelete.year }}
                    </p>
                }

                <ng-template #footer>
                    <p-button label="Cancelar" icon="pi pi-times" severity="secondary" text (onClick)="closeDeleteBalanceDialog()" />
                    <p-button label="Eliminar" icon="pi pi-trash" severity="danger" [loading]="deletingBalance" (onClick)="confirmDeleteBalance()" />
                </ng-template>
            </p-dialog>
        </section>
    `
})
export class VacationBalance implements OnInit {
    readonly workflow = inject(VacationWorkflowService);
    private readonly vacationBalancesApi = inject(VacationBalancesApiService);
    private readonly vacationRequestsApi = inject(VacationRequestsApiService);
    private readonly employeesApi = inject(EmployeesApiService);
    private readonly toast = inject(ToastService);
    private readonly roleContext = inject(RoleContextService);
    private readonly cdr = inject(ChangeDetectorRef);

    balances: VacationBalanceRow[] = [];

    currentBalances: VacationBalanceRow[] = [];

    historicalBalances: VacationBalanceRow[] = [];

    balanceView: 'vigentes' | 'historial' = 'vigentes';

    get visibleBalances() {
        return this.balanceView === 'vigentes' ? this.currentBalances : this.historicalBalances;
    }

    requests: VacationRequest[] = [];

    employeeOptions: EmployeeOption[] = [];

    loading = false;

    errorMessage = '';

    selectedEmployee: VacationBalanceRow | null = null;

    balanceDialog = false;

    savingBalance = false;

    deleteDialog = false;

    deletingBalance = false;

    balanceDraft: VacationBalanceDto | null = null;

    balanceToDelete: VacationBalanceRow | null = null;

    editingBalanceId = '';

    selectedEmployeeIdForBalance = '';

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

    get availableEmployeeOptions() {
        if (this.editingBalanceId || !this.balanceDraft?.year) {
            return this.employeeOptions;
        }

        const year = Number(this.balanceDraft.year);
        return this.employeeOptions.filter((option) => !this.hasBalanceForEmployee(option, year));
    }

    ngOnInit() {
        this.loadData();
        this.loadSupportingData();
    }

    isAdmin() {
        return this.roleContext.currentRole() === 'admin';
    }

    setBalanceView(view: 'vigentes' | 'historial') {
        if (this.balanceView === view) return;

        this.balanceView = view;
        this.selectedEmployee = null;
    }

    isHistoricalBalance(balance: VacationBalanceRow) {
        const today = this.formatIsoDate(new Date());
        const expiryDate = this.getBalanceExpiryDate(balance);
        if (expiryDate) return expiryDate <= today;

        return balance.year < new Date().getFullYear();
    }

    private refreshBalanceViews() {
        this.currentBalances = this.balances.filter((balance) => !this.isHistoricalBalance(balance));
        this.historicalBalances = this.balances.filter((balance) => this.isHistoricalBalance(balance));
    }

    loadData() {
        this.loading = true;
        this.errorMessage = '';

        this.vacationBalancesApi
            .getBalances({ page: 1, limit: 5000 })
            .pipe(
                finalize(() => {
                    this.loading = false;
                    this.cdr.detectChanges();
                })
            )
            .subscribe({
                next: (response) => {
                    this.balances = response.data.data.map((balance) => this.mapBalance(balance));
                    this.refreshBalanceViews();
                    this.syncSelectedEmployeeAfterReload();
                    this.cdr.detectChanges();
                },
                error: (error: unknown) => {
                    this.errorMessage = this.getErrorMessage(error);
                    this.balances = [];
                    this.currentBalances = [];
                    this.historicalBalances = [];
                    this.requests = [];
                    this.cdr.detectChanges();
                }
            });
    }

    loadSupportingData() {
        this.vacationRequestsApi.getMyRequests({ employeeName: '', page: 1, limit: 100 }).subscribe({
            next: (response) => {
                this.requests = response.data.data.map((request) => this.mapRequest(request));
                this.cdr.detectChanges();
            },
            error: () => {
                this.requests = [];
                this.cdr.detectChanges();
            }
        });

        if (!this.isAdmin()) {
            this.employeeOptions = [];
            return;
        }

        this.employeesApi.getEmployees({ page: 1, limit: 100 }).subscribe({
            next: (response) => {
                this.employeeOptions = response.data.data.map((employee) => ({
                    label: employee.name,
                    value: employee._id || employee.name,
                    employee
                }));
                this.cdr.detectChanges();
            },
            error: () => {
                this.employeeOptions = [];
                this.cdr.detectChanges();
            }
        });
    }

    selectEmployee(employee: VacationBalanceRow) {
        const sameBalance = this.selectedEmployee && (this.selectedEmployee.backendId && employee.backendId
            ? this.selectedEmployee.backendId === employee.backendId
            : this.selectedEmployee.employee === employee.employee && this.selectedEmployee.year === employee.year);

        if (sameBalance) {
            this.selectedEmployee = null;
            return;
        }

        this.selectedEmployee = employee;
        this.syncCalendarToEmployee(employee.employee);
    }

    openBalanceDialog(balance: VacationBalanceRow) {
        this.editingBalanceId = balance.backendId;
        this.selectedEmployeeIdForBalance = balance.employeeId || balance.employee;
        this.balanceDraft = {
            _id: balance.backendId,
            employeeId: balance.employeeId,
            employeeName: balance.employee,
            department: balance.department,
            year: balance.year,
            initialDays: balance.initial,
            usedDays: balance.used,
            availableDays: balance.available,
            lastMove: 'Saldo editado manualmente'
        };
        this.balanceDialog = true;
    }

    openCreateBalanceDialog() {
        this.editingBalanceId = '';
        this.selectedEmployeeIdForBalance = '';
        this.balanceDraft = {
            employeeName: '',
            department: '',
            year: new Date().getFullYear(),
            initialDays: 0,
            usedDays: 0,
            availableDays: 0,
            lastMove: 'Saldo inicial capturado manualmente'
        };
        this.balanceDialog = true;
    }

    closeBalanceDialog() {
        this.balanceDialog = false;
        this.balanceDraft = null;
        this.editingBalanceId = '';
        this.selectedEmployeeIdForBalance = '';
    }

    openDeleteBalanceDialog(balance: VacationBalanceRow) {
        this.balanceToDelete = balance;
        this.deleteDialog = true;
    }

    closeDeleteBalanceDialog() {
        if (this.deletingBalance) return;

        this.deleteDialog = false;
        this.balanceToDelete = null;
    }

    syncDraftEmployee() {
        if (!this.balanceDraft) return;

        const selectedEmployee = this.employeeOptions.find((option) => option.value === this.selectedEmployeeIdForBalance)?.employee;
        if (!selectedEmployee) return;

        if (!this.editingBalanceId && this.hasBalanceForEmployee({ label: selectedEmployee.name, value: this.selectedEmployeeIdForBalance, employee: selectedEmployee }, Number(this.balanceDraft.year))) {
            this.toast.showError('Ya existe saldo', 'Este empleado ya tiene saldo registrado para ese año.');
            this.selectedEmployeeIdForBalance = '';
            this.balanceDraft.employeeId = undefined;
            this.balanceDraft.employeeName = '';
            this.balanceDraft.department = '';
            return;
        }

        this.balanceDraft.employeeId = selectedEmployee._id;
        this.balanceDraft.employeeName = selectedEmployee.name;
        this.balanceDraft.department = selectedEmployee.department;
    }

    handleBalanceYearChange() {
        if (!this.balanceDraft || this.editingBalanceId || !this.selectedEmployeeIdForBalance) return;

        const selectedOption = this.employeeOptions.find((option) => option.value === this.selectedEmployeeIdForBalance);
        if (!selectedOption || !this.hasBalanceForEmployee(selectedOption, Number(this.balanceDraft.year))) return;

        this.toast.showError('Ya existe saldo', 'Este empleado ya tiene saldo registrado para ese año.');
        this.selectedEmployeeIdForBalance = '';
        this.balanceDraft.employeeId = undefined;
        this.balanceDraft.employeeName = '';
        this.balanceDraft.department = '';
    }

    calculatedAvailableDays() {
        if (!this.balanceDraft) return 0;
        return Number(this.balanceDraft.initialDays || 0) - Number(this.balanceDraft.usedDays || 0);
    }

    canSaveBalance() {
        if (!this.balanceDraft) return false;
        return Boolean(!this.savingBalance && this.balanceDraft.employeeName && this.balanceDraft.department && this.balanceDraft.year && Number(this.balanceDraft.initialDays) >= 0 && Number(this.balanceDraft.usedDays) >= 0 && this.calculatedAvailableDays() >= 0);
    }

    saveBalance() {
        if (!this.balanceDraft || !this.canSaveBalance()) return;

        const selectedOption = this.employeeOptions.find((option) => option.value === this.selectedEmployeeIdForBalance);
        if (!this.editingBalanceId && selectedOption && this.hasBalanceForEmployee(selectedOption, Number(this.balanceDraft.year))) {
            this.toast.showError('Ya existe saldo', 'Este empleado ya tiene saldo registrado para ese año.');
            return;
        }

        this.savingBalance = true;
        const payload = {
            employeeId: this.balanceDraft.employeeId,
            employeeName: this.balanceDraft.employeeName,
            department: this.balanceDraft.department,
            year: Number(this.balanceDraft.year),
            initialDays: Number(this.balanceDraft.initialDays),
            usedDays: Number(this.balanceDraft.usedDays),
            availableDays: this.calculatedAvailableDays(),
            lastMove: this.editingBalanceId ? 'Saldo editado manualmente' : 'Saldo inicial capturado manualmente'
        };

        if (this.editingBalanceId) {
            this.vacationBalancesApi
                .updateBalance(this.editingBalanceId, payload)
                .pipe(
                    finalize(() => {
                        this.savingBalance = false;
                        this.cdr.detectChanges();
                    })
                )
                .subscribe({
                    next: () => {
                        this.savingBalance = false;
                        this.handleBalanceSaved('Saldo actualizado');
                    },
                    error: (error: unknown) => {
                        this.savingBalance = false;
                        this.toast.showError('No se pudo guardar', this.getErrorMessage(error));
                    }
                });
            return;
        }

        this.vacationBalancesApi
            .createBalance(payload)
            .pipe(
                finalize(() => {
                    this.savingBalance = false;
                    this.cdr.detectChanges();
                })
            )
            .subscribe({
                next: () => {
                    this.savingBalance = false;
                    this.handleBalanceSaved('Saldo creado');
                },
                error: (error: unknown) => {
                    this.savingBalance = false;
                    this.toast.showError('No se pudo guardar', this.getErrorMessage(error));
                }
            });
    }

    private handleBalanceSaved(message: string) {
        this.toast.showSuccess(message);
        this.closeBalanceDialog();
        this.savingBalance = false;
        this.cdr.detectChanges();
        this.loadData();
    }

    confirmDeleteBalance() {
        if (!this.balanceToDelete?.backendId) return;

        const deletedBalance = this.balanceToDelete;
        this.deletingBalance = true;

        this.vacationBalancesApi
            .deleteBalance(deletedBalance.backendId)
            .pipe(
                finalize(() => {
                    this.deletingBalance = false;
                    this.cdr.detectChanges();
                })
            )
            .subscribe({
                next: () => {
                    this.toast.showSuccess('Saldo eliminado');
                    if (this.selectedEmployee?.backendId === deletedBalance.backendId) {
                        this.selectedEmployee = null;
                    }
                    this.deleteDialog = false;
                    this.balanceToDelete = null;
                    this.loadData();
                },
                error: (error: unknown) => this.toast.showError('No se pudo eliminar', this.getErrorMessage(error))
            });
    }

    private syncSelectedEmployeeAfterReload() {
        if (!this.selectedEmployee) return;

        const updatedEmployee = this.balances.find((balance) => balance.backendId === this.selectedEmployee?.backendId);
        this.selectedEmployee = updatedEmployee || null;
    }

    private hasBalanceForEmployee(option: EmployeeOption, year: number) {
        return this.balances.some((balance) => {
            const sameEmployee = balance.employeeId
                ? balance.employeeId === option.employee._id
                : balance.employee === option.employee.name;

            return sameEmployee && balance.year === year;
        });
    }

    takenDays(employee: string) {
        return this.takenVacationRequests(employee).reduce((total, request) => total + request.days, 0);
    }

    calendarMonth(employee: string): CalendarMonth {
        const vacationDates = new Set(this.takenVacationRequests(employee).flatMap((request) => this.datesInRequest(request)));
        const monthKey = `${this.selectedYear}-${String(this.selectedMonth + 1).padStart(2, '0')}`;

        return this.buildCalendarMonth(monthKey, vacationDates);
    }

    yearOptions(employee: string) {
        const currentYear = new Date().getFullYear();
        const requestYears = this.requestsByEmployee(employee)
            .flatMap((request) => [request.startDate.slice(0, 4), request.endDate.slice(0, 4)])
            .map(Number);
        const years = Array.from(new Set([currentYear - 1, currentYear, currentYear + 1, ...requestYears])).sort((first, second) => first - second);

        return years.map((year) => ({ label: String(year), value: year }));
    }

    private syncCalendarToEmployee(employee: string) {
        const firstTakenRequest = this.takenVacationRequests(employee)[0];
        if (!firstTakenRequest) return;

        const firstDate = new Date(`${firstTakenRequest.startDate}T00:00:00`);
        this.selectedMonth = firstDate.getMonth();
        this.selectedYear = firstDate.getFullYear();
    }

    requestsByEmployee(employee: string) {
        return this.requests.filter((request) => request.employee === employee);
    }

    takenVacationRequests(employee: string) {
        return this.requestsByEmployee(employee).filter((request) => request.status === 'Aprobada');
    }

    formatPeriod(request: VacationRequest) {
        return `${this.formatDate(request.startDate)} - ${this.formatDate(request.endDate)}`;
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

    private mapBalance(balance: VacationBalanceDto): VacationBalanceRow {
        return {
            backendId: balance._id || '',
            employeeId: balance.employeeId,
            employee: balance.employeeName,
            department: balance.department || 'Sin departamento',
            year: balance.year,
            hireDate: balance.hireDate,
            serviceYears: balance.serviceYears,
            legalDays: balance.legalDays,
            periodStartDate: balance.periodStartDate,
            periodEndDate: balance.periodEndDate,
            initial: balance.initialDays,
            used: balance.usedDays,
            available: balance.availableDays,
            lastMove: balance.lastMove || 'Sin movimientos'
        };
    }

    private mapRequest(request: VacationRequestDto): VacationRequest {
        return {
            id: request.folio,
            employee: request.employeeName,
            department: request.department,
            manager: request.managerName,
            startDate: request.startDate,
            endDate: request.endDate,
            days: request.days,
            comments: request.comments || '',
            status: request.status === 'Cancelada' ? 'Rechazada' : request.status,
            updatedAt: request.updatedAt,
            history: request.history || []
        };
    }

    formatDate(value: string) {
        const date = new Date(`${value}T00:00:00`);
        return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
    }

    formatLegalPeriod(balance: VacationBalanceRow) {
        if (!balance.periodStartDate || !balance.periodEndDate) {
            return String(balance.year);
        }

        return `${this.formatDate(balance.periodStartDate)} - ${this.formatDate(balance.periodEndDate)}`;
    }

    formatBalanceExpiry(balance: VacationBalanceRow) {
        const expiryDate = this.getBalanceExpiryDate(balance);
        return expiryDate ? this.formatDate(expiryDate) : 'Sin fecha de ciclo';
    }

    private getBalanceExpiryDate(balance: VacationBalanceRow) {
        if (balance.periodEndDate) {
            const [year, month, day] = balance.periodEndDate.split('-').map(Number);
            return this.formatIsoDate(new Date(year, month - 1, day + 1));
        }

        if (balance.hireDate) {
            const [, month, day] = balance.hireDate.split('-').map(Number);
            if (month && day) {
                return this.formatIsoDate(new Date(balance.year + 1, month - 1, day));
            }
        }

        return null;
    }

    private getErrorMessage(error: unknown) {
        const httpError = error as { status?: number; error?: { message?: string; msg?: string } };
        return httpError?.error?.message || httpError?.error?.msg || 'Revisa que el backend este encendido en http://localhost:8080.';
    }
}
