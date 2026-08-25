import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';
import { VacationWorkflowService } from './vacation-workflow.service';

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
                        <p class="text-muted-color mt-2 mb-0">Formulario inicial para validar el flujo del empleado.</p>
                    </div>
                    <p-tag value="Empleado" severity="success" />
                </div>

                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-12 md:col-span-6">
                        <label class="block font-medium mb-2" for="startDate">Fecha de inicio</label>
                        <input id="startDate" pInputText type="date" class="w-full" [(ngModel)]="request.startDate" />
                    </div>
                    <div class="col-span-12 md:col-span-6">
                        <label class="block font-medium mb-2" for="endDate">Fecha de regreso</label>
                        <input id="endDate" pInputText type="date" class="w-full" [(ngModel)]="request.endDate" />
                    </div>
                    <div class="col-span-12 md:col-span-6">
                        <label class="block font-medium mb-2" for="days">Dias solicitados</label>
                        <input id="days" pInputText type="number" class="w-full" [(ngModel)]="request.days" />
                    </div>
                    <div class="col-span-12 md:col-span-6">
                        <label class="block font-medium mb-2" for="manager">Responsable</label>
                        <input id="manager" pInputText class="w-full" [(ngModel)]="request.manager" />
                    </div>
                    <div class="col-span-12">
                        <label class="block font-medium mb-2" for="comments">Comentarios</label>
                        <textarea id="comments" pTextarea rows="5" class="w-full" [(ngModel)]="request.comments"></textarea>
                    </div>
                </div>

                <div class="flex flex-wrap justify-end gap-3 mt-6">
                    <p-button label="Guardar borrador" icon="pi pi-save" severity="secondary" outlined (onClick)="saveDraft()" />
                    <p-button label="Enviar solicitud" icon="pi pi-send" [disabled]="!canSubmit()" (onClick)="submitRequest()" />
                </div>
            </div>

            <aside class="col-span-12 xl:col-span-4 flex flex-col gap-4">
                <div class="p-5 bg-surface-0 dark:bg-surface-900 border border-surface rounded-lg">
                    <h2 class="text-lg font-semibold m-0 mb-4">Saldo actual</h2>
                    <div class="text-4xl font-semibold">{{ availableDays() }} dias</div>
                    <p class="text-muted-color mb-0 mt-2">Si esta solicitud se aprueba, quedarian {{ projectedBalance() }} dias disponibles.</p>
                </div>
                <div class="p-5 bg-surface-0 dark:bg-surface-900 border border-surface rounded-lg">
                    <h2 class="text-lg font-semibold m-0 mb-4">Validaciones previstas</h2>
                    <ul class="m-0 pl-5 text-muted-color leading-7">
                        <li>Fechas obligatorias y ordenadas.</li>
                        <li>Dias solicitados dentro del saldo.</li>
                        <li>Responsable asignado por departamento.</li>
                        <li>Historial desde el envio.</li>
                    </ul>
                </div>
            </aside>
        </section>
    `
})
export class NewVacationRequest {
    private workflow = inject(VacationWorkflowService);

    private router = inject(Router);

    request = {
        startDate: '2026-09-07',
        endDate: '2026-09-11',
        days: 5,
        manager: 'Mariana Torres',
        comments: 'Solicito estos dias para descanso programado.'
    };

    availableDays = computed(() => this.workflow.currentEmployeeBalance()?.available ?? 0);

    projectedBalance = computed(() => Math.max(this.availableDays() - Number(this.request.days || 0), 0));

    canSubmit() {
        return Boolean(this.request.startDate && this.request.endDate && this.request.manager && Number(this.request.days) > 0 && Number(this.request.days) <= this.availableDays());
    }

    submitRequest() {
        if (!this.canSubmit()) return;
        this.workflow.createRequest(this.request, 'Pendiente');
        this.router.navigate(['/vacaciones/mis-solicitudes']);
    }

    saveDraft() {
        this.workflow.createRequest(this.request, 'Borrador');
        this.router.navigate(['/vacaciones/mis-solicitudes']);
    }
}
