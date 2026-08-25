import { Component } from '@angular/core';
import { LayoutService } from '@/app/layout/service/layout.service';
import { inject } from '@angular/core';

@Component({
    standalone: true,
    selector: 'stats-saas-widget',
    template: `<div class="col-span-12 md:col-span-6 xl:col-span-3">
            <div class="card p-0! overflow-hidden flex flex-col">
                <div class="flex items-center p-6">
                    <i class="pi pi-users text-5xl! text-blue-500"></i>
                    <div class="ml-6">
                        <span class="text-blue-500 block whitespace-nowrap">USERS SIGNED UP</span>
                        <span class="text-blue-500 block text-4xl font-bold">3882</span>
                    </div>
                </div>
                <img [src]="setSvg('users')" class="w-full" alt="users" />
            </div>
        </div>
        <div class="col-span-12 md:col-span-6 xl:col-span-3">
            <div class="card p-0! overflow-hidden flex flex-col">
                <div class="flex items-center p-6">
                    <i class="pi pi-map text-5xl! text-orange-500"></i>
                    <div class="ml-6">
                        <span class="text-orange-500 block whitespace-nowrap">LIFETIME VALUE</span>
                        <span class="text-orange-500 block text-4xl font-bold">532</span>
                    </div>
                </div>
                <img [src]="setSvg('locations')" class="w-full" alt="locations" />
            </div>
        </div>
        <div class="col-span-12 md:col-span-6 xl:col-span-3">
            <div class="card p-0! overflow-hidden flex flex-col">
                <div class="flex items-center p-6">
                    <i class="pi pi-directions text-5xl! text-green-500"></i>
                    <div class="ml-6">
                        <span class="text-green-500 block whitespace-nowrap">CONVERSION RATE</span>
                        <span class="text-green-500 block text-4xl font-bold">12.6%</span>
                    </div>
                </div>
                <img [src]="setSvg('rate')" class="w-full" alt="conversion" />
            </div>
        </div>
        <div class="col-span-12 md:col-span-6 xl:col-span-3">
            <div class="card h-full p-0! overflow-hidden flex flex-col">
                <div class="flex items-center p-6">
                    <i class="pi pi-comments text-5xl! text-purple-500"></i>
                    <div class="ml-6">
                        <span class="text-purple-500 block whitespace-nowrap">ACTIVE TRIALS</span>
                        <span class="text-purple-500 block text-4xl font-bold">440</span>
                    </div>
                </div>
                <img [src]="setSvg('interactions')" class="w-full mt-auto" alt="interactions" />
            </div>
        </div>`,
    host: {
        style: 'display: contents;'
    }
})
export class StatsSaasWidget {
    layoutService = inject(LayoutService);

    setSvg(path: string) {
        return `/demo/images/dashboard/${path}` + (this.layoutService.isDarkTheme() ? '-dark' : '') + '.svg';
    }
}
