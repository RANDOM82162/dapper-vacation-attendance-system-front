import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, computed, inject, OnInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { RoleContextService } from '../role-context.service';
import { VacationBalancesApiService, VacationBalanceDto } from '../vacations/vacation-balances-api.service';
import { VacationRequestsApiService, VacationRequestDto } from '../vacations/vacation-requests-api.service';
import { EmployeesApiService } from '../admin/employees-api.service';
import { AuthService } from '@/app/services/auth.service';
import { environment } from '@/environments/environment';
import { getAuthHeaders } from '@/app/services/auth-headers';

interface ApiResponse<T> {
    status: number;
    message: string;
    data: T;
}

interface AttendanceRecordDto {
    weekKey: string;
    weekLabel: string;
    weekEndDate: string;
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    lateCount: number;
    accumulatedLateCount: number;
    accumulatedSaturdayCount: number;
    observations: string;
}

interface AttendanceRecordsPage {
    data: AttendanceRecordDto[];
    meta: {
        totalItems: number;
        totalPages: number;
        currentPage: number;
        itemsPerPage: number;
    };
}

interface AttendanceStoredImportWeek {
    weekKey: string;
    weekLabel: string;
    status: 'GUARDADA' | 'OMITIDA';
}

interface AttendanceStoredImport {
    weeks?: AttendanceStoredImportWeek[];
}

interface AttendanceImportsPage {
    data: AttendanceStoredImport[];
    meta: {
        totalItems: number;
        totalPages: number;
        currentPage: number;
        itemsPerPage: number;
    };
}

interface ExpiringVacationBalance extends VacationBalanceDto {
    expiresOn: string;
}

@Component({
    selector: 'app-hr-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule, ButtonModule, TagModule],
    template: `
        <section class="flex flex-col gap-6">
            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <span class="text-sm text-muted-color">Dapper Technologies</span>
                    <h1 class="text-3xl font-semibold text-surface-950 dark:text-surface-0 m-0">{{ dashboard().title }}</h1>
                    <p class="text-muted-color mt-2 mb-0 max-w-3xl">{{ dashboard().subtitle }}</p>
                </div>
            </div>

            <div class="grid grid-cols-12 gap-4">
                @for (metric of dashboard().metrics; track metric.label) {
                    <article class="col-span-12 md:col-span-6 xl:col-span-3 p-5 bg-surface-0 dark:bg-surface-900 border border-surface rounded-lg">
                        <div class="flex items-start justify-between gap-3">
                            <div>
                                <span class="text-muted-color text-sm">{{ metric.label }}</span>
                                <div class="text-3xl font-semibold mt-2">{{ metric.value }}</div>
                            </div>
                            <span class="w-10 h-10 rounded-lg flex items-center justify-center bg-primary-50 text-primary-600 dark:bg-primary-400/10 dark:text-primary-300">
                                <i [class]="metric.icon"></i>
                            </span>
                        </div>
                        <p class="text-sm text-muted-color mt-4 mb-0">{{ metric.detail }}</p>
                    </article>
                }
            </div>

            @if (roleContext.currentRole() !== 'employee') {
                <section class="p-5 bg-surface-0 dark:bg-surface-900 border border-surface rounded-lg">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                        <div>
                            <h2 class="text-xl font-semibold m-0">Saldos por vencer</h2>
                            <p class="text-sm text-muted-color mt-1 mb-0">Vacaciones disponibles que vencen en los próximos dos meses.</p>
                        </div>
                        <a routerLink="/vacaciones/saldos" class="text-primary font-semibold no-underline">Ver saldos del equipo</a>
                    </div>
                    @if (expiringBalances.length) {
                        <div class="divide-y divide-surface">
                            @for (balance of expiringBalances; track balance._id || balance.employeeName) {
                                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 py-3">
                                    <div>
                                        <div class="font-semibold">{{ balance.employeeName }}</div>
                                        <div class="text-sm text-muted-color">{{ balance.department || 'Sin departamento' }}</div>
                                    </div>
                                    <div class="sm:text-right">
                                        <div class="font-semibold">{{ balance.availableDays }} día(s) disponibles</div>
                                        <div class="text-sm text-muted-color">Vence el {{ formatDate(balance.expiresOn) }}</div>
                                    </div>
                                </div>
                            }
                        </div>
                    } @else if (expiringBalancesLoadFailed) {
                        <p class="text-sm text-muted-color mb-0">No se pudieron cargar los saldos por vencer.</p>
                    } @else {
                        <p class="text-sm text-muted-color mb-0">No hay saldos próximos a vencer.</p>
                    }
                </section>
            }

            <div class="grid grid-cols-12 gap-4">
                <article class="col-span-12 xl:col-span-7 p-5 bg-surface-0 dark:bg-surface-900 border border-surface rounded-lg">
                    <div class="flex items-center justify-between gap-3 mb-4">
                        <h2 class="text-xl font-semibold m-0">{{ dashboard().mainTitle }}</h2>
                        <p-tag [value]="dashboard().tag" [severity]="dashboard().tagSeverity" />
                    </div>
                    <div class="grid grid-cols-12 gap-3">
                        @for (step of dashboard().items; track step.title; let index = $index) {
                            <div class="col-span-12 md:col-span-6 p-4 rounded-lg border border-surface bg-surface-50 dark:bg-surface-800">
                                <div class="flex items-center gap-3">
                                    <span class="w-8 h-8 rounded-full bg-primary text-primary-contrast flex items-center justify-center font-semibold">{{ index + 1 }}</span>
                                    <h3 class="m-0 font-semibold">{{ step.title }}</h3>
                                </div>
                                <p class="text-sm text-muted-color mb-0 mt-3">{{ step.text }}</p>
                            </div>
                        }
                    </div>
                </article>

                <article class="col-span-12 xl:col-span-5 p-5 bg-surface-0 dark:bg-surface-900 border border-surface rounded-lg">
                    <h2 class="text-xl font-semibold m-0 mb-4">Acciones rapidas</h2>
                    <div class="flex flex-col gap-3">
                        @for (action of dashboard().actions; track action.label) {
                            <a [routerLink]="action.route" class="p-4 rounded-lg border border-surface hover:bg-emphasis transition-colors no-underline text-color">
                                <div class="flex items-center gap-3">
                                    <span class="w-10 h-10 rounded-lg flex items-center justify-center bg-primary-50 text-primary-600 dark:bg-primary-400/10 dark:text-primary-300">
                                        <i [class]="action.icon"></i>
                                    </span>
                                    <div>
                                        <div class="font-semibold">{{ action.label }}</div>
                                        <p class="text-sm text-muted-color mb-0 mt-1">{{ action.text }}</p>
                                    </div>
                                </div>
                            </a>
                        }
                    </div>
                </article>
            </div>
        </section>
    `
})
export class HrDashboard implements OnInit {
    readonly roleContext = inject(RoleContextService);
    readonly auth = inject(AuthService);
    private readonly vacationBalancesApi = inject(VacationBalancesApiService);
    private readonly vacationRequestsApi = inject(VacationRequestsApiService);
    private readonly employeesApi = inject(EmployeesApiService);
    private readonly http = inject(HttpClient);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly attendanceRecordsUrl = `${environment.apiBaseUrl}/attendance-records`;

