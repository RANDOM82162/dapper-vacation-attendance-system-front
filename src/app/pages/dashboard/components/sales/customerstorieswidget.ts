import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
    standalone: true,
    selector: 'customer-stories-widget',
    imports: [ButtonModule],
    template: `<div class="card">
        <div class="font-semibold text-xl mb-4">Customer Stories</div>
        <div class="flex flex-wrap items-center justify-around gap-2">
            <div class="flex flex-col items-center justify-center">
                <p-button icon="pi pi-plus text-2xl!" [outlined]="true" [rounded]="true" styleClass="w-16! h-16! mb-2"></p-button>
                <span class="font-bold text-sm">Add New</span>
            </div>
            <div class="flex flex-col items-center justify-center">
                <div class="flex items-center justify-center w-16 h-16 bg-transparent border-4 border-surface rounded-full relative">
                    <img src="/demo/images/avatar/amyelsner.png" class="rounded-full h-12 w-12" />
                    <span class="absolute top-0 bg-surface-0 dark:bg-surface-900 rounded-full flex items-center justify-center" style="right: -0.75rem; width: 1.5rem; height: 1.5rem">
                        <i class="pi pi-globe text-sm"></i>
                    </span>
                </div>
                <span class="font-bold">Darlene Robertson</span>
                <span class="text-muted-color text-sm">2m ago</span>
            </div>
            <div class="flex flex-col items-center justify-center">
                <div class="flex items-center justify-center w-16 h-16 bg-transparent border-4 border-surface rounded-full relative">
                    <img src="/demo/images/avatar/annafali.png" class="rounded-full h-12 w-12" />
                    <span class="absolute top-0 bg-surface-0 dark:bg-surface-900 rounded-full flex items-center justify-center" style="right: -0.75rem; width: 1.5rem; height: 1.5rem">
                        <i class="pi pi-globe text-sm"></i>
                    </span>
                </div>
                <span class="font-bold">Albert Flores</span>
                <span class="text-muted-color text-sm">1h ago</span>
            </div>
            <div class="flex flex-col items-center justify-center">
                <div class="flex items-center justify-center w-16 h-16 bg-transparent border-4 border-surface rounded-full relative">
                    <img src="/demo/images/avatar/asiyajavayant.png" class="rounded-full h-12 w-12" />
                    <span class="absolute top-0 bg-surface-0 dark:bg-surface-900 rounded-full flex items-center justify-center" style="right: -0.75rem; width: 1.5rem; height: 1.5rem">
                        <i class="pi pi-globe text-sm"></i>
                    </span>
                </div>
                <span class="font-bold">Annette Black</span>
                <span class="text-muted-color text-sm">6m ago</span>
            </div>
            <div class="flex flex-col items-center justify-center">
                <div class="flex items-center justify-center w-16 h-16 bg-transparent border-4 border-surface rounded-full relative">
                    <img src="/demo/images/avatar/bernardodominic.png" class="rounded-full h-12 w-12" />
                    <span class="absolute top-0 bg-surface-0 dark:bg-surface-900 rounded-full flex items-center justify-center" style="right: -0.75rem; width: 1.5rem; height: 1.5rem">
                        <i class="pi pi-globe text-sm"></i>
                    </span>
                </div>
                <span class="font-bold">Ralph Edwards</span>
                <span class="text-muted-color text-sm">4m ago</span>
            </div>
        </div>
    </div> `,
    host: {
        class: 'col-span-12'
    }
})
export class CustomerStoriesWidget {}
