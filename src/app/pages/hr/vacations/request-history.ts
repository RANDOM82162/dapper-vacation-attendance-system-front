import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { VacationRequest, VacationWorkflowService } from './vacation-workflow.service';
import { VacationRequestDto, VacationRequestsApiService } from './vacation-requests-api.service';
import { VacationBalanceDto, VacationBalancesApiService } from './vacation-balances-api.service';
import { VacationHistoryTimeline } from './vacation-history-timeline';

@Component({
    selector: 'app-request-history',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, DialogModule, TableModule, TagModule, TextareaModule, VacationHistoryTimeline],
    template: `
        <section class="p-5 bg-surface-0 dark:bg-surface-900 border border-surface rounded-lg">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
                <div>
                    <h1 class="text-2xl font-semibold m-0">Historial de solicitudes</h1>
                    <p class="text-muted-color mt-2 mb-0">Consulta general de solicitudes registradas.</p>
                </div>
                <p-tag [value]="requests.length + ' solicitudes'" severity="info" />
            </div>

            @if (errorMessage) {
                <div class="mb-4 p-4 rounded-lg border border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
                    {{ errorMessage }}
                </div>
            }

            <p-table [value]="requests" [loading]="loading" [tableStyle]="{ 'min-width': '82rem' }">
                <ng-template #header>
                    <tr>
                        <th>Folio</th>
                        <th>Empleado</th>
                        <th>Area</th>
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
                        <td>{{ request.employee }}</td>
                        <td>{{ request.department }}</td>
                        <td>{{ workflow.formatPeriod(request) }}</td>
                        <td>
                            <span class="block">{{ request.days }} total</span>
                            <small class="text-muted-color">{{ paidDays(request) }} con goce · {{ unpaidDays(request) }} sin goce</small>
                        </td>
                        <td><p-tag [value]="request.status" [severity]="workflow.getSeverity(request.status)" /></td>
                        <td>{{ request.updatedAt }}</td>
                        <td>
                            <div class="flex items-center gap-2">
                                <p-button icon="pi pi-eye" [rounded]="true" [outlined]="true" severity="secondary" (onClick)="openDetail(request)" />
                                <p-button icon="pi pi-pencil" [rounded]="true" [outlined]="true" severity="secondary" (onClick)="openReview(request)" />
                            </div>
                        </td>
                    </tr>
                </ng-template>
                <ng-template #emptymessage>
                    <tr>
                        <td colspan="8" class="text-center py-6 text-muted-color">No hay solicitudes registradas.</td>
                    </tr>
                </ng-template>
            </p-table>

            <p-dialog [(visible)]="detailDialog" [modal]="true" [draggable]="false" [dismissableMask]="true" [style]="{ width: 'min(960px, 92vw)' }" [breakpoints]="{ '768px': '96vw' }" [header]="selectedRequest?.id || 'Detalle de solicitud'">
                @if (selectedRequest) {
                    <div class="flex flex-col gap-4">
                        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div>
                                <h2 class="text-xl font-semibold mt-0 mb-1">{{ selectedRequest.id }}</h2>
                                <p class="text-muted-color m-0">{{ selectedRequest.employee }}</p>
                            </div>
                            <p-tag [value]="selectedRequest.status" [severity]="workflow.getSeverity(selectedRequest.status)" />
                        </div>

                        <div class="grid grid-cols-12 gap-3">
                            <div class="col-span-12 md:col-span-3 p-3 rounded-lg border border-surface">
                                <span class="block text-sm text-muted-color">Area</span>
                                <span class="font-semibold">{{ selectedRequest.department }}</span>
                            </div>
                            <div class="col-span-12 md:col-span-3 p-3 rounded-lg border border-surface">
                                <span class="block text-sm text-muted-color">Periodo</span>
                                <span class="font-semibold">{{ workflow.formatPeriod(selectedRequest) }}</span>
                            </div>
                            <div class="col-span-12 md:col-span-3 p-3 rounded-lg border border-surface">
                                <span class="block text-sm text-muted-color">Días solicitados</span>
                                <span class="font-semibold">{{ selectedRequest.days }}</span>
                            </div>
                            <div class="col-span-12 md:col-span-3 p-3 rounded-lg border border-surface">
                                <span class="block text-sm text-muted-color">Con goce</span>
                                <span class="font-semibold">{{ paidDays(selectedRequest) }}</span>
                            </div>
                            <div class="col-span-12 md:col-span-3 p-3 rounded-lg border border-surface">
                                <span class="block text-sm text-muted-color">Sin goce</span>
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
                                <div class="p-3 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface">{{ selectedRequest.managerComment }}</div>
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
                    @if (selectedRequest) {
                        <p-button label="Revisar" icon="pi pi-pencil" severity="secondary" outlined (onClick)="openReview(selectedRequest)" />
                    }
                </ng-template>
            </p-dialog>

            <p-dialog [(visible)]="reviewDialog" [modal]="true" [draggable]="false" [dismissableMask]="true" [style]="{ width: 'min(620px, 92vw)' }" [breakpoints]="{ '768px': '96vw' }" [header]="reviewingRequest?.id || 'Revisar solicitud'">
                @if (reviewingRequest) {
                    <div class="flex flex-col gap-4">
                        <div class="flex items-center justify-between gap-3">
                            <div>
                                <span class="block text-sm text-muted-color">Empleado</span>
                                <span class="font-semibold">{{ reviewingRequest.employee }}</span>
                            </div>
                            <p-tag [value]="reviewingRequest.status" [severity]="workflow.getSeverity(reviewingRequest.status)" />
                        </div>

                        <div class="grid grid-cols-12 gap-3">
                            <div class="col-span-12 md:col-span-6 p-3 rounded-lg border border-surface">
                                <span class="block text-sm text-muted-color">Periodo</span>
                                <span class="font-semibold">{{ workflow.formatPeriod(reviewingRequest) }}</span>
                            </div>
                            <div class="col-span-12 md:col-span-6 p-3 rounded-lg border border-surface">
                                <span class="block text-sm text-muted-color">Días solicitados</span>
                                <span class="font-semibold">{{ reviewingRequest.days }}</span>
                            </div>
                            <div class="col-span-12 md:col-span-6 p-3 rounded-lg border border-surface">
                                <span class="block text-sm text-muted-color">Con goce</span>
                                <span class="font-semibold">{{ paidDays(reviewingRequest) }}</span>
                            </div>
                            <div class="col-span-12 md:col-span-6 p-3 rounded-lg border border-surface">
                                <span class="block text-sm text-muted-color">Sin goce</span>
                                <span class="font-semibold">{{ unpaidDays(reviewingRequest) }}</span>
                            </div>
                        </div>

                        @if (unpaidDays(reviewingRequest) > 0) {
                            <div class="p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-200">
                                La solicitud incluye días sin goce de sueldo por exceder el saldo disponible.
                            </div>
                        }

                        <div>
                            <span class="block text-sm text-muted-color mb-2">Comentario del empleado</span>
                            <div class="p-3 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface">{{ reviewingRequest.comments || 'Sin comentarios.' }}</div>
                        </div>

                        <div>
                            <label class="block font-medium mb-2" for="reviewComment">Comentario del jefe/director</label>
                            <textarea id="reviewComment" pTextarea rows="5" maxlength="2000" class="w-full" [(ngModel)]="reviewComment"></textarea>
                        </div>

                        @if (reviewSuccessMessage) {
                            <div class="p-3 rounded-lg border border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-200">
                                {{ reviewSuccessMessage }}
                            </div>
                        }

                        @if (reviewErrorMessage) {
                            <div class="p-4 rounded-lg border border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
                                {{ reviewErrorMessage }}
                            </div>
                        }
                    </div>
                }
                <ng-template #footer>
                    <p-button label="Cancelar" icon="pi pi-times" severity="secondary" text (onClick)="closeReview()" />
                    <p-button label="Guardar comentario" icon="pi pi-save" severity="secondary" outlined [loading]="savingAction === 'save-comment'" [disabled]="!canSaveComment()" (onClick)="saveReviewComment()" />
                    <p-button label="Solicitar cambios" icon="pi pi-comment" severity="secondary" outlined [loading]="savingAction === 'changes'" [disabled]="!canRunAction('changes')" (onClick)="requestChanges()" />
                    <p-button label="Rechazar" icon="pi pi-times" severity="danger" outlined [loading]="savingAction === 'reject'" [disabled]="!canRunAction('reject')" (onClick)="reject()" />
                    <p-button label="Aprobar" icon="pi pi-check" severity="success" [loading]="savingAction === 'approve'" [disabled]="!canRunAction('approve')" (onClick)="approve()" />
                </ng-template>
            </p-dialog>
        </section>
    `
})
export class RequestHistory implements OnInit {
    readonly workflow = inject(VacationWorkflowService);
    private readonly vacationRequestsApi = inject(VacationRequestsApiService);
    private readonly vacationBalancesApi = inject(VacationBalancesApiService);
    private readonly cdr = inject(ChangeDetectorRef);