    readonly dashboard = computed(() => this.dashboards[this.roleContext.currentRole()]);

    employeeAvailableDays = '0';

    expiringBalances: ExpiringVacationBalance[] = [];

    expiringBalancesLoadFailed = false;

    ngOnInit() {
        const role = this.roleContext.currentRole();

        if (role === 'employee') {
            this.loadEmployeeBalance();
            this.loadEmployeeVacationRequests();
            this.loadEmployeeLatestAttendance();
            return;
        }

        if (role === 'manager') {
            this.loadManagerMetrics();
            return;
        }

        this.loadAdminMetrics();
    }

    loadEmployeeBalance() {
        this.vacationBalancesApi
            .getBalances({ employeeName: this.auth.getEmployeeName(), year: new Date().getFullYear(), page: 1, limit: 1 })
            .pipe(finalize(() => this.cdr.detectChanges()))
            .subscribe({
                next: (response) => {
                    this.employeeAvailableDays = String(response.data.data[0]?.availableDays ?? 0);
                    this.dashboards.employee.metrics[0].value = this.employeeAvailableDays;
                    this.cdr.detectChanges();
                },
                error: () => {
                    this.employeeAvailableDays = '0';
                    this.dashboards.employee.metrics[0].value = '0';
                    this.cdr.detectChanges();
                }
            });
    }

