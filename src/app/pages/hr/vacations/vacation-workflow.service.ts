import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthService } from '@/app/services/auth.service';

export type VacationStatus = 'Pendiente' | 'Aprobada' | 'Rechazada' | 'Cambios solicitados' | 'Cancelada';
export type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

export interface VacationHistoryEvent {
    message: string;
    timestamp: number;
}

export type VacationHistoryEntry = string | VacationHistoryEvent;

export interface VacationRequest {
    backendId?: string;
    id: string;
    employee: string;
    department: string;
    manager?: string;
    startDate: string;
    endDate: string;
    days: number;
    paidDays?: number;
    unpaidDays?: number;
    comments: string;
    managerComment?: string;
    status: VacationStatus;
    updatedAt: string;
    history: VacationHistoryEntry[];
}

export interface VacationBalanceRecord {
    employee: string;
    department: string;
    initial: number;
    used: number;
    available: number;
    lastMove: string;
}

export interface VacationDraft {
    startDate: string;
    endDate: string;
    days: number;
    comments: string;
}

@Injectable({
    providedIn: 'root'
})
export class VacationWorkflowService {
    private readonly auth = inject(AuthService);

    readonly requests = signal<VacationRequest[]>([]);

    readonly balances = signal<VacationBalanceRecord[]>([]);

    readonly myRequests = computed(() => this.requests().filter((request) => request.employee === this.auth.getEmployeeName()));

    readonly pendingApprovals = computed(() => this.requests().filter((request) => request.status === 'Pendiente' || request.status === 'Cambios solicitados'));

    readonly currentEmployeeBalance = computed(() => this.getBalance(this.auth.getEmployeeName()));

    createRequest(draft: VacationDraft, status: VacationStatus = 'Pendiente') {
        const nextId = `VAC-${(this.requests().length + 1).toString().padStart(3, '0')}`;
        const days = Number(draft.days);
        const balance = this.getBalance(this.auth.getEmployeeName());
        const paidDays = Math.min(Math.max(balance?.available ?? 0, 0), days);
        const unpaidDays = Math.max(days - paidDays, 0);
        const request: VacationRequest = {
            id: nextId,
            employee: this.auth.getEmployeeName(),
            department: this.auth.getEmployeeDepartment(),
            startDate: draft.startDate,
            endDate: draft.endDate,
            days,
            paidDays,
            unpaidDays,
            comments: draft.comments,
            status,
            updatedAt: 'Enviada hoy',
            history: [
                'Solicitud creada por el empleado.',
                ...(unpaidDays > 0 ? [`Se estiman ${unpaidDays} día(s) sin goce de sueldo por exceder el saldo disponible.`] : []),
                'Solicitud enviada para revisión.'
            ]
        };

        this.requests.update((requests) => [request, ...requests]);
        return request;
    }

    approveRequest(id: string, comment = '') {
        const request = this.requests().find((item) => item.id === id);
        if (!request || request.status === 'Aprobada') return false;
        const reviewerName = this.getReviewerName();
        const balance = this.getBalance(request.employee);
        const paidDays = Math.min(Math.max(balance?.available ?? 0, 0), request.days);
        const unpaidDays = Math.max(request.days - paidDays, 0);

        const reviewerComment = comment.trim() ? `Comentario: ${comment.trim()}` : 'Sin comentarios adicionales.';

        this.requests.update((requests) =>
            requests.map((item) =>
                item.id === id
                    ? {
                          ...item,
                          status: 'Aprobada',
                          paidDays,
                          unpaidDays,
                          updatedAt: `Aprobada por ${reviewerName}`,
                          history: [...item.history, `Solicitud aprobada por ${reviewerName}.`, reviewerComment, `${paidDays} día(s) con goce y ${unpaidDays} sin goce de sueldo.`, `Saldo actualizado: -${paidDays} días.`]
                      }
                    : item
            )
        );

        this.balances.update((balances) =>
            balances.map((item) =>
                item.employee === request.employee
                    ? {
                          ...item,
                          used: item.used + paidDays,
                          available: item.available - paidDays,
                          lastMove: `Solicitud ${request.id} aprobada`
                      }
                    : item
            )
        );

        return true;
    }

    rejectRequest(id: string, comment = '') {
        const reviewerComment = comment.trim() ? ` Motivo: ${comment.trim()}` : '';
        this.changeStatus(id, 'Rechazada', `Solicitud rechazada por ${this.getReviewerName()}.${reviewerComment}`);
    }

    requestChanges(id: string, comment = '') {
        const reviewerComment = comment.trim() ? ` Detalle: ${comment.trim()}` : '';
        this.changeStatus(id, 'Cambios solicitados', `${this.getReviewerName()} solicito cambios en fechas o comentarios.${reviewerComment}`);
    }

    getSeverity(status: VacationStatus): TagSeverity {
        switch (status) {
            case 'Aprobada':
                return 'success';
            case 'Pendiente':
            case 'Cambios solicitados':
                return 'warn';
            case 'Rechazada':
            case 'Cancelada':
                return 'danger';
            default:
                return 'secondary';
        }
    }

    formatPeriod(request: VacationRequest) {
        return `${this.formatDate(request.startDate)} - ${this.formatDate(request.endDate)}`;
    }

    getBalance(employee: string) {
        return this.balances().find((balance) => balance.employee === employee);
    }

    getRequestsByEmployee(employee: string) {
        return this.requests().filter((request) => request.employee === employee);
    }

    getTakenVacationRequests(employee: string) {
        return this.getRequestsByEmployee(employee).filter((request) => request.status === 'Aprobada');
    }

    canApprove(request: VacationRequest) {
        return request.days > 0;
    }

    private changeStatus(id: string, status: VacationStatus, historyEntry: string) {
        this.requests.update((requests) =>
            requests.map((request) =>
                request.id === id
                    ? {
                          ...request,
                          status,
                          updatedAt: historyEntry,
                          history: [...request.history, historyEntry]
                      }
                    : request
            )
        );
    }

    private getReviewerName() {
        return this.auth.getDisplayName() || this.auth.session()?.email || 'jefe/director';
    }

    private formatDate(value: string) {
        const date = new Date(`${value}T00:00:00`);
        return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
    }
}
