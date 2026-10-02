import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { AuthService } from '@/app/services/auth.service';
import { MyRequests } from './my-requests';
import { VacationBalancesApiService, VacationBalancesPage } from './vacation-balances-api.service';
import { VacationRequestsApiService, VacationRequestsPage } from './vacation-requests-api.service';
import { VacationWorkflowService } from './vacation-workflow.service';

describe('MyRequests', () => {
    it('shows a new request and its history after the API responds', () => {
        const requestsResponse = new Subject<{ status: number; message: string; data: VacationRequestsPage }>();
        const balancesResponse = new Subject<{ status: number; message: string; data: VacationBalancesPage }>();

        TestBed.configureTestingModule({
            imports: [MyRequests],
            providers: [
                { provide: AuthService, useValue: { getEmployeeName: () => 'Dani' } },
                { provide: VacationWorkflowService, useValue: { getSeverity: () => 'warn' } },
                { provide: VacationRequestsApiService, useValue: { getMyRequests: () => requestsResponse.asObservable() } },
                { provide: VacationBalancesApiService, useValue: { getBalances: () => balancesResponse.asObservable() } }
            ]
        });

        const fixture = TestBed.createComponent(MyRequests);
        fixture.detectChanges();

        requestsResponse.next({
            status: 200,
            message: 'Solicitudes obtenidas',
            data: {
                data: [{
                    _id: 'request-id',
                    folio: 'VAC-001',
                    employeeName: 'Dani',
                    department: 'Desarrollo',
                    startDate: '2026-10-05',
                    endDate: '2026-10-07',
                    days: 3,
                    status: 'Pendiente',
                    updatedAt: 'Solicitud enviada',
                    history: [
                        { message: 'Solicitud creada por Dani.', timestamp: 1791200000000 },
                        { message: 'Solicitud enviada para revisión.', timestamp: 1791200000000 }
                    ]
                }],
                meta: { totalItems: 1, totalPages: 1, currentPage: 1, itemsPerPage: 100 }
            }
        });
        requestsResponse.complete();
        fixture.detectChanges();

        const table = fixture.nativeElement.querySelector('p-table') as HTMLElement;
        const history = fixture.nativeElement.querySelector('app-vacation-history-timeline') as HTMLElement;

        expect(table.textContent).toContain('VAC-001');
        expect(table.querySelector('.p-datatable-loading-overlay')).toBeNull();
        expect(history.querySelectorAll('li').length).toBe(2);
    });
});