    loadEmployeeVacationRequests() {
        if (this.roleContext.currentRole() !== 'employee') return;

        this.vacationRequestsApi
            .getMyRequests({ employeeName: this.auth.getEmployeeName(), page: 1, limit: 100 })
            .pipe(finalize(() => this.cdr.detectChanges()))
            .subscribe({
                next: (response) => {
                    const activeRequests = response.data.data.filter((request) => this.isActiveVacationRequest(request)).length;
                    this.dashboards.employee.metrics[1].value = String(activeRequests);
                    this.dashboards.employee.metrics[1].detail = activeRequests === 1 ? '1 solicitud activa registrada.' : `${activeRequests} solicitudes activas registradas.`;
                    this.cdr.detectChanges();
                },
                error: () => {
                    this.dashboards.employee.metrics[1].value = '0';
                    this.dashboards.employee.metrics[1].detail = 'No se pudieron cargar tus solicitudes.';
                    this.cdr.detectChanges();
                }
            });
    }

    loadEmployeeLatestAttendance() {
        if (this.roleContext.currentRole() !== 'employee') return;

        let params = new HttpParams().set('page', '1').set('limit', '1');
        const employeeName = this.auth.getEmployeeName();
        const employeeNumber = this.auth.getEmployeeNumber();

        if (employeeName) params = params.set('employeeName', employeeName);
        if (employeeNumber) params = params.set('employeeId', employeeNumber);

        this.http
            .get<ApiResponse<AttendanceRecordsPage>>(`${this.attendanceRecordsUrl}/get-all`, {
                params,
                headers: getAuthHeaders()
            })
            .pipe(finalize(() => this.cdr.detectChanges()))
            .subscribe({
                next: (response) => {
                    const latestRecord = response.data.data[0];

                    if (!latestRecord) {
                        this.dashboards.employee.metrics[2].value = 'Sin datos';
                        this.dashboards.employee.metrics[2].detail = 'Sin registros de asistencia cargados.';
                        this.dashboards.employee.metrics[3].value = '0';
                        this.dashboards.employee.metrics[3].detail = 'Sin incidencias cargadas.';
                        this.cdr.detectChanges();
                        return;
                    }

                    const incidentCount = this.countAttendanceIncidents(latestRecord);
                    this.dashboards.employee.metrics[2].value = this.formatDate(latestRecord.weekEndDate);
                    this.dashboards.employee.metrics[2].detail = latestRecord.weekLabel || 'Última semana cargada.';
                    this.dashboards.employee.metrics[3].value = String(incidentCount);
                    this.dashboards.employee.metrics[3].detail = incidentCount === 0 ? 'Sin incidencias en la última semana.' : latestRecord.observations || 'Incidencias registradas en la última semana.';
                    this.cdr.detectChanges();
                },
                error: () => {
                    this.dashboards.employee.metrics[2].value = 'Sin datos';
                    this.dashboards.employee.metrics[2].detail = 'No se pudo cargar tu asistencia.';
                    this.dashboards.employee.metrics[3].value = '0';
                    this.dashboards.employee.metrics[3].detail = 'No se pudieron cargar tus incidencias.';
                    this.cdr.detectChanges();
                }
            });
    }

    loadManagerMetrics() {
        forkJoin({
            requests: this.vacationRequestsApi.getMyRequests({ employeeName: '', page: 1, limit: 500 }),
            employees: this.employeesApi.getEmployees({ status: 'ACTIVO', page: 1, limit: 500 }),
            attendance: this.getAttendanceRecords({ page: 1, limit: 500 }),
            balances: this.getVacationBalances(),
        })
            .pipe(finalize(() => this.cdr.detectChanges()))
            .subscribe({
                next: ({ requests, employees, attendance, balances }) => {
                    const allRequests = requests.data.data;
                    const pendingRequests = allRequests.filter((request) => this.isActiveVacationRequest(request)).length;
                    const approvedRequests = allRequests.filter((request) => request.status === 'Aprobada').length;
                    const activeTeamCount = employees.data.data.filter((employee) => employee.role !== 'Administrador').length;
                    const latestWeekRecords = this.getLatestWeekRecords(attendance.data.data);
                    const recordsWithIncidents = latestWeekRecords.filter((record) => this.countAttendanceIncidents(record) > 0).length;
                    const incidentsDetail = latestWeekRecords[0]?.weekLabel
                        ? `${recordsWithIncidents} registro${recordsWithIncidents === 1 ? '' : 's'} con incidencias en ${latestWeekRecords[0].weekLabel}.`
                        : 'Sin registros de asistencia cargados.';

                    this.setMetric('manager', 0, pendingRequests, pendingRequests === 1 ? '1 solicitud pendiente por revisar.' : `${pendingRequests} solicitudes pendientes por revisar.`);
                    this.setMetric('manager', 1, activeTeamCount, activeTeamCount === 1 ? '1 persona activa registrada.' : `${activeTeamCount} personas activas registradas.`);
                    this.setMetric('manager', 2, recordsWithIncidents, incidentsDetail);
                    this.setMetric('manager', 3, approvedRequests, approvedRequests === 1 ? '1 solicitud aprobada registrada.' : `${approvedRequests} solicitudes aprobadas registradas.`);
                    this.setExpiringBalances(balances?.data.data || null, employees.data.data.map((employee) => employee.name));
                    this.cdr.detectChanges();
                },
                error: () => {
                    this.setManagerMetricsError();
                    this.cdr.detectChanges();
                }
            });
    }

