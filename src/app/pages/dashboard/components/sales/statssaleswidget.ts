import { Component } from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
import { CommonModule } from '@angular/common';

@Component({
    standalone: true,
    selector: 'stats-sales-widget',
    imports: [CommonModule, AvatarModule],
    template: `
        <div class="card p-0! grid grid-cols-12 gap-4 grid-nogutter">
            <div class="col-span-12 md:col-span-6 lg:col-span-3 py-8 px-12 border-0 md:border-r border-surface">
                <div class="flex items-center mb-4">
                    <p-avatar icon="pi pi-shopping-cart" size="large" shape="circle" class="bg-indigo-100! text-indigo-700!"></p-avatar>
                    <span class="text-xl ml-2">Orders</span>
                </div>
                <div class="flex items-center justify-between mb-4">
                    <span class="block font-bold text-5xl mb-4">1420</span>
                    <div class="flex items-center justify-between h-8 px-2 py-1 bg-green-100 text-green-900 rounded-border">
                        <i class="pi pi-arrow-up-right"></i>
                        <span class="font-bold ml-1">551</span>
                    </div>
                </div>
                <div class="rounded-border overflow-hidden bg-surface-200 dark:bg-surface-600" style="height: 0.5rem">
                    <div class="h-full bg-indigo-500" style="width: 40%"></div>
                </div>
            </div>
            <div class="col-span-12 md:col-span-6 lg:col-span-3 py-8 px-12 border-0 md:border-r border-surface">
                <div class="flex items-center mb-4">
                    <p-avatar icon="pi pi-money-bill" size="large" shape="circle" class="bg-green-100! text-green-700!"></p-avatar>
                    <span class="text-xl ml-2">Revenue</span>
                </div>
                <div class="flex items-center justify-between mb-4">
                    <span class="block font-bold text-5xl mb-4">3296</span>
                    <div class="flex items-center justify-between h-8 px-2 py-1 bg-green-100 text-green-900 rounded-border">
                        <i class="pi pi-arrow-up-right"></i>
                        <span class="font-bold ml-1">2.7K</span>
                    </div>
                </div>
                <div class="rounded-border overflow-hidden bg-surface-200 dark:bg-surface-600" style="height: 0.5rem">
                    <div class="h-full bg-green-500" style="width: 60%"></div>
                </div>
            </div>
            <div class="col-span-12 md:col-span-6 lg:col-span-3 py-8 px-12 border-0 md:border-r border-surface">
                <div class="flex items-center mb-4">
                    <p-avatar icon="pi pi-users" size="large" shape="circle" class="bg-yellow-100! text-yellow-700!"></p-avatar>
                    <span class="text-xl ml-2">Customers</span>
                </div>
                <div class="flex items-center justify-between mb-4">
                    <span class="block font-bold text-5xl mb-4">1875</span>
                    <div class="flex items-center justify-between h-8 px-2 py-1 bg-green-100 text-green-900 rounded-border">
                        <i class="pi pi-arrow-up-right"></i>
                        <span class="font-bold ml-1">254</span>
                    </div>
                </div>
                <div class="rounded-border overflow-hidden bg-surface-200 dark:bg-surface-600" style="height: 0.5rem">
                    <div class="h-full bg-yellow-500" style="width: 80%"></div>
                </div>
            </div>
            <div class="col-span-12 md:col-span-6 lg:col-span-3 py-8 px-12 border-0 md:border-r lg:border-none border-surface">
                <div class="flex items-center mb-4">
                    <p-avatar icon="pi pi-comments" size="large" shape="circle" class="bg-purple-100! text-purple-700!"></p-avatar>
                    <span class="text-xl ml-2">Comments</span>
                </div>
                <div class="flex items-center justify-between mb-4">
                    <span class="block font-bold text-5xl mb-4">2448</span>
                    <div class="flex items-center justify-between h-8 px-2 py-1 bg-green-100 text-green-900 rounded-border">
                        <i class="pi pi-arrow-up-right"></i>
                        <span class="font-bold ml-1">85</span>
                    </div>
                </div>
                <div class="rounded-border overflow-hidden bg-surface-200 dark:bg-surface-600" style="height: 0.5rem">
                    <div class="h-full bg-purple-500" style="width: 30%"></div>
                </div>
            </div>
        </div>
    `,
    host: {
        style: 'display: contents;'
    }
})
export class StatsSalesWidget {}
