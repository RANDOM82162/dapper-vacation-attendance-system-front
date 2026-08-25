import { Injectable, computed, signal } from '@angular/core';

export type VacationStatus = 'Borrador' | 'Pendiente' | 'Aprobada' | 'Rechazada' | 'Cambios solicitados';
export type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

export interface VacationRequest {
    id: string;
    employee: string;
    department: string;
    manager: string;
    startDate: string;
    endDate: string;
    days: number;
    comments: string;
    status: VacationStatus;
    updatedAt: string;
    history: string[];
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
    manager: string;
    comments: string;
}

@Injectable({
    providedIn: 'root'
})
export class VacationWorkflowService {
    private readonly currentEmployee = 'Jose Alejandro Paz';

    readonly requests = signal<VacationRequest[]>([
        {
            id: 'VAC-001',
            employee: 'Jose Alejandro Paz',
            department: 'Desarrollo',
            manager: 'Mariana Torres',
            startDate: '2026-09-07',
            endDate: '2026-09-11',
            days: 5,
            comments: 'Solicito estos dias para descanso programado.',
            status: 'Pendiente',
            updatedAt: 'Enviada hoy',
            history: ['Solicitud creada por Jose Alejandro Paz.', 'Solicitud enviada a Mariana Torres.']
        },
        {
            id: 'VAC-002',
            employee: 'Jose Alejandro Paz',
            department: 'Desarrollo',
            manager: 'Mariana Torres',
            startDate: '2026-07-15',
            endDate: '2026-07-16',
            days: 2,
            comments: 'Permiso aprobado previamente por direccion.',
            status: 'Aprobada',
            updatedAt: 'Aprobada por direccion',
            history: ['Solicitud creada.', 'Solicitud aprobada por Mariana Torres.', 'Saldo actualizado: -2 dias.']
        },
        {
            id: 'VAC-003',
            employee: 'Daniela Ruiz',
            department: 'Diseno',
            manager: 'Mariana Torres',
            startDate: '2026-09-14',
            endDate: '2026-09-18',
            days: 5,
            comments: 'Vacaciones familiares programadas.',
            status: 'Pendiente',
            updatedAt: 'Pendiente desde ayer',
            history: ['Solicitud creada por Daniela Ruiz.', 'Solicitud enviada a Mariana Torres.']
        },
        {
            id: 'VAC-004',
            employee: 'Carlos Mendez',
            department: 'Soporte',
            manager: 'Mariana Torres',
            startDate: '2026-09-21',
            endDate: '2026-09-25',
            days: 5,
            comments: 'Requiere revision por saldo insuficiente.',
            status: 'Pendiente',
            updatedAt: 'Pendiente desde ayer',
            history: ['Solicitud creada por Carlos Mendez.', 'Validacion detecto saldo insuficiente.']
        }
    ]);

    readonly balances = signal<VacationBalanceRecord[]>([
        { employee: 'Jose Alejandro Paz', department: 'Desarrollo', initial: 14, used: 2, available: 12, lastMove: 'Solicitud aprobada el 16 jul.' },
        { employee: 'Daniela Ruiz', department: 'Diseno', initial: 10, used: 5, available: 5, lastMove: 'Carga inicial validada' },
        { employee: 'Carlos Mendez', department: 'Soporte', initial: 8, used: 5, available: 3, lastMove: 'Ajuste manual de RH' }
    ]);

    readonly myRequests = computed(() => this.requests().filter((request) => request.employee === this.currentEmployee));

    readonly pendingApprovals = computed(() => this.requests().filter((request) => request.status === 'Pendiente' || request.status === 'Cambios solicitados'));

    readonly currentEmployeeBalance = computed(() => this.getBalance(this.currentEmployee));

    createRequest(draft: VacationDraft, status: VacationStatus = 'Pendiente') {
        const nextId = `VAC-${(this.requests().length + 1).toString().padStart(3, '0')}`;
        const request: VacationRequest = {
            id: nextId,
            employee: this.currentEmployee,
            department: 'Desarrollo',
            manager: draft.manager,
            startDate: draft.startDate,
            endDate: draft.endDate,
            days: Number(draft.days),
            comments: draft.comments,
            status,
            updatedAt: status === 'Borrador' ? 'Guardada como borrador' : 'Enviada hoy',
            history: status === 'Borrador' ? ['Borrador guardado por el empleado.'] : ['Solicitud creada por el empleado.', `Solicitud enviada a ${draft.manager}.`]
        };

        this.requests.update((requests) => [request, ...requests]);
        return request;
    }

    approveRequest(id: string, comment = '') {
        const request = this.requests().find((item) => item.id === id);
        if (!request || request.status === 'Aprobada') return false;

        const balance = this.getBalance(request.employee);
        if (!balance || balance.available < request.days) {
            this.changeStatus(id, 'Rechazada', 'Rechazada automaticamente por saldo insuficiente.');
            return false;
        }

        const reviewerComment = comment.trim() ? `Comentario: ${comment.trim()}` : 'Sin comentarios adicionales.';

        this.requests.update((requests) =>
            requests.map((item) =>
                item.id === id
                    ? {
                          ...item,
                          status: 'Aprobada',
                          updatedAt: 'Aprobada por jefe/director',
                          history: [...item.history, 'Solicitud aprobada por jefe/director.', reviewerComment, `Saldo actualizado: -${item.days} dias.`]
                      }
                    : item
            )
        );

        this.balances.update((balances) =>
            balances.map((item) =>
                item.employee === request.employee
                    ? {
                          ...item,
                          used: item.used + request.days,
                          available: item.available - request.days,
                          lastMove: `Solicitud ${request.id} aprobada`
                      }
                    : item
            )
        );

        return true;
    }

    rejectRequest(id: string, comment = '') {
        const reviewerComment = comment.trim() ? ` Motivo: ${comment.trim()}` : '';
        this.changeStatus(id, 'Rechazada', `Solicitud rechazada por jefe/director.${reviewerComment}`);
    }

    requestChanges(id: string, comment = '') {
        const reviewerComment = comment.trim() ? ` Detalle: ${comment.trim()}` : '';
        this.changeStatus(id, 'Cambios solicitados', `Jefe/director solicito cambios en fechas o comentarios.${reviewerComment}`);
    }

    getSeverity(status: VacationStatus): TagSeverity {
        switch (status) {
            case 'Aprobada':
                return 'success';
            case 'Pendiente':
            case 'Cambios solicitados':
                return 'warn';
            case 'Rechazada':
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

    canApprove(request: VacationRequest) {
        const balance = this.getBalance(request.employee);
        return Boolean(balance && balance.available >= request.days);
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

    private formatDate(value: string) {
        const date = new Date(`${value}T00:00:00`);
        return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
    }
}
