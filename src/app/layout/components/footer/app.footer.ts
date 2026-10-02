import { Component, computed, inject } from '@angular/core';
import { LayoutService } from '@/app/layout/service/layout.service';

@Component({
    standalone: true,
    selector: '[app-footer]',
    templateUrl: './app.footer.html',
    host: {
        class: 'layout-footer'
    }
})
export class AppFooter {
    layoutService = inject(LayoutService);

    brandLogo = computed(() => (this.layoutService.isDarkTheme() ? '/layout/images/dapper-light.png' : '/layout/images/dapper-black.png'));
}
