import { Injectable, effect, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

export interface MenuItem {
    label?: string;
    icon?: string;
    routerLink?: any[];
    routerLinkActiveOptions?: any;
    fragment?: string;
    queryParamsHandling?: any;
    preserveFragment?: boolean;
    skipLocationChange?: boolean;
    replaceUrl?: boolean;
    state?: any;
    queryParams?: any;
}

export interface LayoutConfig {
    preset: string;
    primary: string;
    surface: string | undefined | null;
    darkTheme: boolean;
    menuMode: string;
    layoutTheme: string;
}

interface LayoutState {
    staticMenuInactive: boolean;
    overlayMenuActive: boolean;
    configSidebarVisible: boolean;
    mobileMenuActive: boolean;
    menuHoverActive: boolean;
    activePath: any;
}

@Injectable({
    providedIn: 'root'
})
export class LayoutService {
    layoutConfig = signal<LayoutConfig>({
        preset: 'Aura',
        primary: 'emerald',
        surface: null,
        darkTheme: true,
        menuMode: 'slim',
        layoutTheme: 'colorScheme'
    });

    layoutState = signal<LayoutState>({
        staticMenuInactive: false,
        overlayMenuActive: false,
        configSidebarVisible: false,
        mobileMenuActive: false,
        menuHoverActive: false,
        activePath: null
    });

    tabs = signal<MenuItem[]>([]);

    router = inject(Router);

    isDarkTheme = computed(() => this.layoutConfig().darkTheme);

    isSlim = computed(() => this.layoutConfig().menuMode === 'slim');

    isSlimPlus = computed(() => this.layoutConfig().menuMode === 'slim-plus');

    isOverlay = computed(() => this.layoutConfig().menuMode === 'overlay');

    hasOverlaySubmenu = computed(() => this.layoutConfig().menuMode === 'slim' || this.layoutConfig().menuMode === 'slim-plus' || this.layoutConfig().menuMode === 'horizontal');

    hasOpenOverlaySubmenu = computed(() => this.hasOverlaySubmenu() && this.layoutState().activePath !== null && this.layoutState().activePath !== '/');

    hasOpenOverlay = computed(() => this.layoutState().overlayMenuActive || this.hasOpenOverlaySubmenu());

    private initialized = false;

    constructor() {
        this.toggleDarkMode();

        effect(() => {
            const config = this.layoutConfig();

            if (!this.initialized || !config) {
                this.initialized = true;
                return;
            }

            this.handleDarkModeTransition(config);
        });
    }

    private handleDarkModeTransition(config: LayoutConfig): void {
        const supportsViewTransition = 'startViewTransition' in document;

        if (supportsViewTransition) {
            this.startViewTransition(config);
        } else {
            this.toggleDarkMode(config);
        }
    }

    private startViewTransition(config: LayoutConfig): void {
        document.startViewTransition(() => {
            this.toggleDarkMode(config);
        });
    }

    toggleDarkMode(config?: LayoutConfig): void {
        const _config = config || this.layoutConfig();
        if (_config.darkTheme) {
            document.documentElement.classList.add('app-dark');
        } else {
            document.documentElement.classList.remove('app-dark');
        }
    }

    toggleMenu() {
        if (this.isDesktop()) {
            if (this.layoutConfig().menuMode === 'static') {
                this.layoutState.update((prev) => ({ ...prev, staticMenuInactive: !prev.staticMenuInactive }));
            }

            if (this.layoutConfig().menuMode === 'overlay') {
                this.layoutState.update((prev) => ({ ...prev, overlayMenuActive: !prev.overlayMenuActive }));
            }
        } else {
            this.layoutState.update((prev) => ({ ...prev, mobileMenuActive: !prev.mobileMenuActive }));
        }
    }

    toggleConfigSidebar() {
        this.layoutState.update((prev) => ({
            ...prev,
            configSidebarVisible: !prev.configSidebarVisible
        }));
    }

    toggleTheme() {
        this.layoutConfig.update((prev) => ({
            ...prev,
            darkTheme: !prev.darkTheme
        }));
    }

    hideMobileMenu() {
        this.layoutState.update((prev) => ({
            ...prev,
            mobileMenuActive: false
        }));
    }

    changeMenuMode(mode: string) {
        this.layoutConfig.update((prev) => ({ ...prev, menuMode: mode }));
        this.layoutState.update((prev) => ({
            ...prev,
            staticMenuInactive: false,
            overlayMenuActive: false,
            mobileMenuActive: false,
            menuHoverActive: false
        }));

        if (this.isDesktop()) {
            this.layoutState.update((prev) => ({ ...prev, activePath: this.hasOverlaySubmenu() ? null : this.router.url }));
        }
    }

    openTab(tab: MenuItem) {
        const existingTab = this.tabs().find((t) => t.routerLink?.[0] === tab.routerLink?.[0]);
        if (!existingTab) {
            this.tabs.update((prev) => [...prev, tab]);
        }
        this.router.navigate(tab.routerLink || []);
    }

    closeTab(index: number) {
        const currentTabs = this.tabs();
        const closedTab = currentTabs[index];

        if (closedTab && this.router.isActive(closedTab.routerLink?.[0], { paths: 'subset', queryParams: 'subset', fragment: 'ignored', matrixParams: 'ignored' })) {
            if (currentTabs.length > 1) {
                if (index === currentTabs.length - 1) {
                    this.router.navigate(currentTabs[index - 1].routerLink || []);
                } else {
                    this.router.navigate(currentTabs[index + 1].routerLink || []);
                }
            } else {
                this.router.navigate(['/']);
            }
        }

        this.tabs.update((prev) => prev.filter((_, i) => i !== index));
    }

    isDesktop() {
        return window.innerWidth > 991;
    }
}
