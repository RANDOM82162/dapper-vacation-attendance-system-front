import { Component, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppTopbar } from '@/app/layout/components/topbar/app.topbar';
import { AppFooter } from '@/app/layout/components/footer/app.footer';
import { LayoutService } from '@/app/layout/service/layout.service';
import { AppConfigurator } from '@/app/layout/components/configurator/app.configurator';
import { AppBreadcrumb } from '@/app/layout/components/breadcrumb/app.breadcrumb';
import { AppSidebar } from '@/app/layout/components/sidebar/app.sidebar';

@Component({
    selector: 'app-layout',
    standalone: true,
    imports: [CommonModule, AppTopbar, AppSidebar, RouterModule, AppFooter, AppConfigurator, AppBreadcrumb],
    templateUrl: './app.layout.html'
})
export class AppLayout {
    layoutService = inject(LayoutService);

    constructor() {
        effect(() => {
            const state = this.layoutService.layoutState();
            if (state.mobileMenuActive || state.overlayMenuActive) {
                document.body.classList.add('blocked-scroll');
            } else {
                document.body.classList.remove('blocked-scroll');
            }
        });
    }

    containerClass = computed(() => {
        const layoutConfig = this.layoutService.layoutConfig();
        const layoutState = this.layoutService.layoutState();

        return {
            'layout-slim': layoutConfig.menuMode === 'slim',
            'layout-slim-plus': layoutConfig.menuMode === 'slim-plus',
            'layout-static': layoutConfig.menuMode === 'static',
            'layout-overlay': layoutConfig.menuMode === 'overlay',
            'layout-overlay-active': layoutState.overlayMenuActive,
            'layout-mobile-active': layoutState.mobileMenuActive,
            'layout-static-inactive': layoutState.staticMenuInactive && layoutConfig.menuMode === 'static',
            'layout-light': layoutConfig.layoutTheme === 'colorScheme' && !layoutConfig.darkTheme,
            'layout-dark': layoutConfig.layoutTheme === 'colorScheme' && layoutConfig.darkTheme,
            'layout-primary': !layoutConfig.darkTheme && layoutConfig.layoutTheme === 'primaryColor'
        };
    });
}