    loadAdminMetrics() {
        forkJoin({
            requests: this.vacationRequestsApi.getMyRequests({ employeeName: '', page: 1, limit: 500 }),
            employees: this.employeesApi.getEmployees({ page: 1, limit: 5000 }),
            attendance: this.getAttendanceRecords({ page: 1, limit: 1 }),
            imports: this.getAttendanceImports({ page: 1, limit: 100 }),
            balances: this.getVacationBalances(),
        })
            .pipe(finalize(() => this.cdr.detectChanges()))
            .subscribe({
                next: ({ requests, employees, attendance, imports, balances }) => {
                    const pendingRequests = requests.data.data.filter((request) => this.isActiveVacationRequest(request)).length;
                    const registeredEmployeeCount = employees.data.data.filter((employee) => employee.role !== 'Administrador').length;
                    const reportCount = this.countStoredReports(imports.data.data);

                    this.setMetric('admin', 0, pendingRequests, pendingRequests === 1 ? '1 solicitud pendiente por revisar.' : `${pendingRequests} solicitudes pendientes por revisar.`);
                    this.setMetric('admin', 1, registeredEmployeeCount, registeredEmployeeCount === 1 ? '1 empleado registrado.' : `${registeredEmployeeCount} empleados registrados.`);
                    this.setMetric('admin', 2, attendance.data.meta.totalItems, attendance.data.meta.totalItems === 1 ? '1 registro de asistencia importado.' : `${attendance.data.meta.totalItems} registros de asistencia importados.`);
                    this.setMetric('admin', 3, reportCount, reportCount === 1 ? '1 semana disponible para reporte.' : `${reportCount} semanas disponibles para reporte.`);
                    const activeNames = employees.data.data.filter((employee) => employee.status === 'ACTIVO').map((employee) => employee.name);
                    this.setExpiringBalances(balances?.data.data || null, activeNames);
                    this.cdr.detectChanges();
                },
                error: () => {
                    this.setAdminMetricsError();
                    this.cdr.detectChanges();
                }
            });
    }

    private isActiveVacationRequest(request: VacationRequestDto) {
        return request.status === 'Pendiente' || request.status === 'Cambios solicitados';
    }

    private getVacationBalances() {
        return this.vacationBalancesApi.getBalances({ page: 1, limit: 5000 }).pipe(catchError(() => of(null)));
    }

    private setExpiringBalances(balances: VacationBalanceDto[] | null, activeEmployeeNames: string[]) {
        this.expiringBalancesLoadFailed = balances === null;
        const activeNames = new Set(activeEmployeeNames.map((name) => name.trim().toLocaleLowerCase()));
        const today = this.localDateString(new Date());
        const throughDate = this.addMonths(today, 2);

        this.expiringBalances = (balances || [])
            .filter((balance) => balance.availableDays > 0 && balance.periodEndDate && activeNames.has(balance.employeeName.trim().toLocaleLowerCase()))
            .map((balance) => ({ ...balance, expiresOn: this.addDays(balance.periodEndDate as string, 1) }))
            .filter((balance) => balance.expiresOn >= today && balance.expiresOn <= throughDate)
            .sort((left, right) => left.expiresOn.localeCompare(right.expiresOn))
            .slice(0, 5);
    }

