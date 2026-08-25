import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BadgeModule } from 'primeng/badge';

interface ListItem {
    image: string;
    text: string;
    subtext: string;
    ratio: string;
}

@Component({
    standalone: true,
    selector: 'store-overview-widget',
    imports: [CommonModule, BadgeModule],
    template: ` <div class="card h-full">
        <div class="font-semibold text-xl mb-4">Store Overview</div>
        <div class="flex flex-wrap gap-8">
            <ul class="flex-1 list-none p-0 m-0 min-w-[20rem]">
                @for (item of listItems; track item.text; let i = $index) {
                    <li class="rounded-border p-4 flex cursor-pointer border border-transparent" [ngClass]="{ 'border-primary-500!': activeListItemIndex === i, 'hover:bg-emphasis': activeListItemIndex !== i }" (click)="onItemClick(i)">
                        <img [alt]="item.text" [src]="item.image" width="64" class="mr-4 rounded-border" />
                        <div class="flex-1 flex items-center justify-between">
                            <div class="flex flex-col">
                                <span class="font-bold">{{ item.text }}</span>
                                <span class="text-muted-color mb-1">{{ item.subtext }}</span>
                                <p-badge [value]="item.ratio"></p-badge>
                            </div>
                            <i class="pi pi-chevron-right text-muted-color ml-6"></i>
                        </div>
                    </li>
                }
            </ul>

            <div class="flex-1 flex flex-col items-center justify-center">
                <div class="bars flex items-end mb-4">
                    <div class="w-4 h-8 mr-2 bg-surface-200 dark:bg-surface-600 rounded-border" [ngClass]="{ 'h-3rem bg-primary-500': activeListItemIndex === 2 && activeTab === 0 }"></div>
                    <div class="w-4 h-12 mr-2 bg-surface-200 dark:bg-surface-600 rounded-border" [ngClass]="{ 'h-5rem bg-primary-500': activeListItemIndex === 1 && activeTab !== 2 }"></div>
                    <div class="w-4 h-16 mr-2 bg-surface-200 dark:bg-surface-600 rounded-border"></div>
                    <div class="w-4 h-24 mr-2 bg-surface-200 dark:bg-surface-600 rounded-border" [ngClass]="{ 'h-4rem bg-primary-500': activeListItemIndex === 2 && activeTab !== 0 }"></div>
                    <div class="w-4 h-8 mr-2 bg-surface-200 dark:bg-surface-600 rounded-border" [ngClass]="{ 'h-4rem bg-primary-500': activeListItemIndex === 1 && activeTab === 2 }"></div>
                    <div class="w-4 h-20 mr-2 bg-surface-200 dark:bg-surface-600 rounded-border" [ngClass]="{ 'h-4rem bg-primary-500': activeListItemIndex === 0 && activeTab === 1 }"></div>
                    <div class="w-4 h-12 mr-2 bg-surface-200 dark:bg-surface-600 rounded-border" [ngClass]="{ 'h-4rem bg-primary-500': activeListItemIndex === 0 && activeTab !== 1 }"></div>
                    <div class="w-4 h-4 mr-2 bg-surface-200 dark:bg-surface-600 rounded-border"></div>
                </div>
                <span class="font-bold">{{ activeListItem.text }}</span>
                <span class="text-muted-color">{{ activeListItem.subtext }}</span>
            </div>
        </div>
        <div class="flex items-center mt-16 rounded-border">
            <div class="flex flex-col items-center flex-1 py-6 cursor-pointer border-t hover:bg-emphasis" [ngClass]="{ 'border-primary-500': activeTab === 0, 'border-surface': activeTab !== 0 }" (click)="onTabClick(0)">
                <i class="pi pi-sort-amount-down text-2xl mb-2"></i>
                <span class="font-bold">Latest</span>
            </div>
            <div class="flex flex-col items-center flex-1 py-6 cursor-pointer border-t hover:bg-emphasis" [ngClass]="{ 'border-primary-500': activeTab === 1, 'border-surface': activeTab !== 1 }" (click)="onTabClick(1)">
                <i class="pi pi-chart-line text-2xl mb-2"></i>
                <span class="font-bold">Trending</span>
            </div>
            <div class="flex flex-col items-center flex-1 py-6 cursor-pointer border-t hover:bg-emphasis" [ngClass]="{ 'border-primary-500': activeTab === 2, 'border-surface': activeTab !== 2 }" (click)="onTabClick(2)">
                <i class="pi pi-star text-2xl mb-2"></i>
                <span class="font-bold">Starred</span>
            </div>
        </div>
    </div>`
})
export class StoreOverviewWidget implements OnInit {
    activeTab = 0;

    activeListItemIndex = 1;

    activeListItem = { image: '/demo/images/dashboard/headphones.svg', text: 'HF Headphones', subtext: 'Wireless', ratio: '+24%' };

    listItems: ListItem[] = [];

    ngOnInit() {
        this.listItems = [
            { image: '/demo/images/dashboard/sneaker.png', text: 'Red Sneakers', subtext: 'RX Series', ratio: '+40%' },
            { image: '/demo/images/dashboard/headphones.png', text: 'HF Headphones', subtext: 'Wireless', ratio: '+24%' },
            { image: '/demo/images/dashboard/sunglasses.png', text: 'Sunglasses', subtext: 'UV Protection', ratio: '+17%' }
        ];
    }

    onTabClick(index: number) {
        this.activeTab = index;
        if (index === 0) {
            this.listItems = [
                { image: '/demo/images/dashboard/sneaker.png', text: 'Red Sneakers', subtext: 'RX Series', ratio: '+40%' },
                { image: '/demo/images/dashboard/headphones.png', text: 'HF Headphones', subtext: 'Wireless', ratio: '+24%' },
                { image: '/demo/images/dashboard/sunglasses.png', text: 'Sunglasses', subtext: 'UV Protection', ratio: '+17%' }
            ];
        } else if (index === 1) {
            this.listItems = [
                { image: '/demo/images/dashboard/camera.png', text: 'Instant Camera', subtext: 'II-Mark', ratio: '+27%' },
                { image: '/demo/images/dashboard/cupcake.png', text: 'Cupcake', subtext: 'Cinnamon', ratio: '+41%' },
                { image: '/demo/images/dashboard/drink.png', text: 'Cold Drink', subtext: 'Lime', ratio: '+56%' }
            ];
        } else if (index === 2) {
            this.listItems = [
                { image: '/demo/images/dashboard/tripod.png', text: 'Tripod', subtext: 'Stabilizer', ratio: '+34%' },
                { image: '/demo/images/dashboard/headphone2.png', text: 'Headphone', subtext: 'Wireless', ratio: '+67%' },
                { image: '/demo/images/dashboard/spoon.png', text: 'Spoon Set', subtext: 'Colorful', ratio: '+8%' }
            ];
        }

        this.activeListItem = this.listItems[this.activeListItemIndex];
    }

    onItemClick(index: number) {
        this.activeListItemIndex = index;
        this.activeListItem = this.listItems[index];
    }
}
