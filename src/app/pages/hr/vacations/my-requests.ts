import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, take, timeout } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { TagSeverity, VacationRequest, VacationWorkflowService } from './vacation-workflow.service';
import { VacationRequestDto, VacationRequestsApiService } from './vacation-requests-api.service';
import { VacationBalanceDto, VacationBalancesApiService } from './vacation-balances-api.service';
import { countVacationChargeableDays } from './vacation-days';
import { AuthService } from '@/app/services/auth.service';
import { VacationHistoryTimeline } from './vacation-history-timeline';

@Component({
    selector: 'app-my-requests',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, DialogModule, InputTextModule, TableModule, TagModule, TextareaModule, VacationHistoryTimeline],
    template: `
        <section class="p-5 bg-surface-0 dark:bg-surface-900 border border-surface rounded-lg">
            <h1 class="text-2xl font-semibold m-0">Mis solicitudes</h1>
            <p class="text-muted-color mt-2 mb-5">Seguimiento de solicitudes con estado e historial resumido.</p>

            @if (errorMessage) {
                <div class="mb-4 p-4 rounded-lg border border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200 flex flex-wrap items-center justify-between gap-3">
                    <span>{{ errorMessage }}</span>
                    <p-button label="Reintentar" icon="pi pi-refresh" severity="danger" outlined (onClick)="loadRequests()" />
                </div>
            }

            <p-table
                [value]="requests"
                [loading]="loading && requests.length === 0"
                [tableStyle]="{ 'min-width': '70rem' }"
                [paginator]="true"
                [rows]="rows"
                [first]="first"
                [rowsPerPageOptions]="rowsPerPageOptions"
                [showCurrentPageReport]="true"
                currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} solicitudes"
                (onPage)="onPage($event)"
            >
                <ng-template #header>
                    <tr>
                        <th>Folio</th>
                        <th>Periodo</th>
                        <th>Días</th>
                        <th>Estado</th>
                        <th>Ultimo movimiento</th>
                        <th>Acciones</th>
                    </tr>
                </ng-template>
                <ng-template #body let-request>
                    <tr>
                        <td>{{ request.id }}</td>
                        <td>{{ formatPeriod(request) }}</td>
                        <td>
                            <span class="block">{{ request.days }} total</span>
                            <small class="text-muted-color">{{ paidDays(request) }} con goce · {{ unpaidDays(request) }} sin goce</small>
                        </td>
                        <td><p-tag [value]="request.status" [severity]="getSeverity(request.status)" /></td>
                        <td>{{ request.updatedAt }}</td>
                        <td>
                            <div class="flex items-center gap-2">
                                <p-button icon="pi pi-eye" [rounded]="true" [outlined]="true" severity="secondary" (onClick)="openDetail(request)" />
                                @if (canEditRequest(request)) {
                                    <p-button icon="pi pi-pencil" [rounded]="true" [outlined]="true" severity="secondary" (onClick)="openEdit(request)" />
                                }
                            </div>
                        </td>
                    </tr>
                </ng-template>
                <ng-template #emptymessage>
                    <tr>
                        <td colspan="6" class="text-center py-6 text-muted-color">No hay solicitudes registradas.</td>
                    </tr>
                </ng-template>
            </p-table>

            <p-dialog [(visible)]="detailDialog" [modal]="true" [draggable]="false" [style]="{ width: '540px' }" [header]="selectedRequest?.id || 'Detalle de solicitud'">
                @if (selectedRequest) {
                    <div class="flex flex-col gap-4">
                        <div class="flex items-center justify-between gap-3">
                            <div>
                                <span class="block text-sm text-muted-color">Periodo</span>
                                <span class="font-semibold">{{ formatPeriod(selectedRequest) }}</span>
                            </div>
                            <p-tag [value]="selectedRequest.status" [severity]="getSeverity(selectedRequest.status)" />
                        </div>

                        <div class="grid grid-cols-12 gap-3">
                            <div class="col-span-6">
                                <span class="block text-sm text-muted-color">Días solicitados</span>
                                <span class="font-semibold">{{ selectedRequest.days }}</span>
                            </div>
                            <div class="col-span-6">
                                <span class="block text-sm text-muted-color">Con goce de sueldo</span>
                                <span class="font-semibold">{{ paidDays(selectedRequest) }}</span>
                            </div>
                            <div class="col-span-6">
                                <span class="block text-sm text-muted-color">Sin goce de sueldo</span>
                                <span class="font-semibold">{{ unpaidDays(selectedRequest) }}</span>
                            </div>
                        </div>

                        <div>
                            <span class="block text-sm text-muted-color mb-2">Comentarios</span>
                            <div class="p-3 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface">{{ selectedRequest.comments }}</div>
                        </div>

                        @if (selectedRequest.managerComment) {
                            <div>
                                <span class="block text-sm text-muted-color mb-2">Comentario del jefe/director</span>
                                <div class="p-3 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface whitespace-pre-line">{{ selectedRequest.managerComment }}</div>
                            </div>
                        }

                        <div>
                            <span class="block font-medium mb-2">Historial completo</span>
                            <app-vacation-history-timeline [entries]="selectedRequest.history" />
                        </div>
                    </div>
                }
                <ng-template #footer>
                    <p-button label="Cerrar" icon="pi pi-times" severity="secondary" text (onClick)="closeDetail()" />
                </ng-template>
            </p-dialog>

            <p-dialog [(visible)]="editDialog" [modal]="true" [draggable]="false" [style]="{ width: '560px' }" header="Modificar solicitud">
                @if (editingRequest) {
                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-12 md:col-span-6">
                            <label class="block font-medium mb-2" for="editStartDate">Fecha de inicio</label>
                            <input id="editStartDate" pInputText type="date" class="w-full" [(ngModel)]="editDraft.startDate" (ngModelChange)="onEditStartDateChange()" />
                        </div>
                        <div class="col-span-12 md:col-span-6">
                            <label class="block font-medium mb-2" for="editEndDate">Fecha de regreso</label>
                            <input id="editEndDate" pInputText type="date" class="w-full" [(ngModel)]="editDraft.endDate" />
                        </div>
                        <div class="col-span-12">
                            <label class="block font-medium mb-2" for="editDays">Días solicitados</label>
                            <input id="editDays" pInputText type="number" class="w-full" [ngModel]="editChargeableDays()" readonly />
                        </div>
                        <div class="col-span-12 text-sm text-muted-color">
                            @if (loadingEditBalance) {
                                Calculando el desglose según tu saldo...
                            } @else if (editBalanceError) {
                                No se pudo consultar el saldo actual; se recalculará al guardar.
                            } @else {
                                {{ editPaidDays() }} día(s) con goce y {{ editUnpaidDays() }} sin goce de sueldo.
                            }
                        </div>
                        @if (!loadingEditBalance && !editBalanceError && editUnpaidDays() > 0) {
                            <div class="col-span-12 p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-200">
                                La modificación dejaría {{ editUnpaidDays() }} día(s) sin goce de sueldo por exceder tu saldo.
                            </div>
                        }
                        <div class="col-span-12">
                            <label class="block font-medium mb-2" for="editComments">Comentarios</label>
                            <textarea id="editComments" pTextarea rows="5" class="w-full" [(ngModel)]="editDraft.comments"></textarea>
                        </div>
                    </div>

                    @if (editErrorMessage) {
                        <div class="mt-4 p-4 rounded-lg border border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
                            {{ editErrorMessage }}
                        </div>
                    }
                }
                <ng-template #footer>
                    <p-button label="Cancelar" icon="pi pi-times" severity="secondary" text (onClick)="closeEdit()" />
                    <p-button label="Guardar cambios" icon="pi pi-check" [loading]="savingEdit" [disabled]="!canSaveEdit()" (onClick)="saveEdit()" />
                </ng-template>
            </p-dialog>
        </section>
    `
})
export class MyRequests implements OnInit {
    readonly workflow = inject(VacationWorkflowService);
    private readonly auth = inject(AuthService);
    private readonly vacationRequestsApi = inject(VacationRequestsApiService);
    private readonly vacationBalancesApi = inject(VacationBalancesApiService);
    private readonly cdr = inject(ChangeDetectorRef);

