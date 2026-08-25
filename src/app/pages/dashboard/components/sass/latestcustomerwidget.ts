import { Component } from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'latest-customer-widget',
    standalone: true,
    imports: [AvatarModule, ButtonModule],
    template: `
        <div class="card h-full">
            <div class="font-semibold text-xl">Latest Customers</div>
            <ul class="list-none p-0 m-0 mt-6">
                <li class="mb-6 flex items-center">
                    <p-avatar label="BS" size="large" shape="circle" styleClass="shrink-0 text-base font-bold" [style]="{ 'background-color': 'rgba(101, 214, 173, 0.1)', color: '#27AB83', border: '1px solid #65D6AD' }"></p-avatar>
                    <div class="ml-6">
                        <span class="block">Brooklyn Simmons</span>
                        <span class="text-muted-color block">Manager at Mitsubishi</span>
                    </div>
                </li>
                <li class="mb-6 flex items-center">
                    <p-avatar label="LA" size="large" shape="circle" styleClass="shrink-0 text-base font-bold" [style]="{ 'background-color': 'rgba(250, 219, 95, 0.1)', color: '#DE911D', border: '1px solid #FADB5F' }"></p-avatar>
                    <div class="ml-6">
                        <span class="block">Leslie Alexander</span>
                        <span class="text-muted-color block">Customer Success at General Electric</span>
                    </div>
                </li>
                <li class="mb-6 flex items-center">
                    <p-avatar label="JB" size="large" shape="circle" styleClass="shrink-0 text-base font-bold" [style]="{ 'background-color': 'rgba(94, 208, 250, 0.1)', color: '#1992D4', border: '1px solid #5ED0FA' }"></p-avatar>
                    <div class="ml-6">
                        <span class="block">Jerome Bell</span>
                        <span class="text-muted-color block">Mario Carrier at Nintendo</span>
                    </div>
                </li>
                <li class="mb-6 flex items-center">
                    <p-avatar label="JJ" size="large" shape="circle" styleClass="shrink-0 text-base font-bold" [style]="{ 'background-color': 'rgba(43, 176, 237, 0.1)', color: '#127FBF', border: '1px solid #2BB0ED' }"></p-avatar>
                    <div class="ml-6">
                        <span class="block">Jim Jones</span>
                        <span class="text-muted-color block">Reliability Engineer at eBay</span>
                    </div>
                </li>
                <li class="mb-6 flex items-center">
                    <p-avatar label="AB" size="large" shape="circle" styleClass="shrink-0 text-base font-bold" [style]="{ 'background-color': 'rgba(255, 155, 155, 0.1)', color: '#CF1124', border: '1px solid #FF9B9B' }"></p-avatar>
                    <div class="ml-6">
                        <span class="block">Annette Black</span>
                        <span class="text-muted-color block">Delivery Woman at Pizza Hut</span>
                    </div>
                </li>
                <li class="mb-6 flex items-center">
                    <p-avatar label="AF" size="large" shape="circle" styleClass="shrink-0 text-base font-bold" [style]="{ 'background-color': 'rgba(250, 219, 95, 0.1)', color: '#DE911D', border: '1px solid #FADB5F' }"></p-avatar>
                    <div class="ml-6">
                        <span class="block">Albert Flores</span>
                        <span class="text-muted-color block">Team Leader at Insomniac Games</span>
                    </div>
                </li>
            </ul>
            <p-button type="button" styleClass="w-full mt-6" label="View All" icon="pi pi-arrow-right" iconPos="right"></p-button>
        </div>
    `,
    host: {
        style: 'display: contents;'
    }
})
export class LatestCustomerWidget {}
