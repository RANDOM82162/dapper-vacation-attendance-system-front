import { Component, effect, inject, signal } from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { LayoutService } from '@/app/layout/service/layout.service';

@Component({
    selector: 'monthly-recurring-widget',
    standalone: true,
    imports: [ChartModule],
    template: `
        <div class="font-semibold text-xl mb-4">Monthly Recurring Revenue Growth</div>
        <p-chart type="line" height="370px" [data]="revenueChartData()" [options]="revenueChartOptions()" id="nasdaq-chart"></p-chart>
    `,
    host: {
        class: 'card',
        style: 'display: block'
    }
})
export class MonthlyRecurringWidget {
    layoutService = inject(LayoutService);

    revenueChartData = signal<any>({});

    revenueChartOptions = signal<any>({});

    chartEffect = effect(() => {
        this.layoutService.layoutConfig().darkTheme;

        setTimeout(() => {
            this.initChart();
        }, 150);
    });

    initChart() {
        const documentStyle = getComputedStyle(document.documentElement);
        const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
        const borderColor = documentStyle.getPropertyValue('--surface-border');

        this.revenueChartData.set({
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [
                {
                    data: [11, 17, 30, 60, 88, 92],
                    borderColor: 'rgba(25, 146, 212, 0.5)',
                    pointBorderColor: 'transparent',
                    pointBackgroundColor: 'transparent',
                    fill: false,
                    tension: 0.4
                },
                {
                    data: [11, 19, 39, 59, 69, 71],
                    borderColor: 'rgba(25, 146, 212, 0.5)',
                    pointBorderColor: 'transparent',
                    pointBackgroundColor: 'transparent',
                    fill: false,
                    tension: 0.4
                },
                {
                    data: [11, 17, 21, 30, 47, 83],
                    backgroundColor: 'rgba(25, 146, 212, 0.2)',
                    borderColor: 'rgba(25, 146, 212, 0.5)',
                    pointBorderColor: 'transparent',
                    pointBackgroundColor: 'transparent',
                    fill: true,
                    tension: 0.4
                }
            ]
        });

        this.revenueChartOptions.set({
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    grid: {
                        color: borderColor
                    },
                    max: 100,
                    min: 0,
                    ticks: {
                        color: textColorSecondary
                    }
                },
                x: {
                    grid: {
                        color: borderColor
                    },
                    ticks: {
                        color: textColorSecondary,
                        beginAtZero: true
                    }
                }
            }
        });
    }
}