    requests: VacationRequest[] = [];

    balances: VacationBalanceDto[] = [];

    loading = false;

    errorMessage = '';

    first = 0;

    rows = 10;

    readonly rowsPerPageOptions = [10, 20, 50];

    detailDialog = false;

    selectedRequest: VacationRequest | null = null;

    editDialog = false;

    editingRequest: VacationRequest | null = null;

    savingEdit = false;

    loadingEditBalance = false;

    editAvailableDays = 0;

    editBalanceError = false;

    private editBalanceDate = '';

    editErrorMessage = '';

    editDraft = {
        startDate: '',
        endDate: '',
        comments: ''
    };

    ngOnInit() {
        this.loadRequests();
    }

    loadRequests() {
        this.loading = true;
        this.errorMessage = '';

        this.vacationRequestsApi
            .getMyRequests({ employeeName: this.auth.getEmployeeName(), page: 1, limit: 100 })
            .pipe(
                timeout({ first: 15000 }),
                take(1),
                finalize(() => {
                    this.loading = false;
                    this.cdr.detectChanges();
                })
            )
            .subscribe({
                next: (response) => {
                    this.requests = response.data.data.map((request) => this.mapRequest(request));
                    this.first = 0;
                    this.cdr.detectChanges();
                },
                error: (error: unknown) => {
                    this.errorMessage = this.getErrorMessage(error);
                    this.requests = [];
                    this.cdr.detectChanges();
                }
            });

        this.vacationBalancesApi
            .getBalances({ employeeName: this.auth.getEmployeeName(), page: 1, limit: 500 })
            .pipe(timeout({ first: 15000 }), take(1))
            .subscribe({
                next: (response) => {
                    this.balances = response.data.data;
                    this.cdr.detectChanges();
                },
                error: () => {
                    this.balances = [];
                    this.cdr.detectChanges();
                }
            });
    }

