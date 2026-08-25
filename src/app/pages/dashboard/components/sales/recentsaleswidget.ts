import { Component, OnInit } from '@angular/core';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { LayoutService } from '@/app/layout/service/layout.service';

interface OrderWeek {
    name: string;
    code: string;
}

@Component({
    standalone: true,
    selector: 'recent-sales-widget',
    imports: [CommonModule, SelectModule, FormsModule, TableModule, ButtonModule],
    template: `<div class="card h-full">
        <div class="flex flex-wrap items-center justify-between mb-4 gap-4">
            <div class="font-semibold text-xl">Recent Sales</div>
            <p-select [options]="orderWeek" [(ngModel)]="selectedOrderWeek" optionLabel="name" styleClass="w-40"></p-select>
        </div>

        <p-table [rows]="5">
            <ng-template #header>
                <tr>
                    <th>Image</th>
                    <th pSortableColumn="name">
                        Name
                        <p-sortIcon field="name"></p-sortIcon>
                    </th>
                    <th pSortableColumn="category">
                        Category
                        <p-sortIcon field="category"></p-sortIcon>
                    </th>
                    <th pSortableColumn="price">
                        Price
                        <p-sortIcon field="price"></p-sortIcon>
                    </th>
                    <th style="width: 5rem"></th>
                </tr>
            </ng-template>
            <ng-template #body let-product>
                <tr>
                    <td>
                        <img src="/demo/images/product/{{ product.image }}" width="50px" [alt]="product.image" />
                    </td>
                    <td>
                        {{ product.name }}
                    </td>
                    <td>
                        {{ product.category }}
                    </td>
                    <td>
                        {{ product.price | currency: 'USD' }}
                    </td>
                    <td class="text-center">
                        <button pButton type="button" icon="pi pi-search" class="p-button-text"></button>
                    </td>
                </tr>
            </ng-template>
        </p-table>
    </div>`
})
export class RecentSalesWidget {
    orderWeek: OrderWeek[] = [
        { name: 'This Week', code: '0' },
        { name: 'Last Week', code: '1' }
    ];

    selectedOrderWeek: OrderWeek = { name: 'This Week', code: '0' };

    constructor(
        public layoutService: LayoutService
    ) { }

}
