import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { VacationWorkflowService } from './vacation-workflow.service';

@Component({
    selector: 'app-vacation-balance',
    standalone: true,
    imports: [CommonModule, TableModule, TagModule],
    template: `
        <section class="p-5 bg-surface-0 dark:bg-surface-900 border border-surface rounded-lg">
            <h1 class="text-2xl font-semibold m-0">Dias disponibles</h1>
            <p class="text-muted-color mt-2 mb-5">Control centralizado de saldos y movimientos de vacaciones.</p>

            <p-table [value]="workflow.balances()" [tableStyle]="{ 'min-width': '65rem' }">
                <ng-template #header>
                    <tr>
                        <th>Empleado</th>
                        <th>Departamento</th>
                        <th>Saldo inicial</th>
                        <th>Usados</th>
                        <th>Disponibles</th>
                        <th>Ultimo movimiento</th>
                    </tr>
                </ng-template>
                <ng-template #body let-balance>
                    <tr>
                        <td>{{ balance.employee }}</td>
                        <td>{{ balance.department }}</td>
                        <td>{{ balance.initial }}</td>
                        <td>{{ balance.used }}</td>
                        <td><p-tag [value]="balance.available + ' dias'" [severity]="balance.available > 5 ? 'success' : 'warn'" /></td>
                        <td>{{ balance.lastMove }}</td>
                    </tr>
                </ng-template>
            </p-table>
        </section>
    `
})
export class VacationBalance {
    readonly workflow = inject(VacationWorkflowService);
}
