import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';

@Component({
    selector: 'app-response-templates',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, TextareaModule, TagModule],
    template: `
        <section class="grid grid-cols-12 gap-4">
            <div class="col-span-12 lg:col-span-5 p-5 bg-surface-0 dark:bg-surface-900 border border-surface rounded-lg">
                <h1 class="text-2xl font-semibold m-0">Plantillas de respuesta</h1>
                <p class="text-muted-color mt-2 mb-5">Mensajes reutilizables para aprobar, rechazar o solicitar cambios.</p>

                <div class="flex flex-col gap-3">
                    @for (template of templates; track template.name) {
                        <button type="button" class="text-left p-4 rounded-lg border border-surface bg-surface-50 dark:bg-surface-800 hover:bg-emphasis transition-colors">
                            <div class="flex items-center justify-between gap-3">
                                <span class="font-semibold">{{ template.name }}</span>
                                <p-tag [value]="template.type" [severity]="template.severity" />
                            </div>
                            <p class="text-sm text-muted-color mb-0 mt-2">{{ template.preview }}</p>
                        </button>
                    }
                </div>
            </div>

            <div class="col-span-12 lg:col-span-7 p-5 bg-surface-0 dark:bg-surface-900 border border-surface rounded-lg">
                <h2 class="text-xl font-semibold m-0 mb-4">Editar plantilla</h2>
                <label class="block font-medium mb-2" for="templateName">Nombre</label>
                <input id="templateName" pInputText class="w-full mb-4" [(ngModel)]="draft.name" />

                <label class="block font-medium mb-2" for="templateBody">Mensaje</label>
                <textarea id="templateBody" pTextarea rows="9" class="w-full" [(ngModel)]="draft.body"></textarea>

                <div class="flex justify-end gap-3 mt-5">
                    <p-button label="Vista previa" icon="pi pi-eye" severity="secondary" outlined />
                    <p-button label="Guardar plantilla" icon="pi pi-save" />
                </div>
            </div>
        </section>
    `
})
export class ResponseTemplates {
    templates = [
        { name: 'Aprobacion de vacaciones', type: 'Aprobada', severity: 'success' as const, preview: 'Tu solicitud fue aprobada para el periodo seleccionado.' },
        { name: 'Solicitud de cambios', type: 'Cambios', severity: 'warn' as const, preview: 'Necesitamos ajustar las fechas antes de autorizar.' },
        { name: 'Rechazo por saldo', type: 'Rechazada', severity: 'danger' as const, preview: 'La solicitud supera los dias disponibles registrados.' }
    ];

    draft = {
        name: 'Aprobacion de vacaciones',
        body: 'Hola {empleado}, tu solicitud de vacaciones del {inicio} al {fin} fue aprobada por {responsable}. Tu nuevo saldo disponible es de {saldo} dias.'
    };
}
