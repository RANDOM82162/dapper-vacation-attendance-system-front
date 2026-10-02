import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { getAuthHeaders } from '@/app/services/auth-headers';
import { environment } from '@/environments/environment';

export interface VacationBalanceDto {
    _id?: string;
    employeeId?: string;
    employeeName: string;
    department: string;
    hireDate?: string;
    year: number;
    serviceYears?: number;
    legalDays?: number;
    periodStartDate?: string;
    periodEndDate?: string;
    initialDays: number;
    usedDays: number;
    availableDays: number;
    lastMove?: string;
    movements?: string[];
    creationDateTS?: number;
    updateDateTS?: number;
}

export interface VacationBalancesPage {
    data: VacationBalanceDto[];
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
export class VacationBalancesApiService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiBaseUrl}/vacation-balances`;

    getBalances(filters: { employeeId?: string; employeeName?: string; year?: number; referenceDate?: string; page?: number; limit?: number } = {}): Observable<ApiResponse<VacationBalancesPage>> {
        let params = new HttpParams()
            .set('page', String(filters.page || 1))
            .set('limit', String(filters.limit || 100));

        if (filters.employeeId) params = params.set('employeeId', filters.employeeId);
        if (filters.employeeName) params = params.set('employeeName', filters.employeeName);
        if (filters.year) params = params.set('year', String(filters.year));
        if (filters.referenceDate) params = params.set('referenceDate', filters.referenceDate);

        return this.http.get<ApiResponse<VacationBalancesPage>>(`${this.baseUrl}/get-all`, {
            params,
            headers: getAuthHeaders()
        });
    }

    createBalance(balance: VacationBalanceDto): Observable<ApiResponse<string>> {
        return this.http.post<ApiResponse<string>>(`${this.baseUrl}/create`, balance, {
            headers: getAuthHeaders()
        });
    }

    updateBalance(id: string, balance: Partial<VacationBalanceDto>): Observable<ApiResponse<boolean>> {
        return this.http.put<ApiResponse<boolean>>(`${this.baseUrl}/update/${id}`, balance, {
            headers: getAuthHeaders()
        });
    }

    deleteBalance(id: string): Observable<ApiResponse<boolean>> {
        return this.http.delete<ApiResponse<boolean>>(`${this.baseUrl}/delete/${id}`, {
            headers: getAuthHeaders()
        });
    }
}