    private localDateString(date: Date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    private addDays(value: string, amount: number) {
        const [year, month, day] = value.split('-').map(Number);
        const date = new Date(Date.UTC(year, month - 1, day + amount));
        return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
    }

    private addMonths(value: string, amount: number) {
        const [year, month, day] = value.split('-').map(Number);
        const date = new Date(Date.UTC(year, month - 1, 1));
        date.setUTCMonth(date.getUTCMonth() + amount);
        const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
        date.setUTCDate(Math.min(day, lastDay));
        return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
    }

    private getAttendanceRecords(filters: { page: number; limit: number }) {
        const params = new HttpParams()
            .set('page', String(filters.page))
            .set('limit', String(filters.limit));

        return this.http.get<ApiResponse<AttendanceRecordsPage>>(`${this.attendanceRecordsUrl}/get-all`, {
            params,
            headers: getAuthHeaders()
        });
    }

    private getAttendanceImports(filters: { page: number; limit: number }) {
        const params = new HttpParams()
            .set('page', String(filters.page))
            .set('limit', String(filters.limit));

        return this.http.get<ApiResponse<AttendanceImportsPage>>(`${this.attendanceRecordsUrl}/imports`, {
            params,
            headers: getAuthHeaders()
        });
    }

    private countStoredReports(imports: AttendanceStoredImport[]) {
        const weekKeys = new Set<string>();

        for (const importItem of imports) {
            for (const week of importItem.weeks || []) {
                if (week.status === 'GUARDADA') {
                    weekKeys.add(week.weekKey);
                }
            }
        }

        return weekKeys.size;
    }

    private getLatestWeekRecords(records: AttendanceRecordDto[]) {
        const latestRecord = records[0];
        if (!latestRecord?.weekKey) return [];

        return records.filter((record) => record.weekKey === latestRecord.weekKey);
    }

    private setMetric(role: 'manager' | 'admin', index: number, value: number, detail: string) {
        this.dashboards[role].metrics[index].value = String(value);
        this.dashboards[role].metrics[index].detail = detail;
    }

    private setManagerMetricsError() {
        this.dashboards.manager.metrics[0].detail = 'No se pudieron cargar las solicitudes.';
        this.dashboards.manager.metrics[1].detail = 'No se pudo cargar el personal activo.';
        this.dashboards.manager.metrics[2].detail = 'No se pudieron cargar las incidencias.';
        this.dashboards.manager.metrics[3].detail = 'No se pudieron cargar las vacaciones aprobadas.';
    }

    private setAdminMetricsError() {
        this.dashboards.admin.metrics[0].detail = 'No se pudieron cargar las solicitudes.';
        this.dashboards.admin.metrics[1].detail = 'No se pudo cargar el conteo de empleados.';
        this.dashboards.admin.metrics[2].detail = 'No se pudieron cargar los registros importados.';
        this.dashboards.admin.metrics[3].detail = 'No se pudieron cargar los reportes.';
    }

    private countAttendanceIncidents(record: AttendanceRecordDto) {
        const missingCount = [record.monday, record.tuesday, record.wednesday, record.thursday, record.friday].filter((value) => value === 'Falta').length;

        return missingCount + Number(record.lateCount || 0) + Number(record.accumulatedLateCount || 0) + Number(record.accumulatedSaturdayCount || 0);
    }

    formatDate(value: string) {
        const [year, month, day] = value.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        if (Number.isNaN(date.getTime())) return 'Sin datos';

        return new Intl.DateTimeFormat('es-MX', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }).format(date);
    }

