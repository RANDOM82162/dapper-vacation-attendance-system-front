import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@/environments/environment';
import { getAuthHeaders } from '@/app/services/auth-headers';

export interface NotificationDto {
    _id: string;
    usuario_id: string;
    titulo: string;
    mensaje: string;
    tipo: 'INFO' | 'ELIMINAR' | 'SUCCESS' | 'ERROR';
    categoria: string;
    leido: boolean;
    fecha: string;
    link_accion?: string;
    creationDateTS: number;
}

export interface NotificationsPage {
    data: NotificationDto[];
    meta: {
        totalItems: number;
        totalPages: number;
        currentPage: number;
        itemsPerPage: number;
        noLeidasCount: number;
    };
}

interface ApiResponse<T> {
    status: number;
    message: string;
    data: T;
}

@Injectable({ providedIn: 'root' })
export class NotificationsApiService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiBaseUrl}/notificaciones`;

    getNotifications(filters: { page?: number; limit?: number; onlyUnread?: boolean } = {}): Observable<ApiResponse<NotificationsPage>> {
        let params = new HttpParams()
            .set('page', String(filters.page || 1))
            .set('limit', String(filters.limit || 50));

        if (filters.onlyUnread) params = params.set('soloNoLeidas', 'true');

        return this.http.get<ApiResponse<NotificationsPage>>(this.baseUrl, {
            params,
            headers: getAuthHeaders()
        });
    }

    markAsRead(id: string): Observable<ApiResponse<boolean>> {
        return this.http.patch<ApiResponse<boolean>>(`${this.baseUrl}/marcar-leida/${id}`, {}, {
            headers: getAuthHeaders()
        });
    }

    markAsUnread(id: string): Observable<ApiResponse<boolean>> {
        return this.http.patch<ApiResponse<boolean>>(`${this.baseUrl}/marcar-no-leida/${id}`, {}, {
            headers: getAuthHeaders()
        });
    }

    markAllAsRead(): Observable<ApiResponse<number>> {
        return this.http.patch<ApiResponse<number>>(`${this.baseUrl}/marcar-todas-leidas`, {}, {
            headers: getAuthHeaders()
        });
    }
}
