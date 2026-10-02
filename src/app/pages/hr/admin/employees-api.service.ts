import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { getAuthHeaders } from '@/app/services/auth-headers';
import { environment } from '@/environments/environment';

export type EmployeeRole = 'Empleado' | 'Jefe/Director' | 'Administrador';
export type EmployeeStatus = 'ACTIVO' | 'INACTIVO';

export interface EmployeeDto {
    _id?: string;
    uid?: string;
    employeeNumber?: string;
    name: string;
    email?: string;
    password?: string;
    department: string;
    hireDate: string;
    role: EmployeeRole;
    managerId?: string;
    managerName?: string;
    status: EmployeeStatus;
    creationDateTS?: number;
    updateDateTS?: number;
}

export interface EmployeesPage {
    data: EmployeeDto[];
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
export class EmployeesApiService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiBaseUrl}/employees`;

    getEmployees(filters: { page?: number; limit?: number; search?: string; status?: EmployeeStatus } = {}): Observable<ApiResponse<EmployeesPage>> {
        let params = new HttpParams()
            .set('page', String(filters.page || 1))
            .set('limit', String(filters.limit || 10));

        if (filters.search) {
            params = params.set('search', filters.search);
        }

        if (filters.status) {
            params = params.set('status', filters.status);
        }

        return this.http.get<ApiResponse<EmployeesPage>>(`${this.baseUrl}/get-all`, {
            params,
            headers: getAuthHeaders()
        });
    }

    createEmployee(employee: EmployeeDto): Observable<ApiResponse<string>> {
        return this.http.post<ApiResponse<string>>(`${this.baseUrl}/create`, employee, {
            headers: getAuthHeaders()
        });
    }

    updateEmployee(id: string, employee: Partial<EmployeeDto>): Observable<ApiResponse<boolean>> {
        return this.http.put<ApiResponse<boolean>>(`${this.baseUrl}/update/${id}`, employee, {
            headers: getAuthHeaders()
        });
    }

    deleteEmployee(id: string): Observable<ApiResponse<boolean>> {
        return this.http.delete<ApiResponse<boolean>>(`${this.baseUrl}/delete/${id}`, {
            headers: getAuthHeaders()
        });
    }
}
