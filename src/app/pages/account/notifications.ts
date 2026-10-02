import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { UserRole } from '@/app/pages/hr/role-context.service';
import { NotificationDto, NotificationsApiService } from './notifications-api.service';
import { NotificationsStateService } from './notifications-state.service';

interface NotificationItem {
    id: string;
    backendId?: string;
    roles: UserRole[];
    title: string;
    detail: string;
    date: string;
    icon: string;
    route: string[];
    severity: 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';
    category: string;
    read: boolean;
}

type NotificationSeverity = NotificationItem['severity'];

@Component({
    selector: 'app-account-notifications',
    standalone: true,
    imports: [CommonModule, ButtonModule, TagModule, TooltipModule],
    template: `
        <section class="p-5 bg-surface-0 dark:bg-surface-900 border border-surface rounded-lg">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
                <div>
                    <h1 class="text-2xl font-semibold m-0">Notificaciones</h1>
                    <p class="text-muted-color mt-2 mb-0">Avisos importantes de vacaciones y asistencia.</p>
                </div>
                <div class="flex items-center gap-2">
                    <p-tag [value]="unreadCount() + ' sin leer'" [severity]="unreadCount() > 0 ? 'warn' : 'success'" />
                    <p-button label="Marcar todas" icon="pi pi-check" severity="secondary" [outlined]="true" [loading]="loading" [disabled]="unreadCount() === 0" (onClick)="markAllAsRead()" />
                </div>
            </div>

            @if (errorMessage) {
                <div class="mb-4 p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                    {{ errorMessage }}
                </div>
            }

            <div class="flex flex-col">
                @for (notification of notifications(); track notification.id) {
                    <div
                        class="grid grid-cols-12 gap-3 items-center py-4 border-t border-surface first:border-t-0"
                        [ngClass]="{ 'bg-primary-50/60 dark:bg-primary-400/5 -mx-3 px-3 rounded-lg': !notification.read }"
                    >
                        <div class="col-span-12 md:col-span-7 flex items-center gap-3">
                            <span class="w-10 h-10 rounded-lg flex items-center justify-center bg-surface-100 text-primary dark:bg-surface-800">
                                <i [class]="notification.icon"></i>
                            </span>
                            <div>
                                <div class="flex flex-wrap items-center gap-2">
                                    <span class="font-semibold">{{ notification.title }}</span>
                                    @if (!notification.read) {
                                        <span class="w-2 h-2 rounded-full bg-primary"></span>
                                    }
                                </div>
                                <p class="text-sm text-muted-color mb-0 mt-1">{{ notification.detail }}</p>
                            </div>
                        </div>
                        <div class="col-span-6 md:col-span-2">
                            <p-tag [value]="notification.category" [severity]="notification.severity" />
                        </div>
                        <div class="col-span-6 md:col-span-1 text-sm text-muted-color text-right md:text-left">
                            {{ notification.date }}
                        </div>
                        <div class="col-span-12 md:col-span-2 flex flex-wrap justify-end gap-2">
                            @if (!notification.read) {
                                <p-button icon="pi pi-check" [rounded]="true" [outlined]="true" severity="secondary" pTooltip="Marcar como leída" (onClick)="markAsRead(notification)" />
                            } @else {
                                <p-button icon="pi pi-circle" [rounded]="true" [outlined]="true" severity="secondary" pTooltip="Marcar como no leída" (onClick)="markAsUnread(notification)" />
                            }
                            <p-button label="Abrir" icon="pi pi-arrow-right" iconPos="right" (onClick)="openNotification(notification)" />
                        </div>
                    </div>
                } @empty {
                    <div class="py-6 text-center text-muted-color">No hay notificaciones para tu perfil.</div>
                }
            </div>
        </section>
    `
})
export class AccountNotifications implements OnInit {
    private readonly notificationsApi = inject(NotificationsApiService);
    private readonly notificationsState = inject(NotificationsStateService);
    private readonly router = inject(Router);
    private readonly cdr = inject(ChangeDetectorRef);

    readonly backendNotifications = signal<NotificationItem[]>([]);

    loading = false;

    errorMessage = '';

    readonly notifications = computed(() => {
        return this.backendNotifications();
    });

    readonly unreadCount = computed(() => this.notifications().filter((notification) => !notification.read).length);

    ngOnInit() {
        this.loadNotifications();
    }

