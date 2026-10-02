import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, of, switchMap } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { EmployeesApiService, EmployeeDto, EmployeeRole, EmployeeStatus } from './employees-api.service';
import { ToastService } from '@/app/services/toast.service';
import { AuthService } from '@/app/services/auth.service';
import { VacationBalancesApiService, VacationBalanceDto } from '../vacations/vacation-balances-api.service';

type EmployeeSeverity = 'success' | 'secondary' | 'warn';

interface EmployeeRecord {
    id: string;
    uid?: string;
    employeeNumber?: string;
    name: string;
    email?: string;
    password?: string;
    department: string;
    hireDate: string;
    role: EmployeeRole;
    managerId?: string;
    manager: string;
    status: EmployeeStatus;
    statusLabel: string;
    severity: EmployeeSeverity;
    accountLabel: string;
    accountSeverity: EmployeeSeverity;
    vacationBalanceId?: string;
    vacationBalanceYear?: number;
    vacationInitialDays?: number;
    vacationUsedDays?: number;
    vacationAvailableDays?: number | null;
}

@Component({
    selector: 'app-employees',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, DialogModule, InputTextModule, SelectModule, TableModule, TagModule],
    template: `
        <section class="p-5 bg-surface-0 dark:bg-surface-900 border border-surface rounded-lg">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
                <div>
                    <h1 class="text-2xl font-semibold m-0">Empleados</h1>
                    <p class="text-muted-color mt-2 mb-0">Base para relacionar usuarios, departamentos, jefes y saldos.</p>
                </div>
                <p-button label="Nuevo empleado" icon="pi pi-plus" (onClick)="openCreate()" />
            </div>

            @if (errorMessage) {
                <div class="mb-4 p-4 rounded-lg border border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
                    {{ errorMessage }}
                </div>
            }

            <p-table [value]="employees" [loading]="loading" [tableStyle]="{ 'min-width': '92rem' }">
                <ng-template #header>
                    <tr>
                        <th>Nombre</th>
                        <th>Correo</th>
                        <th>Cuenta</th>
                        <th>Departamento</th>
                        <th>Fecha de ingreso</th>
                        <th>Perfil</th>
                        <th>Jefe directo</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </ng-template>
                <ng-template #body let-employee>
                    <tr>
                        <td>{{ employee.name }}</td>
                        <td>{{ employee.email || 'Sin correo' }}</td>
                        <td><p-tag [value]="employee.accountLabel" [severity]="employee.accountSeverity" /></td>
                        <td>{{ employee.department }}</td>
                        <td>{{ formatDate(employee.hireDate) }}</td>
                        <td>{{ employee.role }}</td>
                        <td>{{ employee.manager }}</td>
                        <td><p-tag [value]="employee.statusLabel" [severity]="employee.severity" /></td>
                        <td>
                            <div class="flex flex-wrap gap-2">
                                <p-button label="Editar" icon="pi pi-pencil" size="small" [outlined]="true" severity="secondary" (onClick)="openEdit(employee)" />
                                <p-button label="Eliminar" icon="pi pi-trash" size="small" [outlined]="true" severity="danger" (onClick)="openDeleteConfirm(employee)" />
                            </div>
                        </td>
                    </tr>
                </ng-template>
                <ng-template #emptymessage>
                    <tr>
                        <td colspan="9" class="text-center py-6 text-muted-color">No hay empleados registrados.</td>
                    </tr>
                </ng-template>
            </p-table>

            <p-dialog [(visible)]="employeeDialog" [modal]="true" [draggable]="false" [dismissableMask]="true" [style]="{ width: 'min(640px, 92vw)' }" [header]="editingEmployeeId ? 'Editar empleado' : 'Nuevo empleado'">
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-12 md:col-span-6">
                        <label class="block font-medium mb-2" for="employeeName">Nombre</label>
                        <input id="employeeName" pInputText class="w-full" [(ngModel)]="draft.name" />
                    </div>
                    <div class="col-span-12 md:col-span-6">
                        <label class="block font-medium mb-2" for="employeeEmail">Correo</label>
                        <input id="employeeEmail" pInputText type="email" class="w-full" [(ngModel)]="draft.email" autocomplete="email" />
                        @if (draft.email && !isValidEmail()) {
                            <small class="text-red-500">Escribe un correo válido.</small>
                        }
                    </div>
                    <div class="col-span-12 md:col-span-6">
                        <label class="block font-medium mb-2" for="employeeNumber">Número de empleado</label>
                        <input id="employeeNumber" pInputText class="w-full" [(ngModel)]="draft.employeeNumber" />
                        @if (!draft.employeeNumber?.trim()) {
                            <small class="text-orange-500">Obligatorio para relacionarlo con el Excel de asistencia.</small>
                        }
                    </div>
                    <div class="col-span-12 md:col-span-6">
                        <label class="block font-medium mb-2" for="employeePassword">Contraseña temporal</label>
                        <div class="relative">
                            <input id="employeePassword" pInputText [type]="showPassword ? 'text' : 'password'" class="w-full pr-12" [(ngModel)]="draft.password" autocomplete="new-password" />
                            <button
                                type="button"
                                class="absolute right-3 top-1/2 -translate-y-1/2 border-0 bg-transparent text-muted-color cursor-pointer"
                                [attr.aria-label]="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                                [title]="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                                (click)="togglePasswordVisibility()"
                            >
                                <i [class]="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
                            </button>
                        </div>
                        <small [class]="needsTemporaryPassword() ? 'text-orange-500' : 'text-muted-color'">{{ passwordHelpText() }} Al crear una cuenta, se enviará un enlace para que el empleado elija su contraseña.</small>
                    </div>
                    @if (editingEmployeeId) {
                        <div class="col-span-12">
                            <div class="p-3 rounded-lg border border-surface bg-surface-50 dark:bg-surface-800 text-sm">
                                <span class="font-semibold">Cuenta:</span>
                                {{ draft.uid ? 'vinculada a Firebase Auth' : 'sin cuenta vinculada; captura una contraseña temporal para crearla.' }}
                            </div>
                        </div>
                    }
                    <div class="col-span-12 md:col-span-6">
                        <label class="block font-medium mb-2" for="employeeDepartment">Departamento</label>
                        <p-select inputId="employeeDepartment" [(ngModel)]="draft.department" [options]="departmentOptions" optionLabel="label" optionValue="value" appendTo="body" class="w-full" />
                    </div>
                    <div class="col-span-12 md:col-span-6">
                        <label class="block font-medium mb-2" for="employeeHireDate">Fecha de ingreso</label>
                        <input id="employeeHireDate" pInputText type="date" class="w-full" [(ngModel)]="draft.hireDate" (ngModelChange)="handleHireDateChange()" />
                    </div>
                    <div class="col-span-12 md:col-span-6">
                        <label class="block font-medium mb-2" for="employeeRole">Perfil</label>
                        <p-select inputId="employeeRole" [(ngModel)]="draft.role" [options]="roleOptions" optionLabel="label" optionValue="value" appendTo="body" class="w-full" />
                    </div>
                    <div class="col-span-12 md:col-span-6">
                        <label class="block font-medium mb-2" for="employeeStatus">Estado</label>
                        <p-select inputId="employeeStatus" [(ngModel)]="draft.status" [options]="statusOptions" optionLabel="label" optionValue="value" appendTo="body" class="w-full" />
                    </div>
                    @if (editingEmployeeId) {
                        <div class="col-span-12 md:col-span-6">
                            <label class="block font-medium mb-2" for="employeeVacationDays">Días de vacaciones disponibles</label>
                            <input id="employeeVacationDays" pInputText type="number" min="0" class="w-full" [(ngModel)]="draft.vacationAvailableDays" [disabled]="loadingVacationBalance" />
                            @if (loadingVacationBalance) {
                                <small class="text-muted-color">Cargando saldo de vacaciones...</small>
                            } @else if (!draft.vacationBalanceId) {
                                <small class="text-muted-color">Se creará un saldo para {{ currentVacationYear }} al guardar.</small>
                            } @else {
                                <small class="text-muted-color">Saldo del año {{ draft.vacationBalanceYear || currentVacationYear }}. Se recalcula al cambiar la fecha de ingreso.</small>
                            }
                        </div>
                    }
                    <div class="col-span-12">
                        <label class="block font-medium mb-2" for="employeeManager">Jefe directo</label>
                        <input id="employeeManager" pInputText class="w-full" [(ngModel)]="draft.manager" [placeholder]="managerPlaceholder()" />
                        @if (isManagerRole()) {
                            <small class="text-muted-color">Opcional para jefes y directores.</small>
                        }
                    </div>
                </div>

                <ng-template #footer>
                    <p-button label="Cancelar" icon="pi pi-times" severity="secondary" text (onClick)="closeDialog()" />
                    <p-button label="Guardar" icon="pi pi-check" [loading]="saving" [disabled]="!canSave()" (onClick)="saveEmployee()" />
                </ng-template>
            </p-dialog>

            <p-dialog [(visible)]="deleteDialog" [modal]="true" [draggable]="false" [dismissableMask]="true" [style]="{ width: 'min(460px, 92vw)' }" header="Confirmar eliminación">
                @if (employeeToDelete) {
                    <div class="flex flex-col gap-3">
                        <p class="m-0">¿Estás seguro de que quieres eliminar a este empleado?</p>
                        <p class="m-0 text-sm text-muted-color">También se eliminarán sus saldos de vacaciones en Días disponibles.</p>
                        <div class="p-3 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface">
                            <div class="font-semibold">{{ employeeToDelete.name }}</div>
                            <div class="text-sm text-muted-color">{{ employeeToDelete.department }} · {{ employeeToDelete.role }}</div>
                        </div>
                    </div>
                }

                <ng-template #footer>
                    <p-button label="Cancelar" icon="pi pi-times" severity="secondary" text (onClick)="closeDeleteConfirm()" />
                    <p-button label="Eliminar" icon="pi pi-trash" severity="danger" [loading]="deleting" (onClick)="confirmDelete()" />
                </ng-template>
            </p-dialog>
        </section>
    `
})
export class Employees implements OnInit {
    private readonly employeesApi = inject(EmployeesApiService);
    private readonly auth = inject(AuthService);
    private readonly vacationBalancesApi = inject(VacationBalancesApiService);
    private readonly toast = inject(ToastService);
    private readonly cdr = inject(ChangeDetectorRef);

