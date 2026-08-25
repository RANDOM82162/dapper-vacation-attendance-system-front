import { Component } from '@angular/core';
import { KnobModule } from 'primeng/knob';
import { FormsModule } from '@angular/forms';

@Component({
    standalone: true,
    selector: 'best-sellers-widget',
    imports: [KnobModule, FormsModule],
    template: `<div class="card h-full">
        <div class="font-semibold text-xl mb-4">Best Sellers</div>
        <ul class="list-none p-0 m-0">
            <li class="flex items-center justify-between pb-2">
                <div class="flex items-center justify-between">
                    <img src="/demo/images/product/bamboo-watch.jpg" alt="verona-layout" width="42" height="42" class="rounded-border" />
                    <div class="ml-2 flex flex-col">
                        <span class="font-bold">Bamboo Watch</span>
                        <span class="text-muted-color text-sm">Accessories</span>
                    </div>
                </div>
                <p-knob [(ngModel)]="value1" [size]="40" class="ml-auto" [showValue]="false"></p-knob>
            </li>
            <li class="flex items-center justify-between py-2">
                <div class="flex items-center justify-between">
                    <img src="/demo/images/product/black-watch.jpg" alt="verona-layout" width="42" height="42" class="rounded-border" />
                    <div class="ml-2 flex flex-col">
                        <span class="font-bold">Black Watch</span>
                        <span class="text-muted-color text-sm">Accessories</span>
                    </div>
                </div>
                <p-knob [(ngModel)]="value2" [size]="40" class="ml-auto" [showValue]="false"></p-knob>
            </li>
            <li class="flex items-center justify-between py-2">
                <div class="flex items-center justify-between">
                    <img src="/demo/images/product/blue-band.jpg" alt="verona-layout" width="42" height="42" class="rounded-border" />
                    <div class="ml-2 flex flex-col">
                        <span class="font-bold">Blue Band</span>
                        <span class="text-muted-color text-sm">Fitness</span>
                    </div>
                </div>
                <p-knob [(ngModel)]="value3" [size]="40" class="ml-auto" [showValue]="false"></p-knob>
            </li>
            <li class="flex items-center justify-between py-2">
                <div class="flex items-center justify-between">
                    <img src="/demo/images/product/blue-t-shirt.jpg" alt="verona-layout" width="42" height="42" class="rounded-border" />
                    <div class="ml-2 flex flex-col">
                        <span class="font-bold">Blue T-Shirt</span>
                        <span class="text-muted-color text-sm">Clothing</span>
                    </div>
                </div>
                <p-knob [(ngModel)]="value4" [size]="40" class="ml-auto" [showValue]="false"></p-knob>
            </li>
            <li class="flex items-center justify-between py-2">
                <div class="flex items-center justify-between">
                    <img src="/demo/images/product/black-watch.jpg" alt="verona-layout" width="42" height="42" class="rounded-border" />
                    <div class="ml-2 flex flex-col">
                        <span class="font-bold">Black Watch</span>
                        <span class="text-muted-color text-sm">Accessories</span>
                    </div>
                </div>
                <p-knob [(ngModel)]="value5" [size]="40" class="ml-auto" [showValue]="false"></p-knob>
            </li>
            <li class="flex items-center justify-between py-2">
                <div class="flex items-center justify-between">
                    <img src="/demo/images/product/sneakers.jpg" alt="verona-layout" width="42" height="42" class="rounded-border" />
                    <div class="ml-2 flex flex-col">
                        <span class="font-bold">Sneakers</span>
                        <span class="text-muted-color text-sm">Clothing</span>
                    </div>
                </div>
                <p-knob [(ngModel)]="value6" [size]="40" class="ml-auto" [showValue]="false"></p-knob>
            </li>
        </ul>
    </div>`
})
export class BestSellersWidget {
    value1: number = 75;

    value2: number = 20;

    value3: number = 42;

    value4: number = 26;

    value5: number = 10;

    value6: number = 60;
}
