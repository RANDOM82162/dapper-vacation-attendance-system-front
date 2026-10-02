import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EMPTY, expand, finalize, forkJoin, map, reduce } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { TagSeverity, VacationRequest, VacationStatus, VacationWorkflowService } from './vacation-workflow.service';
import { VacationRequestDto, VacationRequestsApiService } from './vacation-requests-api.service';
import { VacationBalanceDto, VacationBalancesApiService } from './vacation-balances-api.service';
import { ToastService } from '@/app/services/toast.service';
import { VacationHistoryTimeline } from './vacation-history-timeline';

interface ApprovalRequest extends VacationRequest {
    backendId: string;
}

@Component({
    selector: 'app-vacation-approvals',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, DialogModule, TableModule, TagModule, TextareaModule, VacationHistoryTimeline],
    template: `
        <section class="p-5 bg-surface-0 dark:bg-surface-900 border border-surface rounded-lg">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
                <div>
                    <h1 class="text-2xl font-semibold m-0">Solicitudes por aprobar</h1>
                    <p class="text-muted-color mt-2 mb-0">Vista para jefes, directores y administradores.</p>
                </div>
                <p-tag [value]="requests.length + ' pendientes'" severity="warn" />
            </div>

            @if (errorMessage) {
                <div class="mb-4 p-4 rounded-lg border border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
                    {{ errorMessage }}
                </div>
            }

            <p-table [value]="requests" [loading]="loading" [tableStyle]="{ 'min-width': '78rem' }">
                <ng-template #header>
                    <tr>
                        <th>Folio</th>
                        <th>Empleado</th>
                        <th>Área</th>
                        <th>Periodo</th>
                        <th>Desglose de días</th>
                        <th>Saldo</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </ng-template>
                <ng-template #body let-request>
                    <tr>
                        <td>{{ request.id }}</td>
                        <td>{{ request.employee }}</td>
                        <td>{{ request.department }}</td>
                        <td>{{ formatPeriod(request) }}</td>
                        <td>{{ paidDays(request) }} con goce · {{ unpaidDays(request) }} sin goce</td>
                        <td><p-tag [value]="balanceLabel(request)" [severity]="balanceSeverity(request)" /></td>
                        <td><p-tag [value]="request.status" [severity]="getSeverity(request.status)" /></td>
                        <td>
                            <div class="flex gap-2">
                                <p-button icon="pi pi-eye" severity="secondary" [rounded]="true" [outlined]="true" (onClick)="openReview(request)" />
                                <p-button icon="pi pi-check" severity="success" [rounded]="true" [outlined]="true" [disabled]="!canApprove(request)" (onClick)="openReview(request, 'approve')" />
                                <p-button icon="pi pi-times" severity="danger" [rounded]="true" [outlined]="true" (onClick)="openReview(request, 'reject')" />
                                <p-button icon="pi pi-comment" severity="secondary" [rounded]="true" [outlined]="true" (onClick)="openReview(request, 'changes')" />
                            </div>
                        </td>
                    </tr>
                </ng-template>
                <ng-template #emptymessage>
                    <tr>
                        <td colspan="8" class="text-center py-6 text-muted-color">No hay solicitudes pendientes por revisar.</td>
                    </tr>
                </ng-template>
            </p-table>

            <p-dialog [(visible)]="reviewDialog" [modal]="true" [draggable]="false" [style]="{ width: '560px' }" [header]="selectedRequest?.id || 'Revisión de solicitud'">
                @if (selectedRequest) {
                    <div class="flex flex-col gap-4">
                        <div class="grid grid-cols-12 gap-3">
                            <div class="col-span-12 md:col-span-6">
                                <span class="block text-sm text-muted-color">Empleado</span>
                                <span class="font-semibold">{{ selectedRequest.employee }}</span>
                            </div>
                            <div class="col-span-12 md:col-span-6">
                                <span class="block text-sm text-muted-color">Periodo</span>
                                <span class="font-semibold">{{ formatPeriod(selectedRequest) }}</span>
                            </div>
                            <div class="col-span-12 md:col-span-6">
                                <span class="block text-sm text-muted-color">Días solicitados</span>
                                <span class="font-semibold">{{ selectedRequest.days }}</span>
                            </div>
                            <div class="col-span-12 md:col-span-6">
                                <span class="block text-sm text-muted-color">Días con goce</span>
                                <span class="font-semibold">{{ paidDays(selectedRequest) }}</span>
                            </div>
                            <div class="col-span-12 md:col-span-6">
                                <span class="block text-sm text-muted-color">Días sin goce</span>
                                <span class="font-semibold">{{ unpaidDays(selectedRequest) }}</span>
                            </div>
                            <div class="col-span-12 md:col-span-6">
                                <span class="block text-sm text-muted-color">Saldo disponible</span>
                                <p-tag [value]="balanceLabel(selectedRequest)" [severity]="balanceSeverity(selectedRequest)" />
                            </div>
                        </div>

                        @if (unpaidDays(selectedRequest) > 0) {
                            <div class="p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-200">
                                Al aprobar, {{ unpaidDays(selectedRequest) }} día(s) quedarán sin goce de sueldo y solo se descontarán {{ paidDays(selectedRequest) }} del saldo disponible.
                            </div>
                        }

                        <div>
                            <span class="block text-sm text-muted-color mb-2">Comentario del empleado</span>
                            <div class="p-3 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface">{{ selectedRequest.comments }}</div>
                        </div>

                        <div>
                            <label class="block font-medium mb-2" for="reviewComment">Comentario de revisión</label>
                            <textarea id="reviewComment" pTextarea rows="4" maxlength="2000" class="w-full" [(ngModel)]="reviewComment"></textarea>
                        </div>

                        <div>
                            <span class="block font-medium mb-2">Historial</span>
                            <app-vacation-history-timeline [entries]="selectedRequest.history" />
                        </div>
                    </div>
                }

                <ng-template #footer>
                    <p-button label="Cerrar" icon="pi pi-times" text severity="secondary" (onClick)="closeReview()" />
                    <p-button label="Solicitar cambios" icon="pi pi-comment" severity="secondary" outlined [loading]="savingAction === 'changes'" (onClick)="requestChanges()" />
                    <p-button label="Rechazar" icon="pi pi-times" severity="danger" outlined [loading]="savingAction === 'reject'" (onClick)="reject()" />
                    <p-button label="Aprobar" icon="pi pi-check" severity="success" [loading]="savingAction === 'approve'" [disabled]="!selectedRequest || !canApprove(selectedRequest)" (onClick)="approve()" />
                </ng-template>
            </p-dialog>
        </section>
    `
})
export class VacationApprovals implements OnInit {
    readonly workflow = inject(VacationWorkflowService);
    private readonly vacationRequestsApi = inject(VacationRequestsApiService);
    private readonly vacationBalancesApi = inject(VacationBalancesApiService);
    private readonly toast = inject(ToastService);
    private readonly cdr = inject(ChangeDetectorRef);