    employees: EmployeeRecord[] = [];

    loading = false;

    saving = false;

    loadingVacationBalance = false;

    deleting = false;

    showPassword = false;

    errorMessage = '';

    employeeDialog = false;

    deleteDialog = false;

    editingEmployeeId: string | null = null;

    employeeToDelete: EmployeeRecord | null = null;

    readonly currentVacationYear = new Date().getFullYear();

    draft = this.createEmptyDraft();

    readonly roleOptions = [
        { label: 'Empleado', value: 'Empleado' },
        { label: 'Jefe / Director', value: 'Jefe/Director' },
        { label: 'Administrador', value: 'Administrador' }
    ];

    readonly departmentOptions = [
        { label: 'Direccion', value: 'Direccion' },
        { label: 'Desarrollo', value: 'Desarrollo' }
    ];

    readonly statusOptions = [
        { label: 'Activo', value: 'ACTIVO' },
        { label: 'Inactivo', value: 'INACTIVO' }
    ];

    ngOnInit() {
        this.loadEmployees();
    }

    loadEmployees() {
        this.loading = true;
        this.errorMessage = '';

        this.employeesApi
            .getEmployees({ page: 1, limit: 50 })
            .pipe(finalize(() => {
                this.loading = false;
                this.cdr.detectChanges();
            }))
            .subscribe({
                next: (response) => {
                    this.employees = response.data.data.map((employee) => this.mapEmployee(employee));
                    this.cdr.detectChanges();
                },
                error: (error) => {
                    this.errorMessage = this.getErrorMessage(error);
                    this.employees = [];
                    this.cdr.detectChanges();
                }
            });
    }

