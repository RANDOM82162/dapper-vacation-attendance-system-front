import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { VacationRequest, VacationWorkflowService } from './vacation-workflow.service';

@Component({
    selector: 'app-request-history',
    standalone: true,
    imports: [CommonModule, ButtonModule, DialogModule, TableModule, TagModule],
    template: `
        <section class="p-5 bg-surface-0 dark:bg-surface-900 border border-surface rounded-lg">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
                <div>
                    <h1 class="text-2xl font-semibold m-0">Historial de solicitudes</h1>
                    <p class="text-muted-color mt-2 mb-0">Consulta general de solicitudes registradas.</p>
                </div>
                <p-tag [value]="workflow.requests().length + ' solicitudes'" severity="info" />
            </div>

            <p-table [value]="workflow.requests()" [tableStyle]="{ 'min-width': '82rem' }">
                <ng-template #header>
                    <tr>
                        <th>Folio</th>
                        <th>Empleado</th>
                        <th>Area</th>
                        <th>Periodo</th>
                        <th>Dias</th>
                        <th>Responsable</th>
                        <th>Estado</th>
                        <th>Ultimo movimiento</th>
                        <th>Detalle</th>
                    </tr>
                </ng-template>
                <ng-template #body let-request>
                    <tr>
                        <td>{{ request.id }}</td>
                        <td>{{ request.employee }}</td>
                        <td>{{ request.department }}</td>
                        <td>{{ workflow.formatPeriod(request) }}</td>
                        <td>{{ request.days }}</td>
                        <td>{{ request.manager }}</td>
                        <td><p-tag [value]="request.status" [severity]="workflow.getSeverity(request.status)" /></td>
                        <td>{{ request.updatedAt }}</td>
                        <td><p-button icon="pi pi-eye" [rounded]="true" [outlined]="true" severity="secondary" (onClick)="openDetail(request)" /></td>
                    </tr>
                </ng-template>
                <ng-template #emptymessage>
                    <tr>
                        <td colspan="9" class="text-center py-6 text-muted-color">No hay solicitudes registradas.</td>
                    </tr>
                </ng-template>
            </p-table>

            <p-dialog [(visible)]="detailDialog" [modal]="true" [dismissableMask]="true" [style]="{ width: 'min(960px, 92vw)' }" [breakpoints]="{ '768px': '96vw' }" [header]="selectedRequest?.id || 'Detalle de solicitud'">
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
                                <span class="block text-sm text-muted-color">Dias</span>
                                <span class="font-semibold">{{ selectedRequest.days }}</span>
                            </div>
                            <div class="col-span-12 md:col-span-3 p-3 rounded-lg border border-surface">
                                <span class="block text-sm text-muted-color">Responsable</span>
                                <span class="font-semibold">{{ selectedRequest.manager }}</span>
                            </div>
                        </div>

                        <div>
                            <span class="block text-sm text-muted-color mb-2">Comentarios</span>
                            <div class="p-3 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface">{{ selectedRequest.comments }}</div>
                        </div>

                        <div>
                            <span class="block font-medium mb-2">Historial completo</span>
                            <ul class="m-0 pl-5 text-sm text-muted-color leading-7">
                                @for (item of selectedRequest.history; track item) {
                                    <li>{{ item }}</li>
                                }
                            </ul>
                        </div>
                    </div>
                }
                <ng-template #footer>
                    <p-button label="Cerrar" icon="pi pi-times" severity="secondary" text (onClick)="closeDetail()" />
                </ng-template>
            </p-dialog>
        </section>
    `
})
export class RequestHistory {
    readonly workflow = inject(VacationWorkflowService);

    detailDialog = false;

    selectedRequest: VacationRequest | null = null;

    openDetail(request: VacationRequest) {
        this.selectedRequest = request;
        this.detailDialog = true;
    }

    closeDetail() {
        this.detailDialog = false;
        this.selectedRequest = null;
    }
}
