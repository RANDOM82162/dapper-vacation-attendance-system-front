import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

type EmployeeStatus = 'Activo' | 'Inactivo';
type EmployeeSeverity = 'success' | 'secondary';

interface EmployeeRecord {
    id: number;
    name: string;
    department: string;
    role: string;
    manager: string;
    status: EmployeeStatus;
    severity: EmployeeSeverity;
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

            <p-table [value]="employees" [tableStyle]="{ 'min-width': '78rem' }">
                <ng-template #header>
                    <tr>
                        <th>Nombre</th>
                        <th>Departamento</th>
                        <th>Perfil</th>
                        <th>Jefe directo</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </ng-template>
                <ng-template #body let-employee>
                    <tr>
                        <td>{{ employee.name }}</td>
                        <td>{{ employee.department }}</td>
                        <td>{{ employee.role }}</td>
                        <td>{{ employee.manager }}</td>
                        <td><p-tag [value]="employee.status" [severity]="employee.severity" /></td>
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
                        <td colspan="6" class="text-center py-6 text-muted-color">No hay empleados registrados.</td>
                    </tr>
                </ng-template>
            </p-table>

            <p-dialog [(visible)]="employeeDialog" [modal]="true" [dismissableMask]="true" [style]="{ width: 'min(640px, 92vw)' }" [header]="editingEmployeeId ? 'Editar empleado' : 'Nuevo empleado'">
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-12 md:col-span-6">
                        <label class="block font-medium mb-2" for="employeeName">Nombre</label>
                        <input id="employeeName" pInputText class="w-full" [(ngModel)]="draft.name" />
                    </div>
                    <div class="col-span-12 md:col-span-6">
                        <label class="block font-medium mb-2" for="employeeDepartment">Departamento</label>
                        <input id="employeeDepartment" pInputText class="w-full" [(ngModel)]="draft.department" />
                    </div>
                    <div class="col-span-12 md:col-span-6">
                        <label class="block font-medium mb-2" for="employeeRole">Perfil</label>
                        <p-select inputId="employeeRole" [(ngModel)]="draft.role" [options]="roleOptions" optionLabel="label" optionValue="value" class="w-full" />
                    </div>
                    <div class="col-span-12 md:col-span-6">
                        <label class="block font-medium mb-2" for="employeeStatus">Estado</label>
                        <p-select inputId="employeeStatus" [(ngModel)]="draft.status" [options]="statusOptions" optionLabel="label" optionValue="value" class="w-full" />
                    </div>
                    <div class="col-span-12">
                        <label class="block font-medium mb-2" for="employeeManager">Jefe directo</label>
                        <input id="employeeManager" pInputText class="w-full" [(ngModel)]="draft.manager" />
                    </div>
                </div>

                <ng-template #footer>
                    <p-button label="Cancelar" icon="pi pi-times" severity="secondary" text (onClick)="closeDialog()" />
                    <p-button label="Guardar" icon="pi pi-check" [disabled]="!canSave()" (onClick)="saveEmployee()" />
                </ng-template>
            </p-dialog>

            <p-dialog [(visible)]="deleteDialog" [modal]="true" [dismissableMask]="true" [style]="{ width: 'min(460px, 92vw)' }" header="Confirmar eliminacion">
                @if (employeeToDelete) {
                    <div class="flex flex-col gap-3">
                        <p class="m-0">Estas seguro de que quieres eliminar a este empleado?</p>
                        <div class="p-3 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface">
                            <div class="font-semibold">{{ employeeToDelete.name }}</div>
                            <div class="text-sm text-muted-color">{{ employeeToDelete.department }} · {{ employeeToDelete.role }}</div>
                        </div>
                    </div>
                }

                <ng-template #footer>
                    <p-button label="Cancelar" icon="pi pi-times" severity="secondary" text (onClick)="closeDeleteConfirm()" />
                    <p-button label="Eliminar" icon="pi pi-trash" severity="danger" (onClick)="confirmDelete()" />
                </ng-template>
            </p-dialog>
        </section>
    `
})
export class Employees {
    employees: EmployeeRecord[] = [
        { id: 1, name: 'Alejandro Paz', department: 'Desarrollo', role: 'Empleado', manager: 'Cinthia Montoya', status: 'Activo', severity: 'success' }
    ];

    employeeDialog = false;

    deleteDialog = false;

    editingEmployeeId: number | null = null;

    employeeToDelete: EmployeeRecord | null = null;

    draft = this.createEmptyDraft();

    readonly roleOptions = [
        { label: 'Empleado', value: 'Empleado' },
        { label: 'Jefe / Director', value: 'Jefe / Director' },
        { label: 'Administrador', value: 'Administrador' }
    ];

    readonly statusOptions = [
        { label: 'Activo', value: 'Activo' },
        { label: 'Inactivo', value: 'Inactivo' }
    ];

    openCreate() {
        this.editingEmployeeId = null;
        this.draft = this.createEmptyDraft();
        this.employeeDialog = true;
    }

    openEdit(employee: EmployeeRecord) {
        this.editingEmployeeId = employee.id;
        this.draft = { ...employee };
        this.employeeDialog = true;
    }

    saveEmployee() {
        if (!this.canSave()) return;

        const employee = {
            ...this.draft,
            severity: this.getSeverity(this.draft.status)
        };

        if (this.editingEmployeeId) {
            this.employees = this.employees.map((item) => (item.id === this.editingEmployeeId ? { ...employee, id: this.editingEmployeeId } : item));
        } else {
            this.employees = [{ ...employee, id: this.nextId() }, ...this.employees];
        }

        this.closeDialog();
    }

    openDeleteConfirm(employee: EmployeeRecord) {
        this.employeeToDelete = employee;
        this.deleteDialog = true;
    }

    confirmDelete() {
        if (!this.employeeToDelete) return;
        this.employees = this.employees.filter((item) => item.id !== this.employeeToDelete?.id);
        this.closeDeleteConfirm();
    }

    closeDeleteConfirm() {
        this.deleteDialog = false;
        this.employeeToDelete = null;
    }

    closeDialog() {
        this.employeeDialog = false;
        this.editingEmployeeId = null;
        this.draft = this.createEmptyDraft();
    }

    canSave() {
        return Boolean(this.draft.name.trim() && this.draft.department.trim() && this.draft.role && this.draft.manager.trim() && this.draft.status);
    }

    private createEmptyDraft(): EmployeeRecord {
        return {
            id: 0,
            name: '',
            department: '',
            role: 'Empleado',
            manager: '',
            status: 'Activo',
            severity: 'success'
        };
    }

    private nextId() {
        return Math.max(0, ...this.employees.map((employee) => employee.id)) + 1;
    }

    private getSeverity(status: EmployeeStatus): EmployeeSeverity {
        return status === 'Activo' ? 'success' : 'secondary';
    }
}