    openCreate() {
        this.editingEmployeeId = null;
        this.draft = this.createEmptyDraft();
        this.showPassword = false;
        this.employeeDialog = true;
    }

    openEdit(employee: EmployeeRecord) {
        this.editingEmployeeId = employee.id;
        this.draft = { ...employee, manager: this.getEditableManager(employee.manager) };
        this.showPassword = false;
        this.employeeDialog = true;
        this.loadVacationBalanceForDraft(employee);
    }

    saveEmployee() {
        if (!this.canSave()) return;

        this.saving = true;
        const payload = this.toEmployeeDto(this.draft);

        if (this.editingEmployeeId) {
            this.employeesApi
                .updateEmployee(this.editingEmployeeId, payload)
                .pipe(switchMap(() => this.saveVacationBalanceForDraft()))
                .pipe(finalize(() => {
                    this.saving = false;
                    this.cdr.detectChanges();
                }))
                .subscribe({
                    next: () => this.handleSaveSuccess('Empleado actualizado'),
                    error: (error: unknown) => this.toast.showError('No se pudo guardar', this.getErrorMessage(error))
                });
            return;
        }

        this.employeesApi
            .createEmployee(payload)
            .pipe(finalize(() => {
                this.saving = false;
                this.cdr.detectChanges();
            }))
            .subscribe({
                next: async () => {
                    const activationEmail = payload.email?.trim();
                    this.handleSaveSuccess('Empleado creado');
                    if (!activationEmail) return;
                    try {
                        await this.auth.requestPasswordReset(activationEmail);
                        this.toast.showInfo('Enlace enviado', `El empleado puede definir su contraseña desde ${activationEmail}.`);
                    } catch {
                        this.toast.showWarn('Cuenta creada sin enlace', 'Pide al empleado que use “¿Olvidaste tu contraseña?” en el inicio de sesión.');
                    }
                },
                error: (error: unknown) => this.toast.showError('No se pudo guardar', this.getErrorMessage(error))
            });
    }