    openDetail(request: VacationRequest) {
        this.selectedRequest = request;
        this.detailDialog = true;
    }

    closeDetail() {
        this.detailDialog = false;
        this.selectedRequest = null;
    }

    openEdit(request: VacationRequest) {
        if (!this.canEditRequest(request)) return;

        this.editingRequest = request;
        this.editDraft = {
            startDate: request.startDate,
            endDate: request.endDate,
            comments: request.comments
        };
        this.editErrorMessage = '';
        this.editBalanceError = false;
        this.editDialog = true;
        this.loadEditBalance();
    }

    closeEdit() {
        if (this.savingEdit) return;

        this.editDialog = false;
        this.editingRequest = null;
        this.editErrorMessage = '';
        this.loadingEditBalance = false;
    }

    saveEdit() {
        if (!this.canSaveEdit() || !this.editingRequest?.backendId) return;

        this.savingEdit = true;
        this.editErrorMessage = '';

        this.vacationRequestsApi
            .updateRequest(this.editingRequest.backendId, {
                startDate: this.editDraft.startDate,
                endDate: this.editDraft.endDate,
                days: this.editChargeableDays(),
                comments: this.editDraft.comments
            })
            .pipe(finalize(() => {
                this.savingEdit = false;
                this.cdr.detectChanges();
            }))
            .subscribe({
                next: () => {
                    this.savingEdit = false;
                    this.closeEdit();
                    this.loadRequests();
                },
                error: (error: unknown) => {
                    this.editErrorMessage = this.getErrorMessage(error);
                    this.cdr.detectChanges();
                }
            });
    }

    canEditRequest(request: VacationRequest) {
        return Boolean(request.backendId && (request.status === 'Pendiente' || request.status === 'Cambios solicitados'));
    }

    canSaveEdit() {
        return Boolean(
            !this.savingEdit &&
            !this.loadingEditBalance &&
            this.editDraft.startDate &&
            this.editDraft.endDate &&
            this.editDraft.endDate >= this.editDraft.startDate &&
            this.editChargeableDays() > 0
        );
    }

    editChargeableDays() {
        return countVacationChargeableDays(this.editDraft.startDate, this.editDraft.endDate);
    }

    onEditStartDateChange() {
        if (this.editDraft.startDate && this.editDraft.startDate !== this.editBalanceDate) {
            this.loadEditBalance();
        }
    }

    editPaidDays() {
        return Math.min(Math.max(this.editAvailableDays, 0), this.editChargeableDays());
    }

    editUnpaidDays() {
        return Math.max(this.editChargeableDays() - this.editPaidDays(), 0);
    }