    requests: ApprovalRequest[] = [];

    balances: VacationBalanceDto[] = [];

    loading = false;

    errorMessage = '';

    savingAction: 'approve' | 'reject' | 'changes' | '' = '';

    reviewDialog = false;

    selectedRequest: ApprovalRequest | null = null;

    reviewComment = '';

    ngOnInit() {
        this.loadRequests();
    }

    loadRequests() {
        this.loading = true;
        this.errorMessage = '';

        forkJoin({
            requests: this.loadAllRequestPages(),
            balances: this.loadAllBalancePages()
        })
            .pipe(
                finalize(() => {
                    this.loading = false;
                    this.cdr.detectChanges();
                })
            )
            .subscribe({
                next: (response) => {
                    this.balances = response.balances;
                    this.requests = response.requests
                        .filter((request) => request.status === 'Pendiente' || request.status === 'Cambios solicitados')
                        .map((request) => this.mapRequest(request));
                    this.cdr.detectChanges();
                },
                error: (error: unknown) => {
                    this.errorMessage = this.getErrorMessage(error);
                    this.requests = [];
                    this.cdr.detectChanges();
                }
            });
    }

    private loadAllRequestPages() {
        return forkJoin([
            this.loadAllRequestPagesForStatus('Pendiente'),
            this.loadAllRequestPagesForStatus('Cambios solicitados')
        ]).pipe(map(([pendingRequests, changeRequests]) => [...pendingRequests, ...changeRequests]));
    }