    loadNotifications() {
        this.loading = true;
        this.errorMessage = '';

        this.notificationsApi
            .getNotifications()
            .pipe(
                finalize(() => {
                    this.loading = false;
                    this.cdr.detectChanges();
                })
            )
            .subscribe({
                next: (response) => {
                    this.backendNotifications.set(response.data.data.map((notification) => this.mapNotification(notification)));
                    this.notificationsState.setUnreadCount(response.data.meta.noLeidasCount ?? this.unreadCount());
                },
                error: () => {
                    this.backendNotifications.set([]);
                    this.errorMessage = 'No pude cargar las notificaciones. Revisa que el backend y MongoDB estén encendidos.';
                }
            });
    }

    markAsRead(notification: NotificationItem) {
        if (notification.read) return;
        if (!notification.backendId) return;

        this.notificationsApi.markAsRead(notification.backendId).subscribe({
            next: () => {
                this.markBackendNotificationAsRead(notification.id);
                this.notificationsState.decreaseUnreadCount();
            },
            error: () => {
                this.markBackendNotificationAsRead(notification.id);
                this.notificationsState.decreaseUnreadCount();
            }
        });
    }

    markAsUnread(notification: NotificationItem) {
        if (!notification.read) return;
        if (!notification.backendId) return;

        this.notificationsApi.markAsUnread(notification.backendId).subscribe({
            next: () => {
                this.markBackendNotificationAsUnread(notification.id);
                this.notificationsState.increaseUnreadCount();
            },
            error: () => {
                this.markBackendNotificationAsUnread(notification.id);
                this.notificationsState.increaseUnreadCount();
            }
        });
    }

    openNotification(notification: NotificationItem) {
        const navigate = () => void this.router.navigate(notification.route);

        if (notification.read || !notification.backendId) {
            navigate();
            return;
        }

        this.notificationsApi.markAsRead(notification.backendId).subscribe({
            next: () => {
                this.markBackendNotificationAsRead(notification.id);
                this.notificationsState.decreaseUnreadCount();
                navigate();
            },
            error: () => {
                this.markBackendNotificationAsRead(notification.id);
                this.notificationsState.decreaseUnreadCount();
                navigate();
            }
        });
    }

    markAllAsRead() {
        this.loading = true;
        this.notificationsApi
            .markAllAsRead()
            .pipe(
                finalize(() => {
                    this.loading = false;
                    this.cdr.detectChanges();
                })
            )
            .subscribe({
                next: () => {
                    this.backendNotifications.update((notifications) => notifications.map((notification) => ({ ...notification, read: true })));
                    this.notificationsState.clearUnreadCount();
                },
                error: () => {
                    this.backendNotifications.update((notifications) => notifications.map((notification) => ({ ...notification, read: true })));
                    this.notificationsState.clearUnreadCount();
                }
            });
    }

    private mapNotification(notification: NotificationDto): NotificationItem {
        return {
            id: notification._id,
            backendId: notification._id,
            roles: ['employee', 'manager', 'admin'],
            title: notification.titulo,
            detail: notification.mensaje,
            date: this.formatDate(notification.creationDateTS || notification.fecha),
            icon: this.getNotificationIcon(notification.tipo),
            route: [notification.link_accion || '/cuenta/notificaciones'],
            severity: this.getNotificationSeverity(notification.tipo),
            category: this.getNotificationCategory(notification.categoria),
            read: notification.leido
        };
    }

    private markBackendNotificationAsRead(id: string) {
        this.backendNotifications.update((notifications) => notifications.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)));
    }

    private markBackendNotificationAsUnread(id: string) {
        this.backendNotifications.update((notifications) => notifications.map((notification) => (notification.id === id ? { ...notification, read: false } : notification)));
    }

    private getNotificationIcon(type: NotificationDto['tipo']) {
        if (type === 'SUCCESS') return 'pi pi-check-circle';
        if (type === 'ERROR') return 'pi pi-times-circle';
        if (type === 'ELIMINAR') return 'pi pi-exclamation-triangle';
        return 'pi pi-info-circle';
    }

    private getNotificationSeverity(type: NotificationDto['tipo']): NotificationSeverity {
        if (type === 'SUCCESS') return 'success';
        if (type === 'ERROR') return 'danger';
        if (type === 'ELIMINAR') return 'warn';
        return 'info';
    }

    private getNotificationCategory(category: string) {
        if (category === 'SISTEMA') return 'Sistema';
        if (category === 'FISCAL') return 'Fiscal';
        return 'General';
    }

    private formatDate(value: number | string) {
        const date = typeof value === 'number' ? new Date(value) : new Date(value);
        if (Number.isNaN(date.getTime())) return '';

        return new Intl.DateTimeFormat('es-MX', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }

}
