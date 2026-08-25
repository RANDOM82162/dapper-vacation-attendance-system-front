import { Component } from '@angular/core';
import { StatsSaasWidget } from '../components/sass/statssaaswidget';
import { AcquisitionOverviewWidget } from '../components/sass/acquisitionoverviewwidget';
import { LatestCustomerWidget } from '../components/sass/latestcustomerwidget';
import { ProfileWidget } from '../components/sass/profilewidget';
import { TrialsLeadsWidget } from '../components/sass/trialsleadswidget';
import { LeadsByRoleWidget } from '../components/sass/leadsbyrolewidget';
import { RecentBlogPostWidget } from '../components/sass/recentblogpostwidget';
import { TimelineWidget } from '../components/sass/timelinewidget';
import { MonthlyRecurringWidget } from '../components/sass/monthlyrecurringwidget';

@Component({
    selector: 'app-saas-dashboard',
    standalone: true,
    imports: [StatsSaasWidget, AcquisitionOverviewWidget, LatestCustomerWidget, ProfileWidget, TrialsLeadsWidget, LeadsByRoleWidget, RecentBlogPostWidget, TimelineWidget, MonthlyRecurringWidget],
    templateUrl: './saasdashboard.html',
    host: {
        class: 'grid grid-cols-12 gap-8 mb-4'
    }
})
export class SaasDashboard { }
