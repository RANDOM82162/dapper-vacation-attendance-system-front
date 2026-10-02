import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { VacationHistoryEntry, VacationStatus } from './vacation-workflow.service';
import { getAuthHeaders } from '@/app/services/auth-headers';
import { environment } from '@/environments/environment';

export interface VacationRequestDto {
    _id?: string;
    folio: string;
    employeeId?: string;
    employeeName: string;
    department: string;
    managerId?: string;
    managerName?: string;
    startDate: string;
    endDate: string;
    days: number;
    paidDays?: number;
    unpaidDays?: number;
    comments?: string;
    managerComment?: string;
    status: VacationStatus;
    updatedAt: string;
    history: VacationHistoryEntry[];
    creationDateTS?: number;
    updateDateTS?: number;
}

export interface CreateVacationRequestDto {
    employeeId?: string;
    employeeName: string;
    department: string;
    managerId?: string;
    managerName?: string;
    startDate: string;
    endDate: string;
    days?: number;
    comments?: string;
}

export interface UpdateVacationRequestDto {
    startDate?: string;
    endDate?: string;
    days?: number;
    comments?: string;
    managerComment?: string;
}

export interface VacationRequestsPage {
    data: VacationRequestDto[];
    meta: {
        totalItems: number;
        totalPages: number;
        currentPage: number;
        itemsPerPage: number;
    };
}

interface ApiResponse<T> {
    status: number;
    message: string;
    data: T;
}

@Injectable({ providedIn: 'root' })
export class VacationRequestsApiService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiBaseUrl}/vacation-requests`;

    getMyRequests(filters: { employeeName: string; page?: number; limit?: number }): Observable<ApiResponse<VacationRequestsPage>> {
        const params = new HttpParams()
            .set('employeeName', filters.employeeName)
            .set('page', String(filters.page || 1))
            .set('limit', String(filters.limit || 10));

        return this.http.get<ApiResponse<VacationRequestsPage>>(`${this.baseUrl}/get-all`, {
            params,
            headers: getAuthHeaders()
        });
    }

    getRequests(filters: { page?: number; limit?: number; status?: VacationStatus; search?: string } = {}): Observable<ApiResponse<VacationRequestsPage>> {
        let params = new HttpParams()
            .set('page', String(filters.page || 1))
            .set('limit', String(filters.limit || 100));

        if (filters.status) {
            params = params.set('status', filters.status);
        }

        if (filters.search) {
            params = params.set('search', filters.search);
        }

        return this.http.get<ApiResponse<VacationRequestsPage>>(`${this.baseUrl}/get-all`, {
            params,
            headers: getAuthHeaders()
        });
    }

    createRequest(request: CreateVacationRequestDto): Observable<ApiResponse<string>> {
        return this.http.post<ApiResponse<string>>(`${this.baseUrl}/create`, request, {
            headers: getAuthHeaders()
        });
    }

    updateRequest(id: string, request: UpdateVacationRequestDto): Observable<ApiResponse<boolean>> {
        return this.http.put<ApiResponse<boolean>>(`${this.baseUrl}/update/${id}`, request, {
            headers: getAuthHeaders()
        });
    }

    approveRequest(id: string, comment: string): Observable<ApiResponse<boolean>> {
        return this.http.put<ApiResponse<boolean>>(`${this.baseUrl}/approve/${id}`, { comment }, {
            headers: getAuthHeaders()
        });
    }

    rejectRequest(id: string, comment: string): Observable<ApiResponse<boolean>> {
        return this.http.put<ApiResponse<boolean>>(`${this.baseUrl}/reject/${id}`, { comment }, {
            headers: getAuthHeaders()
        });
    }

    requestChanges(id: string, comment: string): Observable<ApiResponse<boolean>> {
        return this.http.put<ApiResponse<boolean>>(`${this.baseUrl}/request-changes/${id}`, { comment }, {
            headers: getAuthHeaders()
        });
    }
}
