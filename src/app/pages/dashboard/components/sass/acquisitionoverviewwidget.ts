import { Component, effect, inject, signal } from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { LayoutService } from '@/app/layout/service/layout.service';

interface OverviewWeek {
    code: string;
    name: string;
}

@Component({
    selector: 'acquisition-overview-widget',
    imports: [FormsModule, ChartModule, SelectModule],
    standalone: true,
    template: `
        <div class="col-span-12 xl:col-span-6">
            <div class="card h-full">
                <div class="flex justify-between items-center mb-4">
                    <span class="font-semibold text-xl">Acquisition Overview</span>
                    <p-select [options]="overviewWeeks" [ngModel]="selectedOverviewWeek()" (ngModelChange)="onWeekChange($event)" optionLabel="name"></p-select>
                </div>
                <div class="graph">
                    <p-chart type="bar" [data]="overviewChartData()" [options]="overviewChartOptions()" height="370px"></p-chart>
                </div>
            </div>
        </div>
    `,
    host: {
        style: 'display: contents;'
    }
})
export class AcquisitionOverviewWidget {
    layoutService = inject(LayoutService);

    overviewWeeks: OverviewWeek[] = [
        { name: 'Last Week', code: '0' },
        { name: 'This Week', code: '1' }
    ];

    selectedOverviewWeek = signal<OverviewWeek>({ name: 'This Week', code: '1' });

    overviewChartData = signal<any>({});

    overviewChartOptions = signal<any>({});

    chartEffect = effect(() => {
        const isDark = this.layoutService.layoutConfig().darkTheme;
        const selectedWeek = this.selectedOverviewWeek();

        setTimeout(() => {
            this.initChart(isDark, selectedWeek);
        }, 150);
    });

    initChart(isDark: boolean, selectedWeek: OverviewWeek) {
        const documentStyle = getComputedStyle(document.documentElement);
        const primaryColor = documentStyle.getPropertyValue('--primary-color');
        const primaryColor300 = documentStyle.getPropertyValue('--p-primary-200');
        const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
        const borderColor = documentStyle.getPropertyValue('--surface-border');

        const dataSet1 = [
            [2, 1, 0.5, 0.6, 0.5, 1.3, 1],
            [4.88, 3, 6.2, 4.5, 2.1, 5.1, 4.1]
        ];
        const dataSet2 = [
            [3, 2.4, 1.5, 0.6, 4.5, 3.3, 2],
            [3.2, 4.1, 2.2, 5.5, 4.1, 3.6, 3.5]
        ];

        const selectedData = selectedWeek.code === '1' ? dataSet2 : dataSet1;

        this.overviewChartData.set({
            labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
            datasets: [
                {
                    label: 'Organic',
                    data: selectedData[0],
                    borderColor: [primaryColor],
                    pointBorderColor: 'transparent',
                    pointBackgroundColor: 'transparent',
                    type: 'line',
                    fill: false
                },
                {
                    label: 'Referral',
                    data: selectedData[1],
                    backgroundColor: [isDark ? '#879AAF' : '#E4E7EB'],
                    hoverBackgroundColor: [primaryColor300],
                    fill: true,
                    borderRadius: 10,
                    borderSkipped: 'top bottom',
                    barPercentage: 0.3
                }
            ]
        });

        this.overviewChartOptions.set({
            plugins: {
                legend: {
                    position: 'bottom',
                    align: 'end',
                    labels: {
                        color: textColorSecondary
                    }
                }
            },
            responsive: true,
            hover: {
                mode: 'index'
            },
            scales: {
                y: {
                    max: 7,
                    min: 0,
                    ticks: {
                        stepSize: 0,
                        callback: function (value: number, index: number) {
                            if (index === 0) {
                                return value;
                            } else {
                                return value + 'k';
                            }
                        },
                        color: textColorSecondary
                    },
                    grid: {
                        borderDash: [2, 2],
                        color: borderColor,
                        drawBorder: false
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        beginAtZero: true,
                        color: textColorSecondary
                    }
                }
            }
        });
    }

    onWeekChange(week: OverviewWeek) {
        this.selectedOverviewWeek.set(week);
    }
}