    openDeleteConfirm(employee: EmployeeRecord) {
        this.employeeToDelete = employee;
        this.deleteDialog = true;
    }

    confirmDelete() {
        if (!this.employeeToDelete) return;

        const deletedEmployeeId = this.employeeToDelete.id;
        this.deleting = true;

        this.employeesApi
            .deleteEmployee(deletedEmployeeId)
            .pipe(finalize(() => {
                this.deleting = false;
                this.cdr.detectChanges();
            }))
            .subscribe({
                next: () => {
                    this.toast.showSuccess('Empleado eliminado');
                    this.employees = this.employees.filter((employee) => employee.id !== deletedEmployeeId);
                    this.closeDeleteConfirm();
                    this.loadEmployees();
                },
                error: (error) => {
                    this.toast.showError('No se pudo eliminar', this.getErrorMessage(error));
                }
            });
    }

    closeDeleteConfirm() {
        this.deleteDialog = false;
        this.employeeToDelete = null;
    }

    closeDialog() {
        this.employeeDialog = false;
        this.editingEmployeeId = null;
        this.draft = this.createEmptyDraft();
        this.showPassword = false;
    }

    canSave() {
        const hasRequiredFields = Boolean(this.draft.name.trim() && this.draft.employeeNumber?.trim() && this.isValidEmail() && this.draft.department.trim() && this.draft.hireDate && this.draft.role && this.draft.status);
        const hasValidTemporaryPassword = !this.needsTemporaryPassword() || Boolean(this.draft.password?.trim() && this.draft.password.trim().length >= 6);
        const hasValidVacationDays = !this.editingEmployeeId || this.draft.vacationAvailableDays === null || this.draft.vacationAvailableDays === undefined || Number(this.draft.vacationAvailableDays) >= 0;

        return hasRequiredFields && hasValidTemporaryPassword && hasValidVacationDays && !this.saving && !this.loadingVacationBalance;
    }

    handleHireDateChange() {
        if (!this.editingEmployeeId || this.loadingVacationBalance) return;

        this.applyLegalVacationDaysFromHireDate();
    }

    togglePasswordVisibility() {
        this.showPassword = !this.showPassword;
    }

