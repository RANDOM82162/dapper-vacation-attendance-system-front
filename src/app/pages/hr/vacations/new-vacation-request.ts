import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';
import { countVacationChargeableDays } from './vacation-days';
import { VacationRequestsApiService } from './vacation-requests-api.service';
import { VacationBalancesApiService, VacationBalanceDto } from './vacation-balances-api.service';
import { ToastService } from '@/app/services/toast.service';
import { AuthService } from '@/app/services/auth.service';

@Component({
    selector: 'app-new-vacation-request',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, TextareaModule, TagModule],
    template: `
        <section class="grid grid-cols-12 gap-4">
            <div class="col-span-12 xl:col-span-8 p-5 bg-surface-0 dark:bg-surface-900 border border-surface rounded-lg">
                <div class="flex items-center justify-between gap-3 mb-5">
                    <div>
                        <h1 class="text-2xl font-semibold m-0">Nueva solicitud de vacaciones</h1>
                        <p class="text-muted-color mt-2 mb-0">Los días que excedan tu saldo se solicitarán sin goce de sueldo.</p>
                    </div>
                    <p-tag value="Empleado" severity="success" />
                </div>

                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-12 md:col-span-6">
                        <label class="block font-medium mb-2" for="startDate">Fecha de inicio</label>
                        <input id="startDate" pInputText type="date" class="w-full" [(ngModel)]="request.startDate" (ngModelChange)="onStartDateChange()" />
                    </div>
                    <div class="col-span-12 md:col-span-6">
                        <label class="block font-medium mb-2" for="endDate">Fecha de regreso</label>
                        <input id="endDate" pInputText type="date" class="w-full" [(ngModel)]="request.endDate" />
                    </div>
                    <div class="col-span-12 md:col-span-6">
                        <label class="block font-medium mb-2" for="days">Días solicitados</label>
                        <input id="days" pInputText type="number" class="w-full" [ngModel]="chargeableDays()" readonly />
                    </div>
                    <div class="col-span-12">
                        <label class="block font-medium mb-2" for="comments">Comentarios</label>
                        <textarea id="comments" pTextarea rows="5" class="w-full" [(ngModel)]="request.comments"></textarea>
                    </div>
                </div>

                @if (errorMessage) {
                    <div class="mt-4 p-4 rounded-lg border border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
                        {{ errorMessage }}
                    </div>
                }

                @if (unpaidDays() > 0) {
                    <div class="mt-4 p-4 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                        Esta solicitud incluye {{ unpaidDays() }} día(s) sin goce de sueldo. {{ paidDays() }} día(s) se cubrirían con tu saldo actual; el jefe/director verá este desglose al revisarla.
                    </div>
                }

                <div class="flex flex-wrap justify-end gap-3 mt-6">
                    <p-button label="Enviar solicitud" icon="pi pi-send" [loading]="saving" [disabled]="!canSubmit()" (onClick)="submitRequest()" />
                </div>
            </div>

            <aside class="col-span-12 xl:col-span-4 flex flex-col gap-4">
                <div class="p-5 bg-surface-0 dark:bg-surface-900 border border-surface rounded-lg">
                    <h2 class="text-lg font-semibold m-0 mb-4">Saldo actual</h2>
                    <div class="text-4xl font-semibold">{{ availableDays() }} días</div>
                    <p class="text-muted-color mb-0 mt-2">Periodo: {{ balancePeriodLabel() }}</p>
                    <p class="text-muted-color mb-0 mt-2">Días con goce: {{ paidDays() }}. Días sin goce: {{ unpaidDays() }}.</p>
                    <p class="text-muted-color mb-0 mt-2">Si esta solicitud se aprueba, quedarían {{ projectedBalance() }} días disponibles.</p>
                </div>
                <div class="p-5 bg-surface-0 dark:bg-surface-900 border border-surface rounded-lg">
                    <h2 class="text-lg font-semibold m-0 mb-4">Validaciones previstas</h2>
                    <ul class="m-0 pl-5 text-muted-color leading-7">
                        <li>Fechas obligatorias y ordenadas.</li>
                        <li>Sábados, domingos y festivos oficiales no descuentan saldo.</li>
                        <li>El saldo cubre primero los días con goce de sueldo.</li>
                        <li>Los días que excedan el saldo quedan sin goce de sueldo.</li>
                        <li>Saldo legal por fecha de ingreso y antigüedad.</li>
                        <li>Historial desde el envío.</li>
                    </ul>
                </div>
            </aside>
        </section>
    `
})
export class NewVacationRequest implements OnInit {
    private router = inject(Router);

    private auth = inject(AuthService);

    private vacationRequestsApi = inject(VacationRequestsApiService);