    private loadAllRequestPagesForStatus(status: VacationStatus) {
        const limit = 100;
        return this.vacationRequestsApi.getRequests({ page: 1, limit, status }).pipe(
            expand((page) => {
                const nextPage = page.data.meta.currentPage + 1;
                return nextPage <= page.data.meta.totalPages
                    ? this.vacationRequestsApi.getRequests({ page: nextPage, limit, status })
                    : EMPTY;
            }),
            reduce((requests, page) => [...requests, ...page.data.data], [] as VacationRequestDto[])
        );
    }

    private loadAllBalancePages() {
        const limit = 100;
        return this.vacationBalancesApi.getBalances({ page: 1, limit }).pipe(
            expand((page) => {
                const nextPage = page.data.meta.currentPage + 1;
                return nextPage <= page.data.meta.totalPages
                    ? this.vacationBalancesApi.getBalances({ page: nextPage, limit })
                    : EMPTY;
            }),
            reduce((balances, page) => [...balances, ...page.data.data], [] as VacationBalanceDto[])
        );
    }

    openReview(request: ApprovalRequest, action?: 'approve' | 'reject' | 'changes') {
        this.selectedRequest = request;
        this.reviewComment = request.managerComment || '';
        this.reviewDialog = true;

        if (action === 'approve' && !this.reviewComment) {
            this.reviewComment = 'Aprobada según disponibilidad del equipo.';
        }

        if (action === 'reject' && !this.reviewComment) {
            this.reviewComment = 'No es posible autorizar en las fechas solicitadas.';
        }

        if (action === 'changes' && !this.reviewComment) {
            this.reviewComment = 'Favor de proponer fechas alternativas.';
        }
    }

    approve() {
        if (!this.selectedRequest) return;
        this.runAction('approve', () => this.vacationRequestsApi.approveRequest(this.selectedRequest!.backendId, this.reviewComment), 'Solicitud aprobada');
    }

    reject() {
        if (!this.selectedRequest) return;
        this.runAction('reject', () => this.vacationRequestsApi.rejectRequest(this.selectedRequest!.backendId, this.reviewComment), 'Solicitud rechazada');
    }

    requestChanges() {
        if (!this.selectedRequest) return;
        this.runAction('changes', () => this.vacationRequestsApi.requestChanges(this.selectedRequest!.backendId, this.reviewComment), 'Cambios solicitados');
    }

    closeReview() {
        this.reviewDialog = false;
        this.selectedRequest = null;
        this.reviewComment = '';
    }

    formatPeriod(request: VacationRequest) {
        const start = this.formatDate(request.startDate);
        const end = this.formatDate(request.endDate);
        return `${start} - ${end}`;
    }

    getSeverity(status: VacationRequest['status']): TagSeverity {
        return this.workflow.getSeverity(status);
    }

    canApprove(request: ApprovalRequest) {
        return request.days > 0;
    }

    paidDays(request: ApprovalRequest) {
        return Math.min(Math.max(this.findBalance(request)?.availableDays ?? 0, 0), request.days);
    }

    unpaidDays(request: ApprovalRequest) {
        return Math.max(request.days - this.paidDays(request), 0);
    }

    balanceLabel(request: ApprovalRequest) {
        const balance = this.findBalance(request);
        return balance ? `${balance.availableDays} disponibles` : 'Sin saldo';
    }

    balanceSeverity(request: ApprovalRequest) {
        return this.unpaidDays(request) > 0 ? 'warn' : 'success';
    }

    private runAction(
        action: 'approve' | 'reject' | 'changes',
        request: () => ReturnType<VacationRequestsApiService['approveRequest']>,
        successMessage: string
    ) {
        this.savingAction = action;

        request()
            .pipe(
                finalize(() => {
                    this.savingAction = '';
                    this.cdr.detectChanges();
                })
            )
            .subscribe({
                next: () => {
                    this.toast.showSuccess(successMessage);
                    this.closeReview();
                    this.loadRequests();
                },
                error: (error: unknown) => {
                    this.toast.showError('No se pudo actualizar', this.getErrorMessage(error));
                }
            });
    }

    private mapRequest(request: VacationRequestDto): ApprovalRequest {
        return {
            backendId: request._id || '',
            id: request.folio,
            employee: request.employeeName,
            department: request.department,
            manager: request.managerName,
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

    private findBalance(request: ApprovalRequest) {
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
        return httpError?.error?.message || httpError?.error?.msg || 'Revisa que el backend este encendido en http://localhost:8080.';
    }
}
