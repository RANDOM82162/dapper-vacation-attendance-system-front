import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { VacationRequest, VacationWorkflowService } from './vacation-workflow.service';

@Component({
    selector: 'app-vacation-approvals',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, DialogModule, TableModule, TagModule, TextareaModule],
    template: `
        <section class="p-5 bg-surface-0 dark:bg-surface-900 border border-surface rounded-lg">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
                <div>
                    <h1 class="text-2xl font-semibold m-0">Solicitudes por aprobar</h1>
                    <p class="text-muted-color mt-2 mb-0">Vista para jefes, directores y administradores.</p>
                </div>
                <p-tag [value]="workflow.pendingApprovals().length + ' pendientes'" severity="warn" />
            </div>

            <p-table [value]="workflow.pendingApprovals()" [tableStyle]="{ 'min-width': '78rem' }">
                <ng-template #header>
                    <tr>
                        <th>Folio</th>
                        <th>Empleado</th>
                        <th>Area</th>
                        <th>Periodo</th>
                        <th>Dias</th>
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
                        <td>{{ workflow.formatPeriod(request) }}</td>
                        <td>{{ request.days }}</td>
                        <td><p-tag [value]="balanceLabel(request.employee)" [severity]="balanceSeverity(request.employee, request.days)" /></td>
                        <td><p-tag [value]="request.status" [severity]="workflow.getSeverity(request.status)" /></td>
                        <td>
                            <div class="flex gap-2">
                                <p-button icon="pi pi-eye" severity="secondary" [rounded]="true" [outlined]="true" (onClick)="openReview(request)" />
                                <p-button icon="pi pi-check" severity="success" [rounded]="true" [outlined]="true" [disabled]="!workflow.canApprove(request)" (onClick)="openReview(request, 'approve')" />
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

            <p-dialog [(visible)]="reviewDialog" [modal]="true" [style]="{ width: '560px' }" [header]="selectedRequest?.id || 'Revision de solicitud'">
                @if (selectedRequest) {
                    <div class="flex flex-col gap-4">
                        <div class="grid grid-cols-12 gap-3">
                            <div class="col-span-12 md:col-span-6">
                                <span class="block text-sm text-muted-color">Empleado</span>
                                <span class="font-semibold">{{ selectedRequest.employee }}</span>
                            </div>
                            <div class="col-span-12 md:col-span-6">
                                <span class="block text-sm text-muted-color">Periodo</span>
                                <span class="font-semibold">{{ workflow.formatPeriod(selectedRequest) }}</span>
                            </div>
                            <div class="col-span-12 md:col-span-6">
                                <span class="block text-sm text-muted-color">Dias solicitados</span>
                                <span class="font-semibold">{{ selectedRequest.days }}</span>
                            </div>
                            <div class="col-span-12 md:col-span-6">
                                <span class="block text-sm text-muted-color">Saldo</span>
                                <p-tag [value]="balanceLabel(selectedRequest.employee)" [severity]="balanceSeverity(selectedRequest.employee, selectedRequest.days)" />
                            </div>
                        </div>

                        <div>
                            <span class="block text-sm text-muted-color mb-2">Comentario del empleado</span>
                            <div class="p-3 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface">{{ selectedRequest.comments }}</div>
                        </div>

                        <div>
                            <label class="block font-medium mb-2" for="reviewComment">Comentario de revision</label>
                            <textarea id="reviewComment" pTextarea rows="4" class="w-full" [(ngModel)]="reviewComment"></textarea>
                        </div>

                        <div>
                            <span class="block font-medium mb-2">Historial</span>
                            <ul class="m-0 pl-5 text-sm text-muted-color leading-7">
                                @for (item of selectedRequest.history; track item) {
                                    <li>{{ item }}</li>
                                }
                            </ul>
                        </div>

                        @if (!workflow.canApprove(selectedRequest)) {
                            <div class="p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 dark:bg-red-950/30 dark:border-red-900 dark:text-red-300">
                                No se puede aprobar porque los dias solicitados superan el saldo disponible.
                            </div>
                        }
                    </div>
                }

                <ng-template #footer>
                    <p-button label="Cerrar" icon="pi pi-times" text severity="secondary" (onClick)="closeReview()" />
                    <p-button label="Solicitar cambios" icon="pi pi-comment" severity="secondary" outlined (onClick)="requestChanges()" />
                    <p-button label="Rechazar" icon="pi pi-times" severity="danger" outlined (onClick)="reject()" />
                    <p-button label="Aprobar" icon="pi pi-check" severity="success" [disabled]="!selectedRequest || !workflow.canApprove(selectedRequest)" (onClick)="approve()" />
                </ng-template>
            </p-dialog>
        </section>
    `
})
export class VacationApprovals {
    readonly workflow = inject(VacationWorkflowService);

    reviewDialog = false;

    selectedRequest: VacationRequest | null = null;

    reviewComment = '';

    balanceLabel(employee: string) {
        const balance = this.workflow.getBalance(employee);
        return balance ? `${balance.available} disponibles` : 'Sin saldo';
    }

    balanceSeverity(employee: string, days: number) {
        const balance = this.workflow.getBalance(employee);
        return balance && balance.available >= days ? 'success' : 'danger';
    }

    openReview(request: VacationRequest, action?: 'approve' | 'reject' | 'changes') {
        this.selectedRequest = request;
        this.reviewComment = '';
        this.reviewDialog = true;

        if (action === 'approve' && this.workflow.canApprove(request)) {
            this.reviewComment = 'Aprobada segun disponibilidad del equipo.';
        }

        if (action === 'reject') {
            this.reviewComment = 'No es posible autorizar en las fechas solicitadas.';
        }

        if (action === 'changes') {
            this.reviewComment = 'Favor de proponer fechas alternativas.';
        }
    }

    approve() {
        if (!this.selectedRequest) return;
        this.workflow.approveRequest(this.selectedRequest.id, this.reviewComment);
        this.closeReview();
    }

    reject() {
        if (!this.selectedRequest) return;
        this.workflow.rejectRequest(this.selectedRequest.id, this.reviewComment);
        this.closeReview();
    }

    requestChanges() {
        if (!this.selectedRequest) return;
        this.workflow.requestChanges(this.selectedRequest.id, this.reviewComment);
        this.closeReview();
    }

    closeReview() {
        this.reviewDialog = false;
        this.selectedRequest = null;
        this.reviewComment = '';
    }
}