    isValidEmail() {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.draft.email?.trim() || '');
    }

    needsTemporaryPassword() {
        return !this.editingEmployeeId || !this.draft.uid;
    }

    isManagerRole() {
        return this.draft.role === 'Jefe/Director';
    }

    managerPlaceholder() {
        return this.isManagerRole() ? 'Opcional' : '';
    }

    passwordHelpText() {
        if (this.needsTemporaryPassword()) {
            return 'Obligatoria para crear la cuenta. Mínimo 6 caracteres.';
        }

        return 'Déjala vacía si no quieres cambiar la contraseña.';
    }

    private createEmptyDraft(): EmployeeRecord {
        return {
            id: '',
            name: '',
            email: '',
            employeeNumber: '',
            password: '',
            department: '',
            hireDate: '',
            role: 'Empleado',
            manager: '',
            status: 'ACTIVO',
            statusLabel: 'Activo',
            severity: 'success',
            accountLabel: 'Sin cuenta',
            accountSeverity: 'warn',
            vacationBalanceId: undefined,
            vacationBalanceYear: this.currentVacationYear,
            vacationInitialDays: undefined,
            vacationUsedDays: undefined,
            vacationAvailableDays: null
        };
    }

    private mapEmployee(employee: EmployeeDto): EmployeeRecord {
        return {
            id: employee._id || '',
            uid: employee.uid,
            employeeNumber: employee.employeeNumber,
            password: '',
            name: employee.name,
            email: employee.email,
            department: employee.department,
            hireDate: employee.hireDate || '',
            role: employee.role,
            managerId: employee.managerId,
            manager: employee.managerName || (employee.role === 'Jefe/Director' ? 'No aplica' : 'Sin jefe asignado'),
            status: employee.status,
            statusLabel: this.getStatusLabel(employee.status),
            severity: this.getSeverity(employee.status),
            accountLabel: employee.uid ? 'Con cuenta' : 'Sin cuenta',
            accountSeverity: employee.uid ? 'success' : 'warn',
            vacationBalanceId: undefined,
            vacationBalanceYear: this.currentVacationYear,
            vacationInitialDays: undefined,
            vacationUsedDays: undefined,
            vacationAvailableDays: null
        };
    }

    private loadVacationBalanceForDraft(employee: EmployeeRecord) {
        this.loadingVacationBalance = true;

        this.vacationBalancesApi
            .getBalances({
                employeeId: employee.id,
                employeeName: employee.name,
                year: this.currentVacationYear,
                page: 1,
                limit: 1
            })
            .pipe(finalize(() => {
                this.loadingVacationBalance = false;
                this.cdr.detectChanges();
            }))
            .subscribe({
                next: (response) => {
                    const balance = response.data.data[0];
                    if (!balance) {
                        this.draft = {
                            ...this.draft,
                            vacationBalanceId: undefined,
                            vacationBalanceYear: this.currentVacationYear,
                            vacationInitialDays: undefined,
                            vacationUsedDays: 0,
                            vacationAvailableDays: null
                        };
                        return;
                    }

                    this.draft = {
                        ...this.draft,
                        vacationBalanceId: balance._id,
                        vacationBalanceYear: balance.year,
                        vacationInitialDays: balance.initialDays,
                        vacationUsedDays: balance.usedDays,
                        vacationAvailableDays: balance.availableDays
                    };
                },
                error: () => {
                    this.draft = {
                        ...this.draft,
                        vacationBalanceId: undefined,
                        vacationBalanceYear: this.currentVacationYear,
                        vacationInitialDays: undefined,
                        vacationUsedDays: 0,
                        vacationAvailableDays: null
                    };
                }
            });
    }

    private saveVacationBalanceForDraft() {
        if (!this.editingEmployeeId || this.draft.vacationAvailableDays === null || this.draft.vacationAvailableDays === undefined) {
            return of(null);
        }

        const availableDays = Number(this.draft.vacationAvailableDays);
        const usedDays = Number(this.draft.vacationUsedDays || 0);
        const legalPeriod = this.getVacationPeriodForDate(this.draft.hireDate);

        if (this.draft.vacationBalanceId) {
            return this.vacationBalancesApi.updateBalance(this.draft.vacationBalanceId, {
                employeeId: this.editingEmployeeId,
                employeeName: this.draft.name.trim(),
                department: this.draft.department.trim(),
                hireDate: this.draft.hireDate,
                year: legalPeriod?.year ?? this.currentVacationYear,
                serviceYears: legalPeriod?.serviceYears ?? 0,
                legalDays: legalPeriod?.legalDays ?? availableDays + usedDays,
                periodStartDate: legalPeriod?.periodStartDate,
                periodEndDate: legalPeriod?.periodEndDate,
                initialDays: availableDays + usedDays,
                availableDays,
                lastMove: 'Saldo editado desde empleados'
            });
        }

        const balance: VacationBalanceDto = {
            employeeId: this.editingEmployeeId,
            employeeName: this.draft.name.trim(),
            department: this.draft.department.trim(),
            hireDate: this.draft.hireDate,
            year: legalPeriod?.year ?? this.currentVacationYear,
            serviceYears: legalPeriod?.serviceYears,
            legalDays: legalPeriod?.legalDays,
            periodStartDate: legalPeriod?.periodStartDate,
            periodEndDate: legalPeriod?.periodEndDate,
            initialDays: availableDays + usedDays,
            usedDays,
            availableDays,
            lastMove: 'Saldo creado desde empleados'
        };

        return this.vacationBalancesApi.createBalance(balance);
    }

    private applyLegalVacationDaysFromHireDate() {
        const legalPeriod = this.getVacationPeriodForDate(this.draft.hireDate);
        const usedDays = Number(this.draft.vacationUsedDays || 0);
        const legalDays = legalPeriod?.legalDays ?? 0;

        this.draft = {
            ...this.draft,
            vacationBalanceYear: legalPeriod?.year ?? this.currentVacationYear,
            vacationInitialDays: legalDays,
            vacationAvailableDays: Math.max(legalDays - usedDays, 0)
        };
    }

    private getVacationPeriodForDate(hireDate: string, referenceDate = new Date()) {
        const hire = this.parseLocalDate(hireDate);
        const reference = this.clearTime(referenceDate);

        if (!hire || reference < hire) return null;

        const anniversaryThisYear = new Date(reference.getFullYear(), hire.getMonth(), hire.getDate());
        const periodStartYear = reference >= anniversaryThisYear ? reference.getFullYear() : reference.getFullYear() - 1;
        const serviceYears = periodStartYear - hire.getFullYear();

        if (serviceYears < 1) return null;

        const periodStart = new Date(periodStartYear, hire.getMonth(), hire.getDate());
        const periodEnd = new Date(periodStartYear + 1, hire.getMonth(), hire.getDate() - 1);

        return {
            year: periodStartYear,
            serviceYears,
            legalDays: this.getMexicanVacationDaysBySeniority(serviceYears),
            periodStartDate: this.formatIsoDate(periodStart),
            periodEndDate: this.formatIsoDate(periodEnd)
        };
    }

    private getMexicanVacationDaysBySeniority(serviceYears: number) {
        if (serviceYears < 1) return 0;
        if (serviceYears <= 5) return 10 + serviceYears * 2;

        return 20 + Math.ceil((serviceYears - 5) / 5) * 2;
    }

    private parseLocalDate(value: string) {
        const [year, month, day] = value.split('-').map(Number);

        if (!year || !month || !day) return null;

        return this.clearTime(new Date(year, month - 1, day));
    }

    private clearTime(date: Date) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }

    private formatIsoDate(date: Date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    private toEmployeeDto(employee: EmployeeRecord): EmployeeDto {
        return {
            uid: employee.uid || undefined,
            employeeNumber: employee.employeeNumber || undefined,
            name: employee.name.trim(),
            email: employee.email?.trim() || undefined,
            password: employee.password?.trim() || undefined,
            department: employee.department.trim(),
            hireDate: employee.hireDate,
            role: employee.role,
            managerId: employee.managerId || undefined,
            managerName: this.getEditableManager(employee.manager).trim() || undefined,
            status: employee.status
        };
    }

    private getEditableManager(manager: string) {
        return ['No aplica', 'Sin jefe asignado'].includes(manager) ? '' : manager;
    }

    private getSeverity(status: EmployeeStatus): EmployeeSeverity {
        return status === 'ACTIVO' ? 'success' : 'secondary';
    }

    private getStatusLabel(status: EmployeeStatus) {
        return status === 'ACTIVO' ? 'Activo' : 'Inactivo';
    }

    private handleSaveSuccess(message: string) {
        this.toast.showSuccess(message);
        this.closeDialog();
        this.loadEmployees();
        this.cdr.detectChanges();
    }

    formatDate(value: string) {
        if (!value) return 'Sin fecha';

        const date = new Date(`${value}T00:00:00`);
        return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
    }

    private getErrorMessage(error: unknown) {
        const httpError = error as { status?: number; error?: { message?: string; msg?: string } };

        if (httpError?.status === 401 || httpError?.status === 403) {
            return 'No tienes permisos de administrador para gestionar empleados.';
        }

        return httpError?.error?.message || httpError?.error?.msg || 'Revisa que el backend esté encendido en http://localhost:8080.';
    }
}