    paidDays(request: VacationRequest) {
        if (request.status === 'Aprobada') return request.paidDays ?? request.days;
        if (request.status === 'Pendiente' || request.status === 'Cambios solicitados') {
            const balance = this.findBalance(request);
            return Math.min(Math.max(balance?.availableDays ?? 0, 0), request.days);
        }

        return request.paidDays ?? request.days;
    }

    unpaidDays(request: VacationRequest) {
        if (request.status === 'Aprobada') return request.unpaidDays ?? 0;
        if (request.status !== 'Pendiente' && request.status !== 'Cambios solicitados') return request.unpaidDays ?? 0;

        return Math.max(request.days - this.paidDays(request), 0);
    }

    private loadEditBalance() {
        const referenceDate = this.editDraft.startDate;
        if (!referenceDate) return;

        this.editBalanceDate = referenceDate;
        this.loadingEditBalance = true;
        this.editBalanceError = false;

        this.vacationBalancesApi
            .getBalances({ employeeName: this.auth.getEmployeeName(), referenceDate, page: 1, limit: 100 })
            .pipe(finalize(() => {
                if (referenceDate !== this.editDraft.startDate) return;
                this.loadingEditBalance = false;
                this.cdr.detectChanges();
            }))
            .subscribe({
                next: (response) => {
                    if (referenceDate !== this.editDraft.startDate) return;
                    const balances = response.data.data;
                    const balance = balances.find((item) =>
                        item.periodStartDate && item.periodEndDate && referenceDate >= item.periodStartDate && referenceDate <= item.periodEndDate
                    ) || balances.find((item) => item.year === Number(referenceDate.slice(0, 4)));
                    this.editAvailableDays = balance?.availableDays ?? 0;
                    this.cdr.detectChanges();
                },
                error: () => {
                    if (referenceDate !== this.editDraft.startDate) return;
                    this.editAvailableDays = 0;
                    this.editBalanceError = true;
                    this.cdr.detectChanges();
                }
            });
    }

    onPage(event: { first?: number; rows?: number }) {
        this.first = event.first ?? 0;
        this.rows = event.rows ?? 10;
    }

    pagedRequests() {
        return this.requests.slice(this.first, this.first + this.rows);
    }

    formatPeriod(request: VacationRequest) {
        const start = this.formatDate(request.startDate);
        const end = this.formatDate(request.endDate);
        return `${start} - ${end}`;
    }

    getSeverity(status: VacationRequest['status']): TagSeverity {
        return this.workflow.getSeverity(status);
    }

    private mapRequest(request: VacationRequestDto): VacationRequest {
        return {
            backendId: request._id,
            id: request.folio,
            employee: request.employeeName,
            department: request.department,
            manager: request.managerName || '',
            startDate: request.startDate,
            endDate: request.endDate,
            days: request.days,
            paidDays: request.paidDays,
            unpaidDays: request.unpaidDays,
            comments: request.comments || '',
            managerComment: request.managerComment || '',
            status: request.status === 'Cancelada' ? 'Rechazada' : request.status,
            updatedAt: request.updatedAt,
            history: request.history || []
        };
    }

    private findBalance(request: VacationRequest) {
        return this.balances.find((balance) => {
            if (balance.employeeName !== request.employee) return false;
            if (!balance.periodStartDate || !balance.periodEndDate) return false;

            return request.startDate >= balance.periodStartDate && request.startDate <= balance.periodEndDate;
        }) || this.balances.find((balance) => balance.employeeName === request.employee && balance.year === Number(request.startDate.slice(0, 4)));
    }

    private formatDate(value: string) {
        const date = new Date(`${value}T00:00:00`);
        return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
    }

    private getErrorMessage(error: unknown) {
        const httpError = error as { status?: number; error?: { message?: string; msg?: string } };

        if (error instanceof Error && error.name === 'TimeoutError') {
            return 'La consulta de solicitudes tardó demasiado. Verifica el backend y vuelve a intentarlo.';
        }

        if (httpError?.status === 401) return 'Tu sesión expiró. Inicia sesión y vuelve a intentarlo.';
        if (httpError?.status === 403) return 'No tienes permiso para consultar estas solicitudes.';

        return httpError?.error?.message || httpError?.error?.msg || 'Revisa que el backend este encendido en http://localhost:8080.';
    }
}
