import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { LayoutService } from '@/app/layout/service/layout.service';
import { Ripple } from 'primeng/ripple';
import { InputText } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { RoleContextService, UserRole } from '@/app/pages/hr/role-context.service';

@Component({
    selector: '[app-topbar]',
    standalone: true,
    imports: [RouterModule, CommonModule, StyleClassModule, FormsModule, Ripple, InputText, ButtonModule, IconField, InputIcon, SelectModule],
    templateUrl: './app.topbar.html',
    host: {
        class: 'layout-topbar'
    }
})
export class AppTopbar {
    layoutService = inject(LayoutService);

    roleContext = inject(RoleContextService);

    searchInput = viewChild<ElementRef>('searchinput');

    menuButton = viewChild<ElementRef>('menubutton');

    searchActive = signal<boolean>(false);

    tabs = computed(() => this.layoutService.tabs());

    themeIcon = computed(() => (this.layoutService.isDarkTheme() ? 'pi pi-sun' : 'pi pi-moon'));

    get selectedRole(): UserRole {
        return this.roleContext.currentRole();
    }

    set selectedRole(role: UserRole) {
        this.roleContext.setRole(role);
    }

    logo = computed(() => {
        const path = '/layout/images/logo-';
        const logo = this.layoutService.isDarkTheme() || this.layoutService.layoutConfig().layoutTheme === 'primaryColor' ? 'light.png' : 'dark.png';
        return path + logo;
    });

    onMenuButtonClick() {
        this.layoutService.toggleMenu();
    }

    toggleTheme() {
        this.layoutService.toggleTheme();
    }

    activateSearch() {
        this.searchActive.set(true);
        setTimeout(() => {
            this.searchInput()?.nativeElement.focus();
        }, 100);
    }

    deactivateSearch() {
        this.searchActive.set(false);
    }

    // onConfigButtonClick() {
    //     this.layoutService.toggleConfigSidebar();
    // }

    removeTab(event: Event, index: number) {
        event.preventDefault();
        event.stopPropagation();
        this.layoutService.closeTab(index);
    }
}
