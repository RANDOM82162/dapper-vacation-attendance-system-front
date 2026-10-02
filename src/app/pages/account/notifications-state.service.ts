import { computed, inject, Injectable, signal } from '@angular/core';
import { NotificationsApiService } from './notifications-api.service';

@Injectable({ providedIn: 'root' })
export class NotificationsStateService {
    private readonly notificationsApi = inject(NotificationsApiService);

    readonly unreadCount = signal(0);
    readonly unreadBadge = computed(() => {
        const count = this.unreadCount();
        return count > 99 ? '99+' : String(count);
    });

    loadUnreadCount() {
        this.notificationsApi.getNotifications({ page: 1, limit: 1 }).subscribe({
            next: (response) => this.unreadCount.set(response.data.meta.noLeidasCount || 0),
            error: () => this.unreadCount.set(0)
        });
    }

    setUnreadCount(count: number) {
        this.unreadCount.set(Math.max(0, count));
    }

    decreaseUnreadCount() {
        this.unreadCount.update((count) => Math.max(0, count - 1));
    }

    increaseUnreadCount() {
        this.unreadCount.update((count) => count + 1);
    }

    clearUnreadCount() {
        this.unreadCount.set(0);
    }
}
