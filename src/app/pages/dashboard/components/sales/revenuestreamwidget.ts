import { Component, effect, inject, signal } from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { ButtonModule } from 'primeng/button';
import { LayoutService } from '@/app/layout/service/layout.service';

@Component({
    standalone: true,
    selector: 'revenue-stream-widget',
    imports: [ButtonModule, ChartModule],
    template: ` <div class="card h-full">
        <div class="flex items-center justify-between mb-4">
            <div class="font-semibold text-xl mb-4 class=">Revenue Stream</div>
            <div class="flex items-center gap-2">
                <p-button type="button" icon="pi pi-angle-left" [outlined]="true" [rounded]="true"></p-button>
                <p-button type="button" icon="pi pi-angle-right" [outlined]="true" [rounded]="true"></p-button>
            </div>
        </div>
        <div class="flex flex-col items-center justify-center">
            <p-chart type="doughnut" [data]="revenueChart()" [options]="revenueOptions()" width="180px" height="180px" class="mb-8"></p-chart>
            <span class="font-bold mb-2">Total Revenue This Week</span>
            <span class="font-bold text-6xl mb-2">88k</span>
            <span class="font-bold mb-6 text-green-500">+21%<span class="text-muted-color"> higher than last week</span></span>
            <div class="flex items-center justify-center gap-6">
                <div class="flex items-center">
                    <i class="pi pi-circle-on text-indigo-500"></i>
                    <span class="text-muted-color ml-2">Online</span>
                </div>
                <div class="flex items-center">
                    <i class="pi pi-circle-on text-teal-500"></i>
                    <span class="text-muted-color ml-2">Retail</span>
                </div>
                <div class="flex items-center">
                    <i class="pi pi-circle-on text-purple-500"></i>
                    <span class="text-muted-color ml-2">Partner</span>
                </div>
            </div>
        </div>
    </div>`
})
export class RevenueStreamWidget {
    layoutService = inject(LayoutService);

    revenueChart = signal<any>({});

    revenueOptions = signal<any>({});

    chartEffect = effect(() => {
        this.layoutService.layoutConfig().darkTheme;

        setTimeout(() => {
            this.initChart();
        }, 150);
    });

    initChart() {
        const documentStyle = getComputedStyle(document.documentElement);

        this.revenueChart.set({
            labels: ['Online', 'Retail', 'Partner'],
            datasets: [
                {
                    data: [12, 32, 56],
                    backgroundColor: [documentStyle.getPropertyValue('--p-indigo-500'), documentStyle.getPropertyValue('--p-teal-500'), documentStyle.getPropertyValue('--p-purple-500')],
                    borderWidth: 0
                }
            ]
        });

        this.revenueOptions.set({
            plugins: {
                legend: {
                    display: false
                }
            },
            responsive: true,
            cutout: 60
        });
    }
}