    private vacationBalancesApi = inject(VacationBalancesApiService);

    private toast = inject(ToastService);

    private cdr = inject(ChangeDetectorRef);

    saving = false;

    loadingBalance = false;

    availableDaysValue = 0;

    selectedBalance: VacationBalanceDto | null = null;

    private selectedBalanceDate = '';

    errorMessage = '';

    request = {
        startDate: '',
        endDate: '',
        days: 0,
        comments: ''
    };

    ngOnInit() {
        this.loadBalance();
    }

    loadBalance() {
        const referenceDate = this.request.startDate || this.getTodayValue();

        this.selectedBalanceDate = referenceDate;
        this.loadingBalance = true;
        this.errorMessage = '';

        this.vacationBalancesApi
            .getBalances({ employeeName: this.auth.getEmployeeName(), referenceDate, page: 1, limit: 100 })
            .pipe(
                finalize(() => {
                    this.loadingBalance = false;
                    this.cdr.detectChanges();
                })
            )
            .subscribe({
                next: (response) => {
                    this.selectedBalance = this.findBalanceForDate(response.data.data, referenceDate);
                    this.availableDaysValue = this.selectedBalance?.availableDays ?? 0;
                    this.cdr.detectChanges();
                },
                error: (error: unknown) => {
                    this.selectedBalance = null;
                    this.availableDaysValue = 0;
                    this.errorMessage = this.getErrorMessage(error);
                    this.cdr.detectChanges();
                }
            });
    }

    onStartDateChange() {
        if (this.request.startDate && this.request.startDate !== this.selectedBalanceDate) {
            this.loadBalance();
        }
    }

    availableDays() {
        return this.availableDaysValue;
    }

    chargeableDays() {
        return countVacationChargeableDays(this.request.startDate, this.request.endDate);
    }

    projectedBalance() {
        return Math.max(this.availableDays() - this.paidDays(), 0);
    }

    paidDays() {
        return Math.min(Math.max(this.availableDays(), 0), this.chargeableDays());
    }

    unpaidDays() {
        return Math.max(this.chargeableDays() - this.paidDays(), 0);
    }

    balancePeriodLabel() {
        if (!this.selectedBalance) return 'Sin saldo registrado';
        if (!this.selectedBalance.periodStartDate || !this.selectedBalance.periodEndDate) return String(this.selectedBalance.year);

        return `${this.formatDate(this.selectedBalance.periodStartDate)} - ${this.formatDate(this.selectedBalance.periodEndDate)}`;
    }

    canSubmit() {
        return Boolean(!this.saving && !this.loadingBalance && this.request.startDate && this.request.endDate && this.request.endDate >= this.request.startDate && this.chargeableDays() > 0);
    }

    submitRequest() {
        if (!this.canSubmit()) return;

        this.saving = true;
        this.errorMessage = '';

        this.vacationRequestsApi
            .createRequest({
                employeeId: this.auth.getEmployeeNumber(),
                employeeName: this.auth.getEmployeeName(),
                department: this.auth.getEmployeeDepartment(),
                startDate: this.request.startDate,
                endDate: this.request.endDate,
                days: this.chargeableDays(),
                comments: this.request.comments
            })
            .pipe(
                finalize(() => {
                    this.saving = false;
                    this.cdr.detectChanges();
                })
            )
            .subscribe({
                next: () => {
                    this.toast.showSuccess('Solicitud enviada');
                    this.router.navigate(['/vacaciones/mis-solicitudes']);
                },
                error: (error: unknown) => {
                    this.errorMessage = this.getErrorMessage(error);
                    this.toast.showError('No se pudo enviar', this.errorMessage);
                    this.cdr.detectChanges();
                }
            });
    }

    private findBalanceForDate(balances: VacationBalanceDto[], requestDate: string) {
        return balances.find((balance) => {
            if (!balance.periodStartDate || !balance.periodEndDate) return false;
            return requestDate >= balance.periodStartDate && requestDate <= balance.periodEndDate;
        }) || balances[0] || null;
    }

    private formatDate(value: string) {
        const date = new Date(`${value}T00:00:00`);
        return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
    }

    private getTodayValue() {
        const today = new Date();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');

        return `${today.getFullYear()}-${month}-${day}`;
    }

    private getErrorMessage(error: unknown) {
        const httpError = error as { status?: number; error?: { message?: string; msg?: string } };

        if (httpError?.status === 401 || httpError?.status === 403) {
            return 'Cuando hagamos el login, esta solicitud se enviará con el token del empleado.';
        }

        return httpError?.error?.message || httpError?.error?.msg || 'Revisa que el backend este encendido en http://localhost:8080.';
    }
}
