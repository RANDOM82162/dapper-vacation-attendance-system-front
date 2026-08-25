import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabsModule } from 'primeng/tabs';

@Component({
    selector: 'leads-by-role-widget',
    standalone: true,
    imports: [CommonModule, TabsModule],
    template: `
        <div class="card h-full">
            <div class="font-semibold text-xl mb-6">Leads By Region</div>
            <p-tabs [value]="0">
                <p-tablist>
                    <p-tab [value]="0">Europe</p-tab>
                    <p-tab [value]="1">United States</p-tab>
                </p-tablist>
                <p-tabpanels>
                    <p-tabpanel [value]="0">
                        <table class="w-full">
                            <tbody>
                                <tr>
                                    <td class="py-2">🇮🇹 Italy</td>
                                    <td><span class="font-bold">90</span></td>
                                    <td class="text-right">
                                        <div class="inline-flex items-center justify-between px-2 py-1 bg-green-100 text-green-900 rounded-border" style="min-width: 3.5rem">
                                            <i class="pi pi-arrow-up"></i>
                                            <span class="font-bold ml-1">12</span>
                                        </div>
                                    </td>
                                    <td class="text-right">
                                        <div class="inline-flex items-center justify-center bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-100 p-1 rounded-border text-sm" style="min-width: 4rem">
                                            <span class="font-bold">LOW</span>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="py-2">🇫🇷 France</td>
                                    <td><span class="font-bold">61</span></td>
                                    <td class="text-right">
                                        <div class="inline-flex items-center justify-between px-2 py-1 bg-green-100 text-green-900 rounded-border" style="min-width: 3.5rem">
                                            <i class="pi pi-arrow-up"></i>
                                            <span class="font-bold ml-1">8</span>
                                        </div>
                                    </td>
                                    <td class="text-right">
                                        <div class="inline-flex items-center justify-center bg-surface-700 dark:bg-surface-100 text-surface-100 dark:text-surface-700 p-1 rounded-border text-sm" style="min-width: 4rem">
                                            <span class="font-bold">HIGH</span>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="py-2">🇩🇪 Germany</td>
                                    <td><span class="font-bold">46</span></td>
                                    <td class="text-right">
                                        <div class="inline-flex items-center justify-between px-2 py-1 bg-green-100 text-green-900 rounded-border" style="min-width: 3.5rem">
                                            <i class="pi pi-arrow-up"></i>
                                            <span class="font-bold ml-1">5</span>
                                        </div>
                                    </td>
                                    <td class="text-right">
                                        <div class="inline-flex items-center justify-center bg-surface-700 dark:bg-surface-100 text-surface-100 dark:text-surface-700 p-1 rounded-border text-sm" style="min-width: 4rem">
                                            <span class="font-bold">HIGH</span>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="py-2">🇳🇱 Netherlands</td>
                                    <td><span class="font-bold">28</span></td>
                                    <td class="text-right">
                                        <div class="inline-flex items-center justify-between px-2 py-1 bg-red-100 text-red-900 rounded-border" style="min-width: 3.5rem">
                                            <i class="pi pi-arrow-down"></i>
                                            <span class="font-bold ml-1">19</span>
                                        </div>
                                    </td>
                                    <td class="text-right">
                                        <div class="inline-flex items-center justify-center bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-100 p-1 rounded-border text-sm" style="min-width: 4rem">
                                            <span class="font-bold">LOW</span>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="py-2">🇪🇸 Spain</td>
                                    <td><span class="font-bold">17</span></td>
                                    <td class="text-right">
                                        <div class="inline-flex items-center justify-between px-2 py-1 bg-red-100 text-red-900 rounded-border" style="min-width: 3.5rem">
                                            <i class="pi pi-arrow-down"></i>
                                            <span class="font-bold ml-1">7</span>
                                        </div>
                                    </td>
                                    <td class="text-right">
                                        <div class="inline-flex items-center justify-center bg-surface-700 dark:bg-surface-100 text-surface-100 dark:text-surface-700 p-1 rounded-border text-sm" style="min-width: 4rem">
                                            <span class="font-bold">HIGH</span>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="py-2">🇧🇷 Brazil</td>
                                    <td><span class="font-bold">37</span></td>
                                    <td class="text-right">
                                        <div class="inline-flex items-center justify-between px-2 py-1 bg-red-100 text-red-900 rounded-border" style="min-width: 3.5rem">
                                            <i class="pi pi-arrow-down"></i>
                                            <span class="font-bold ml-1">7</span>
                                        </div>
                                    </td>
                                    <td class="text-right">
                                        <div class="inline-flex items-center justify-center bg-surface-700 dark:bg-surface-100 text-surface-100 dark:text-surface-700 p-1 rounded-border text-sm" style="min-width: 4rem">
                                            <span class="font-bold">HIGH</span>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="py-2">🇲🇽 Mexico</td>
                                    <td><span class="font-bold">27</span></td>
                                    <td class="text-right">
                                        <div class="inline-flex items-center justify-between px-2 py-1 bg-green-100 text-green-900 rounded-border" style="min-width: 3.5rem">
                                            <i class="pi pi-arrow-up"></i>
                                            <span class="font-bold ml-1">4</span>
                                        </div>
                                    </td>
                                    <td class="text-right">
                                        <div class="inline-flex items-center justify-center bg-surface-700 dark:bg-surface-100 text-surface-100 dark:text-surface-700 p-1 rounded-border text-sm" style="min-width: 4rem">
                                            <span class="font-bold">HIGH</span>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </p-tabpanel>
                    <p-tabpanel [value]="1">
                        <table class="w-full">
                            <tbody>
                                <tr>
                                    <td class="py-2">California</td>
                                    <td><span class="font-bold">79</span></td>
                                    <td class="text-right">
                                        <div class="inline-flex items-center justify-between px-2 py-1 bg-green-100 text-green-900 rounded-border" style="min-width: 3.5rem">
                                            <i class="pi pi-arrow-up"></i>
                                            <span class="font-bold ml-1">11</span>
                                        </div>
                                    </td>
                                    <td class="text-right">
                                        <div class="inline-flex items-center justify-center bg-surface-700 dark:bg-surface-100 text-surface-100 dark:text-surface-700 p-1 rounded-border text-sm" style="min-width: 4rem">
                                            <span class="font-bold">HIGH</span>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="py-2">Texas</td>
                                    <td><span class="font-bold">71</span></td>
                                    <td class="text-right">
                                        <div class="inline-flex items-center justify-between px-2 py-1 bg-green-100 text-green-900 rounded-border" style="min-width: 3.5rem">
                                            <i class="pi pi-arrow-up"></i>
                                            <span class="font-bold ml-1">9</span>
                                        </div>
                                    </td>
                                    <td class="text-right">
                                        <div class="inline-flex items-center justify-center bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-100 p-1 rounded-border text-sm" style="min-width: 4rem">
                                            <span class="font-bold">LOW</span>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="py-2">Florida</td>
                                    <td><span class="font-bold">55</span></td>
                                    <td class="text-right">
                                        <div class="inline-flex items-center justify-between px-2 py-1 bg-red-100 text-red-900 rounded-border" style="min-width: 3.5rem">
                                            <i class="pi pi-arrow-down"></i>
                                            <span class="font-bold ml-1">15</span>
                                        </div>
                                    </td>
                                    <td class="text-right">
                                        <div class="inline-flex items-center justify-center bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-100 p-1 rounded-border text-sm" style="min-width: 4rem">
                                            <span class="font-bold">LOW</span>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="py-2">New York</td>
                                    <td><span class="font-bold">48</span></td>
                                    <td class="text-right">
                                        <div class="inline-flex items-center justify-between px-2 py-1 bg-red-100 text-red-900 rounded-border" style="min-width: 3.5rem">
                                            <i class="pi pi-arrow-down"></i>
                                            <span class="font-bold ml-1">10</span>
                                        </div>
                                    </td>
                                    <td class="text-right">
                                        <div class="inline-flex items-center justify-center bg-surface-700 dark:bg-surface-100 text-surface-100 dark:text-surface-700 p-1 rounded-border text-sm" style="min-width: 4rem">
                                            <span class="font-bold">HIGH</span>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="py-2">Ohio</td>
                                    <td><span class="font-bold">26</span></td>
                                    <td class="text-right">
                                        <div class="inline-flex items-center justify-between px-2 py-1 bg-red-100 text-red-900 rounded-border" style="min-width: 3.5rem">
                                            <i class="pi pi-arrow-down"></i>
                                            <span class="font-bold ml-1">6</span>
                                        </div>
                                    </td>
                                    <td class="text-right">
                                        <div class="inline-flex items-center justify-center bg-surface-700 dark:bg-surface-100 text-surface-100 dark:text-surface-700 p-1 rounded-border text-sm" style="min-width: 4rem">
                                            <span class="font-bold">HIGH</span>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="py-2">New York</td>
                                    <td><span class="font-bold">48</span></td>
                                    <td class="text-right">
                                        <div class="inline-flex items-center justify-between px-2 py-1 bg-red-100 text-red-900 rounded-border" style="min-width: 3.5rem">
                                            <i class="pi pi-arrow-down"></i>
                                            <span class="font-bold ml-1">10</span>
                                        </div>
                                    </td>
                                    <td class="text-right">
                                        <div class="inline-flex items-center justify-center bg-surface-700 dark:bg-surface-100 text-surface-100 dark:text-surface-700 p-1 rounded-border text-sm" style="min-width: 4rem">
                                            <span class="font-bold">HIGH</span>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="py-2">Ohio</td>
                                    <td><span class="font-bold">26</span></td>
                                    <td class="text-right">
                                        <div class="inline-flex items-center justify-between px-2 py-1 bg-red-100 text-red-900 rounded-border" style="min-width: 3.5rem">
                                            <i class="pi pi-arrow-down"></i>
                                            <span class="font-bold ml-1">6</span>
                                        </div>
                                    </td>
                                    <td class="text-right">
                                        <div class="inline-flex items-center justify-center bg-surface-700 dark:bg-surface-100 text-surface-100 dark:text-surface-700 p-1 rounded-border text-sm" style="min-width: 4rem">
                                            <span class="font-bold">HIGH</span>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </p-tabpanel>
                </p-tabpanels>
            </p-tabs>
        </div>
    `,
    host: {
        style: 'display: contents;'
    }
})
export class LeadsByRoleWidget {}
