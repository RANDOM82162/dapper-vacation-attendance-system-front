import { Component } from '@angular/core';

@Component({
    standalone: true,
    selector: 'sales-channels-widget',
    template: `<div class="card h-full">
        <div class="font-semibold text-xl mb-4">Sales Channels</div>
        <ul class="list-none m-0 p-0">
            <li class="mb-6">
                <div class="flex items-center justify-between mb-2">
                    <span class="font-bold">Online Marketplaces</span>
                    <span>%40</span>
                </div>
                <div class="rounded-border overflow-hidden bg-surface-200 dark:bg-surface-600" style="height: 0.5rem">
                    <div class="h-full bg-orange-500" style="width: 40%"></div>
                </div>
            </li>
            <li class="mb-6">
                <div class="flex items-center justify-between mb-2">
                    <span class="font-bold">Resellers</span>
                    <span>%60</span>
                </div>
                <div class="rounded-border overflow-hidden bg-surface-200 dark:bg-surface-600" style="height: 0.5rem">
                    <div class="h-full bg-indigo-500" style="width: 60%"></div>
                </div>
            </li>
            <li class="mb-6">
                <div class="flex items-center justify-between mb-2">
                    <span class="font-bold">Affiliate</span>
                    <span>%90</span>
                </div>
                <div class="rounded-border overflow-hidden bg-surface-200 dark:bg-surface-600" style="height: 0.5rem">
                    <div class="h-full bg-blue-500" style="width: 90%"></div>
                </div>
            </li>
            <li class="mb-6">
                <div class="flex items-center justify-between mb-2">
                    <span class="font-bold">Organic</span>
                    <span>%50</span>
                </div>
                <div class="rounded-border overflow-hidden bg-surface-200 dark:bg-surface-600" style="height: 0.5rem">
                    <div class="h-full bg-green-500" style="width: 50%"></div>
                </div>
            </li>
            <li class="mb-6">
                <div class="flex items-center justify-between mb-2">
                    <span class="font-bold">Referral</span>
                    <span>%30</span>
                </div>
                <div class="rounded-border overflow-hidden bg-surface-200 dark:bg-surface-600" style="height: 0.5rem">
                    <div class="h-full bg-purple-500" style="width: 30%"></div>
                </div>
            </li>
            <li class="mb-6">
                <div class="flex items-center justify-between mb-2">
                    <span class="font-bold">Ads</span>
                    <span>%30</span>
                </div>
                <div class="rounded-border overflow-hidden bg-surface-200 dark:bg-surface-600" style="height: 0.5rem">
                    <div class="h-full bg-yellow-500" style="width: 45%"></div>
                </div>
            </li>
            <li>
                <div class="flex items-center justify-between mb-2">
                    <span class="font-bold">Partners</span>
                    <span>%30</span>
                </div>
                <div class="rounded-border overflow-hidden bg-surface-200 dark:bg-surface-600" style="height: 0.5rem">
                    <div class="h-full bg-teal-500" style="width: 70%"></div>
                </div>
            </li>
        </ul>
    </div>`
})
export class SalesChannelsWidget {}
