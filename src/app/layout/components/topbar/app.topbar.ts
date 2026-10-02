import { Component, computed, ElementRef, inject, OnInit, viewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { LayoutService } from '@/app/layout/service/layout.service';
import { Ripple } from 'primeng/ripple';
import { ButtonModule } from 'primeng/button';
import { RoleContextService } from '@/app/pages/hr/role-context.service';
import { AuthService } from '@/app/services/auth.service';
import { Router } from '@angular/router';
import { NotificationsStateService } from '@/app/pages/account/notifications-state.service';

@Component({
    selector: '[app-topbar]',
    standalone: true,
    imports: [RouterModule, CommonModule, StyleClassModule, Ripple, ButtonModule],
    templateUrl: './app.topbar.html',
    host: {
        class: 'layout-topbar'
    }
})
export class AppTopbar implements OnInit {
    layoutService = inject(LayoutService);

    roleContext = inject(RoleContextService);

    auth = inject(AuthService);

    readonly notificationsState = inject(NotificationsStateService);

    private router = inject(Router);

    menuButton = viewChild<ElementRef>('menubutton');

    tabs = computed(() => this.layoutService.tabs());

    themeIcon = computed(() => (this.layoutService.isDarkTheme() ? 'pi pi-sun' : 'pi pi-moon'));

    brandLogo = computed(() => (this.layoutService.isDarkTheme() ? '/layout/images/dapper-light.png' : '/layout/images/dapper-black.png'));

    profileName = computed(() => this.auth.getDisplayName());

    profileInitials = computed(() =>
        this.profileName()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase())
            .join('') || 'U'
    );

    isAuthenticated = computed(() => this.auth.isAuthenticated());

    ngOnInit() {
        this.notificationsState.loadUnreadCount();
    }

    onMenuButtonClick() {
        this.layoutService.toggleMenu();
    }

    toggleTheme() {
        this.layoutService.toggleTheme();
    }

    // onConfigButtonClick() {
    //     this.layoutService.toggleConfigSidebar();
    // }

    removeTab(event: Event, index: number) {
        event.preventDefault();
        event.stopPropagation();
        this.layoutService.closeTab(index);
    }

    async signOut() {
        this.auth.logout();
        await this.router.navigate(['/auth/login']);
    }
}
