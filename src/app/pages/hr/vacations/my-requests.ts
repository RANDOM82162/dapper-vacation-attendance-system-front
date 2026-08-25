import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { VacationRequest, VacationWorkflowService } from './vacation-workflow.service';

@Component({
    selector: 'app-my-requests',
    standalone: true,
    imports: [CommonModule, ButtonModule, DialogModule, TableModule, TagModule],
    template: `
        <section class="p-5 bg-surface-0 dark:bg-surface-900 border border-surface rounded-lg">
            <h1 class="text-2xl font-semibold m-0">Mis solicitudes</h1>
            <p class="text-muted-color mt-2 mb-5">Seguimiento de solicitudes con estado, responsable e historial resumido.</p>

            <p-table [value]="workflow.myRequests()" [tableStyle]="{ 'min-width': '70rem' }">
                <ng-template #header>
                    <tr>
                        <th>Folio</th>
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
                        <td>{{ workflow.formatPeriod(request) }}</td>
                        <td>{{ request.days }}</td>
                        <td>{{ request.manager }}</td>
                        <td><p-tag [value]="request.status" [severity]="workflow.getSeverity(request.status)" /></td>
                        <td>{{ request.updatedAt }}</td>
                        <td><p-button icon="pi pi-eye" [rounded]="true" [outlined]="true" severity="secondary" (onClick)="openDetail(request)" /></td>
                    </tr>
                </ng-template>
            </p-table>

            <div class="grid grid-cols-12 gap-4 mt-5">
                @for (request of workflow.myRequests(); track request.id) {
                    <article class="col-span-12 lg:col-span-6 p-4 rounded-lg border border-surface bg-surface-50 dark:bg-surface-800">
                        <div class="flex items-center justify-between gap-3">
                            <span class="font-semibold">{{ request.id }}</span>
                            <p-tag [value]="request.status" [severity]="workflow.getSeverity(request.status)" />
                        </div>
                        <ul class="m-0 mt-3 pl-5 text-sm text-muted-color leading-7">
                            @for (item of request.history; track item) {
                                <li>{{ item }}</li>
                            }
                        </ul>
                    </article>
                }
            </div>

            <p-dialog [(visible)]="detailDialog" [modal]="true" [style]="{ width: '540px' }" [header]="selectedRequest?.id || 'Detalle de solicitud'">
                @if (selectedRequest) {
                    <div class="flex flex-col gap-4">
                        <div class="flex items-center justify-between gap-3">
                            <div>
                                <span class="block text-sm text-muted-color">Periodo</span>
                                <span class="font-semibold">{{ workflow.formatPeriod(selectedRequest) }}</span>
                            </div>
                            <p-tag [value]="selectedRequest.status" [severity]="workflow.getSeverity(selectedRequest.status)" />
                        </div>

                        <div class="grid grid-cols-12 gap-3">
                            <div class="col-span-6">
                                <span class="block text-sm text-muted-color">Dias</span>
                                <span class="font-semibold">{{ selectedRequest.days }}</span>
                            </div>
                            <div class="col-span-6">
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
export class MyRequests {
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
