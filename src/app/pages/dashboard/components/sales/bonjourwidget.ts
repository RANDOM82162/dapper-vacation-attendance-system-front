import { Component } from '@angular/core';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { FormsModule } from '@angular/forms';

@Component({
    standalone: true,
    selector: 'bonjour-widget',
    imports: [SelectModule, DatePickerModule, FormsModule],
    template: `<div class="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-6">
        <div class="flex items-center">
            <img src="/demo/images/avatar/profile.jpg" width="64" alt="profile" class="rounded-full border-2 border-primary shrink-0" />
            <div class="ml-6">
                <span class="text-4xl font-light">Bonjour, <span class="font-normal">Hermione</span></span>
                <div class="text-muted-color">26 January 2023, Thu</div>
            </div>
        </div>
        <div class="flex items-center justify-between gap-6">
            <p-select [options]="analytics" [(ngModel)]="selectedDrop" placeholder="Category" class="w-full sm:w-40" optionLabel="label"></p-select>
            <p-date-picker [(ngModel)]="dates" showIcon selectionMode="range" class="w-full sm:w-56" placeholder="Select Range"></p-date-picker>
        </div>
    </div>`,
    host: {
        display: 'contents'
    }
})
export class BonjourWidget {
    analytics = [
        { label: 'Products', value: 1 },
        { label: 'Sales', value: 2 },
        { label: 'Customers', value: 3 }
    ];

    selectedDrop: number | undefined | null = 0;

    dates: any;
}
