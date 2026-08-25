import { Component } from '@angular/core';
import { BonjourWidget } from '../components/sales/bonjourwidget';
import { StatsSalesWidget } from '../components/sales/statssaleswidget';
import { StoreOverviewWidget } from '../components/sales/storeoverviewwidget';
import { RecentSalesWidget } from '../components/sales/recentsaleswidget';
import { LiveSupportWidget } from '../components/sales/livesupportwidget';
import { RevenueStreamWidget } from '../components/sales/revenuestreamwidget';
import { SalesChannelsWidget } from '../components/sales/saleschannelswidget';
import { OptimizingWidget } from '../components/sales/optimizingwidget';
import { BestSellersWidget } from '../components/sales/bestsellerswidget';
import { CustomerStoriesWidget } from '../components/sales/customerstorieswidget';
import { PotentialInfluencersWidget } from '../components/sales/potentialinfluencerswidget';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-sales-dashboard',
    standalone: true,
    imports: [CommonModule, BonjourWidget, StatsSalesWidget, StoreOverviewWidget, RecentSalesWidget, LiveSupportWidget, RevenueStreamWidget, SalesChannelsWidget, OptimizingWidget, BestSellersWidget, CustomerStoriesWidget, PotentialInfluencersWidget],
    templateUrl: './salesdashboard.html',
    host: {
        class: 'grid grid-cols-12 gap-8 mb-4'
    }
})
export class SalesDashboard { }