    dashboards = {
        employee: {
            title: 'Mi espacio de empleado',
            subtitle: 'Consulta tus vacaciones, tus días disponibles y tu asistencia personal.',
            mainTitle: 'Pendientes personales',
            tag: 'Autoservicio',
            tagSeverity: 'success' as const,
            metrics: [
                { label: 'Días disponibles', value: '0', detail: 'Saldo actual antes de nuevas solicitudes.', icon: 'pi pi-calendar' },
                { label: 'Solicitudes activas', value: '0', detail: 'Sin solicitudes activas registradas.', icon: 'pi pi-inbox' },
                { label: 'Ultimo registro', value: 'Sin datos', detail: 'Sin registros de asistencia cargados.', icon: 'pi pi-clock' },
                { label: 'Incidencias semana', value: '0', detail: 'Sin incidencias cargadas.', icon: 'pi pi-check-circle' }
            ],
            items: [
                { title: 'Crear solicitud', text: 'Registra fechas, comentarios y envia la solicitud para revisión.' },
                { title: 'Dar seguimiento', text: 'Consulta si tu solicitud esta pendiente, aprobada, rechazada o requiere cambios.' },
                { title: 'Revisar saldo', text: 'Verifica cuántos días tienes disponibles antes de solicitar.' },
                { title: 'Consultar asistencia', text: 'Solo puedes ver tus propias entradas, salidas e incidencias.' }
            ],
            actions: [
                { label: 'Nueva solicitud', text: 'Enviar vacaciones a revision.', icon: 'pi pi-plus', route: ['/vacaciones/nueva'] },
                { label: 'Mis solicitudes', text: 'Ver estado e historial.', icon: 'pi pi-list', route: ['/vacaciones/mis-solicitudes'] },
                { label: 'Mi asistencia', text: 'Consultar mis registros.', icon: 'pi pi-table', route: ['/asistencia/reporte'] }
            ]
        },
        manager: {
            title: 'Panel de jefe/director',
            subtitle: 'Revisa solicitudes, saldos y asistencia de la empresa.',
            mainTitle: 'Trabajo de aprobacion',
            tag: 'Equipo',
            tagSeverity: 'warn' as const,
            metrics: [
                { label: 'Solicitudes pendientes', value: '0', detail: 'Sin solicitudes pendientes cargadas.', icon: 'pi pi-inbox' },
                { label: 'Equipo activo', value: '0', detail: 'Sin conteo cargado.', icon: 'pi pi-users' },
                { label: 'Incidencias asistencia', value: '0', detail: 'Sin incidencias cargadas.', icon: 'pi pi-exclamation-triangle' },
                { label: 'Vacaciones aprobadas', value: '0', detail: 'Sin solicitudes aprobadas cargadas.', icon: 'pi pi-check-square' }
            ],
            items: [
                { title: 'Revisar solicitudes', text: 'Autoriza, rechaza o solicita cambios con comentario.' },
                { title: 'Validar saldo', text: 'Comprueba días disponibles antes de aprobar.' },
                { title: 'Cuidar cobertura', text: 'Evalua ausencias considerando el calendario de la empresa.' },
                { title: 'Consultar asistencia', text: 'Visualiza los registros de asistencia de toda la empresa.' }
            ],
            actions: [
                { label: 'Nueva solicitud', text: 'Enviar tus vacaciones a revision.', icon: 'pi pi-plus', route: ['/vacaciones/nueva'] },
                { label: 'Mis solicitudes', text: 'Ver tus solicitudes personales.', icon: 'pi pi-list', route: ['/vacaciones/mis-solicitudes'] },
                { label: 'Solicitudes por aprobar', text: 'Atender pendientes de la empresa.', icon: 'pi pi-check-square', route: ['/vacaciones/aprobaciones'] },
                { label: 'Saldos de la empresa', text: 'Revisar días disponibles.', icon: 'pi pi-calendar-clock', route: ['/vacaciones/saldos'] },
                { label: 'Dashboard semanal', text: 'Abrir semanas disponibles.', icon: 'pi pi-chart-bar', route: ['/asistencia/dashboard'] },
                { label: 'Reporte semanal de asistencia', text: 'Ver resumen semanal.', icon: 'pi pi-table', route: ['/asistencia/reporte'] }
            ]
        },
        admin: {
            title: 'Panel de administracion',
            subtitle: 'Administra empleados, vacaciones, asistencia y reportes.',
            mainTitle: 'Operacion de Administrador',
            tag: 'Control total',
            tagSeverity: 'danger' as const,
            metrics: [
                { label: 'Solicitudes pendientes', value: '0', detail: 'Sin solicitudes pendientes cargadas.', icon: 'pi pi-inbox' },
                { label: 'Empleados registrados', value: '0', detail: 'Sin conteo cargado.', icon: 'pi pi-users' },
                { label: 'Registros importados', value: '0', detail: 'Sin registros importados cargados.', icon: 'pi pi-clock' },
                { label: 'Reportes listos', value: '0', detail: 'Sin reportes cargados.', icon: 'pi pi-file-pdf' }
            ],
            items: [
                { title: 'Gestionar empleados', text: 'Mantiene perfiles, departamentos, jefes y estados.' },
                { title: 'Controlar saldos', text: 'Consulta y ajusta días disponibles cuando RH lo autorice.' },
                { title: 'Procesar asistencia', text: 'Carga el Excel de la maquina de huella y simplifica la semana.' },
                { title: 'Generar reportes', text: 'Prepara reportes PDF para seguimiento interno.' }
            ],
            actions: [
                { label: 'Empleados', text: 'Administrar personal y roles.', icon: 'pi pi-users', route: ['/admin/empleados'] },
                { label: 'Dashboard semanal', text: 'Revisar semanas de asistencia.', icon: 'pi pi-chart-bar', route: ['/asistencia/dashboard'] },
                { label: 'Cargar Excel', text: 'Importar registros de huella.', icon: 'pi pi-upload', route: ['/asistencia/cargar'] }
            ]
        }
    };
}