    requests: VacationRequest[] = [];

    balances: VacationBalanceDto[] = [];

    loading = false;

    errorMessage = '';

    detailDialog = false;

    selectedRequest: VacationRequest | null = null;

    reviewDialog = false;

    reviewingRequest: VacationRequest | null = null;

    savingAction: 'approve' | 'reject' | 'changes' | 'save-comment' | '' = '';

    reviewErrorMessage = '';

    reviewSuccessMessage = '';

    reviewComment = '';

    ngOnInit() {
        this.loadRequests();
    }

    loadRequests() {
        this.loading = true;
        this.errorMessage = '';

        forkJoin({
            requests: this.vacationRequestsApi.getRequests({ page: 1, limit: 500 }),
            balances: this.vacationBalancesApi.getBalances({ page: 1, limit: 500 })
        })
            .pipe(
                finalize(() => {
                    this.loading = false;
                    this.cdr.detectChanges();
                })
            )
            .subscribe({
                next: (response) => {
                    this.requests = response.requests.data.data.map((request) => this.mapRequest(request));
                    this.balances = response.balances.data.data;
                    if (this.reviewingRequest?.backendId) {
                        this.reviewingRequest = this.requests.find((request) => request.backendId === this.reviewingRequest?.backendId) || this.reviewingRequest;
                    }
                    if (this.selectedRequest?.backendId) {
                        this.selectedRequest = this.requests.find((request) => request.backendId === this.selectedRequest?.backendId) || this.selectedRequest;
                    }
                    this.cdr.detectChanges();
                },
                error: (error: unknown) => {
                    this.errorMessage = this.getErrorMessage(error);
                    this.requests = [];
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

    openReview(request: VacationRequest) {
        this.reviewingRequest = request;
        this.reviewComment = request.managerComment || '';
        this.reviewErrorMessage = '';
        this.reviewSuccessMessage = '';
        this.reviewDialog = true;
    }

    closeReview() {
        if (this.savingAction) return;

        this.reviewDialog = false;
        this.reviewingRequest = null;
        this.reviewComment = '';
        this.reviewErrorMessage = '';
        this.reviewSuccessMessage = '';
    }

    canSaveComment() {
        return Boolean(
            this.reviewingRequest?.backendId &&
            !this.savingAction &&
            this.reviewComment.length <= 2000 &&
            this.reviewComment.trim() !== (this.reviewingRequest.managerComment || '')
        );
    }

    saveReviewComment() {
        if (!this.canSaveComment() || !this.reviewingRequest?.backendId) return;

        const requestId = this.reviewingRequest.backendId;
        const managerComment = this.reviewComment.trim();
        this.savingAction = 'save-comment';
        this.reviewErrorMessage = '';
        this.reviewSuccessMessage = '';

        this.vacationRequestsApi.updateRequest(requestId, { managerComment })
            .pipe(finalize(() => {
                this.savingAction = '';
                this.cdr.detectChanges();
            }))
            .subscribe({
                next: () => {
                    const updatedRequest = { ...this.reviewingRequest!, managerComment };
                    this.reviewingRequest = updatedRequest;
                    this.requests = this.requests.map((request) => request.backendId === requestId ? updatedRequest : request);
                    if (this.selectedRequest?.backendId === requestId) this.selectedRequest = updatedRequest;
                    this.reviewComment = managerComment;
                    this.reviewSuccessMessage = 'Comentario del jefe/director guardado.';
                    this.loadRequests();
                    this.cdr.detectChanges();
                },
                error: (error: unknown) => {
                    this.reviewErrorMessage = this.getErrorMessage(error);
                    this.cdr.detectChanges();
                }
            });
    }

    approve() {
        if (!this.reviewingRequest?.backendId) return;
        this.runStatusAction('approve', () => this.vacationRequestsApi.approveRequest(this.reviewingRequest!.backendId!, this.reviewComment));
    }

    reject() {
        if (!this.reviewingRequest?.backendId) return;
        this.runStatusAction('reject', () => this.vacationRequestsApi.rejectRequest(this.reviewingRequest!.backendId!, this.reviewComment));
    }

    requestChanges() {
        if (!this.reviewingRequest?.backendId) return;
        this.runStatusAction('changes', () => this.vacationRequestsApi.requestChanges(this.reviewingRequest!.backendId!, this.reviewComment));
    }

    canRunAction(action: 'approve' | 'reject' | 'changes') {
        if (!this.reviewingRequest?.backendId || this.savingAction) return false;

        const statusByAction = {
            approve: 'Aprobada',
            reject: 'Rechazada',
            changes: 'Cambios solicitados'
        };

        return this.reviewingRequest.status !== statusByAction[action];
    }

    paidDays(request: VacationRequest) {
        if (request.status === 'Aprobada') return request.paidDays ?? request.days;

        const balance = this.findBalance(request);
        return Math.min(Math.max(balance?.availableDays ?? 0, 0), request.days);
    }

    unpaidDays(request: VacationRequest) {
        if (request.status === 'Aprobada') return request.unpaidDays ?? 0;

        return Math.max(request.days - this.paidDays(request), 0);
    }

    private runStatusAction(
        action: 'approve' | 'reject' | 'changes',
        request: () => ReturnType<VacationRequestsApiService['approveRequest']>
    ) {
        this.savingAction = action;
        this.reviewErrorMessage = '';

        request()
            .pipe(
                finalize(() => {
                    this.savingAction = '';
                    this.cdr.detectChanges();
                })
            )
            .subscribe({
                next: () => {
                    this.savingAction = '';
                    this.closeReview();
                    this.closeDetail();
                    this.loadRequests();
                },
                error: (error: unknown) => {
                    this.reviewErrorMessage = this.getErrorMessage(error);
                    this.cdr.detectChanges();
                }
            });
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
            paidDays: request.paidDays ?? request.days,
            unpaidDays: request.unpaidDays ?? 0,
            comments: request.comments || '',
            managerComment: request.managerComment || '',
            status: request.status,
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

    private getErrorMessage(error: unknown) {
        const httpError = error as { status?: number; error?: { message?: string; msg?: string } };
        return httpError?.error?.message || httpError?.error?.msg || 'No se pudo cargar el historial. Revisa que el backend este encendido.';
    }
}
