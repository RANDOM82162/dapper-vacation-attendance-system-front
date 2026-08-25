import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
    standalone: true,
    selector: 'potential-influencers-widget',
    imports: [ButtonModule],
    template: `<div class="card">
        <div class="font-semibold text-xl mb-4">Potential Influencers</div>
        <div class="flex flex-wrap items-center justify-around gap-2">
            <div class="flex flex-col items-center justify-center">
                <p-button icon="pi pi-plus text-2xl!" [outlined]="true" [rounded]="true" styleClass="w-16! h-16! mb-2"></p-button>
                <span class="font-bold text-sm">Add New</span>
            </div>
            <div class="flex flex-col items-center justify-center">
                <div class="flex items-center justify-center w-16 h-16 bg-transparent border-4 border-surface rounded-full relative">
                    <img src="/demo/images/avatar/ionibowcher.png" class="rounded-full h-12 w-12" />
                    <span class="absolute top-0 bg-surface-0 dark:bg-surface-900 rounded-full flex items-center justify-center" style="right: -0.75rem; width: 1.5rem; height: 1.5rem">
                        <i class="pi pi-globe text-sm"></i>
                    </span>
                </div>
                <span class="font-bold">Jenna Watson</span>
                <span class="text-muted-color text-sm">2m ago</span>
            </div>
            <div class="flex flex-col items-center justify-center">
                <div class="flex items-center justify-center w-16 h-16 bg-transparent border-4 border-surface rounded-full relative">
                    <img src="/demo/images/avatar/onyamalimba.png" class="rounded-full h-12 w-12" />
                    <span class="absolute top-0 bg-surface-0 dark:bg-surface-900 rounded-full flex items-center justify-center" style="right: -0.75rem; width: 1.5rem; height: 1.5rem">
                        <i class="pi pi-globe text-sm"></i>
                    </span>
                </div>
                <span class="font-bold">Dan Cooper</span>
                <span class="text-muted-color text-sm">10m ago</span>
            </div>
            <div class="flex flex-col items-center justify-center">
                <div class="flex items-center justify-center w-16 h-16 bg-transparent border-4 border-surface rounded-full relative">
                    <img src="/demo/images/avatar/elwinsharvill.png" class="rounded-full h-12 w-12" />
                    <span class="absolute top-0 bg-surface-0 dark:bg-surface-900 rounded-full flex items-center justify-center" style="right: -0.75rem; width: 1.5rem; height: 1.5rem">
                        <i class="pi pi-globe text-sm"></i>
                    </span>
                </div>
                <span class="font-bold">Kathryn Murphy</span>
                <span class="text-muted-color text-sm">50m ago</span>
            </div>
            <div class="flex flex-col items-center justify-center">
                <div class="flex items-center justify-center w-16 h-16 bg-transparent border-4 border-surface rounded-full relative">
                    <img src="/demo/images/avatar/stephenshaw.png" class="rounded-full h-12 w-12" />
                    <span class="absolute top-0 bg-surface-0 dark:bg-surface-900 rounded-full flex items-center justify-center" style="right: -0.75rem; width: 1.5rem; height: 1.5rem">
                        <i class="pi pi-globe text-sm"></i>
                    </span>
                </div>
                <span class="font-bold">Smith Wilson</span>
                <span class="text-muted-color text-sm">40m ago</span>
            </div>
        </div>
    </div>`,
    host: {
        class: 'col-span-12'
    }
})
export class PotentialInfluencersWidget {}
