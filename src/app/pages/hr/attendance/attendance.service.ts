import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RoleContextService } from '../role-context.service';
import { AuthService } from '@/app/services/auth.service';
import { getAuthHeaders } from '@/app/services/auth-headers';
import { environment } from '@/environments/environment';
import { firstValueFrom } from 'rxjs';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getMexicoFederalHolidayDates } from '../vacations/vacation-days';

export type AttendanceSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

export interface AttendanceSummaryRow {
    attendanceRecordId?: string;
    employeeId?: string;
    department: string;
    employee: string;
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    saturdayDueDate: string;
    saturdayStatus: string;
    observations: string;
    lateCount: number;
    permissionLateCount: number;
    accumulatedLateCount: number;
    accumulatedSaturdayCount: number;
    permissionOriginalValues?: Partial<Record<AttendanceDayField, string>>;
    forgivenLateCount?: boolean;
    forgivenAccumulatedLateCount?: boolean;
    forgivenAccumulatedSaturdayCount?: boolean;
    forgivenOriginalAccumulatedLateCount?: number;
    forgivenOriginalAccumulatedSaturdayCount?: number;
    forgivenOriginalSaturday?: string;
    forgivenOriginalSaturdayDueDate?: string;
    forgivenOriginalSaturdayStatus?: string;
    severity: AttendanceSeverity;
}

export type AttendanceDayField = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

export type AttendancePdfColumnKey =
    | 'department'
    | 'employee'
    | 'monday'
    | 'tuesday'
    | 'wednesday'
    | 'thursday'
    | 'friday'
    | 'saturday'
    | 'saturdayDueDate'
    | 'saturdayStatus'
    | 'observations'
    | 'lateCount'
    | 'permissionLateCount'
    | 'accumulatedLateCount'
    | 'accumulatedSaturdayCount';

export interface AttendancePdfColumn {
    key: AttendancePdfColumnKey;
    label: string;
    width: number;
    align?: 'left' | 'center';
}

export interface AttendanceWeek {
    label: string;
    dates: Date[];
    weekKey?: string;
}

export interface AttendanceForgivenessOptions {
    forgiveLateCount?: boolean;
    forgiveAccumulatedLateCount?: boolean;
    forgiveAccumulatedSaturdayCount?: boolean;
}

export interface AttendanceDashboardWeek extends AttendanceWeek {
    index: number;
    totalEmployees: number;
    totalLates: number;
    totalMissing: number;
    pendingSaturdays: number;
    severity: AttendanceSeverity;
}

interface ImportedEmployeeLog {
    employeeId?: string;
    department: string;
    employee: string;
    punchesByDay: Record<number, string[]>;
    permissionsByDay: Record<number, boolean>;
}

interface AttendanceImportResult {
    insertedWeeks: string[];
    skippedWeeks: string[];
    insertedRecords: number;
    skippedRecords: number;
}

interface DeleteAttendanceImportResult {
    deletedImport: boolean;
    deletedRecords: number;
}

export interface AttendanceStoredImport {
    _id?: string;
    sourceFileName?: string;
    uploadedAtTS?: number;
    uploadedAtISO?: string;
    weekKeys?: string[];
    weeks?: AttendanceStoredImportWeek[];
    insertedWeeks?: string[];
    skippedWeeks?: string[];
    insertedRecords?: number;
    skippedRecords?: number;
    uploadedBy?: string;
}

export interface AttendanceStoredImportWeek {
    weekKey: string;
    weekLabel: string;
    weekStartDate: string;
    weekEndDate: string;
    status: 'GUARDADA' | 'OMITIDA';
}

interface AttendanceStoredRecord {
    _id?: string;
    weekKey: string;
    weekLabel: string;
    weekStartDate: string;
    weekEndDate: string;
    employeeId?: string;
    employeeName: string;
    employee?: string;
    department: string;
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    saturdayDueDate: string;
    saturdayStatus: string;
    observations: string;
    lateCount: number;
    permissionLateCount: number;
    accumulatedLateCount: number;
    accumulatedSaturdayCount: number;
    permissionOriginalValues?: Partial<Record<AttendanceDayField, string>>;
    forgivenLateCount?: boolean;
    forgivenAccumulatedLateCount?: boolean;
    forgivenAccumulatedSaturdayCount?: boolean;
    forgivenOriginalAccumulatedLateCount?: number;
    forgivenOriginalAccumulatedSaturdayCount?: number;
    forgivenOriginalSaturday?: string;
    forgivenOriginalSaturdayDueDate?: string;
    forgivenOriginalSaturdayStatus?: string;
}

interface VacationRequestRecord {
    employeeId?: string;
    employeeName: string;
    startDate: string;
    endDate: string;
    status: string;
}

interface ApiResponse<T> {
    status: number;
    message: string;
    data: T;
}

interface AttendanceSettings {
    workdayStartTime: string;
    lateToleranceMinutes: number;
    lateRecordsForSaturday: number;
}

@Injectable({
    providedIn: 'root'
})
export class AttendanceService {
    private readonly roleContext = inject(RoleContextService);

    private readonly auth = inject(AuthService);

    private readonly http = inject(HttpClient);

    private readonly attendanceRecordsUrl = `${environment.apiBaseUrl}/attendance-records`;

    private readonly vacationRequestsUrl = `${environment.apiBaseUrl}/vacation-requests`;

    private readonly defaultExcludedPeople: string[] = ['Cinthia', 'Jorge', 'Saul', 'Angel', 'Jc'];

    private readonly excludedPeopleStorageKey = 'attendanceExcludedPeople';

    private readonly selectedStoredWeekStorageKey = 'selectedAttendanceStoredWeek';

    private readonly reportSnapshotStorageKey = 'attendanceReportSnapshot';

    private readonly departmentOverrides: Record<string, string> = {};

    private lastImportedLogs: ImportedEmployeeLog[] = [];

    private restoredSnapshotReports: AttendanceSummaryRow[][] = [];

    private approvedVacationRequests: VacationRequestRecord[] = [];

    readonly importedReport = signal<AttendanceSummaryRow[] | null>(null);

    readonly weeks = signal<AttendanceWeek[]>([]);

    readonly selectedWeekIndex = signal<number>(0);

    readonly savingToDatabase = signal(false);

    readonly lastSaveResult = signal<AttendanceImportResult | null>(null);

    readonly storedImports = signal<AttendanceStoredImport[]>([]);

    readonly loadingStoredImports = signal(false);

    readonly deletingStoredImport = signal(false);

    readonly updatingPermission = signal(false);

    readonly savingAttendanceSettings = signal(false);

    readonly report: AttendanceSummaryRow[] = [];

    readonly workdayStartTime = signal('09:00');

    readonly lateToleranceMinutes = signal(5);

    readonly lateRecordsForSaturday = signal(3);

    readonly lateStartTimeLabel = computed(() => this.formatMinutesAsTime(this.getWorkdayStartMinutes() + this.lateToleranceMinutes()));

    readonly pdfColumns: AttendancePdfColumn[] = [
        { key: 'department', label: 'Departamento', width: 70, align: 'left' },
        { key: 'employee', label: 'Empleado', width: 95, align: 'left' },
        { key: 'monday', label: 'Lunes', width: 58 },
        { key: 'tuesday', label: 'Martes', width: 58 },
        { key: 'wednesday', label: 'Miércoles', width: 58 },
        { key: 'thursday', label: 'Jueves', width: 58 },
        { key: 'friday', label: 'Viernes', width: 58 },
        { key: 'saturday', label: 'Sábado', width: 58 },
        { key: 'saturdayDueDate', label: 'Sábado generado', width: 70 },
        { key: 'saturdayStatus', label: 'Estado sábado', width: 65 },
        { key: 'observations', label: 'Observaciones', width: 107, align: 'left' },
        { key: 'lateCount', label: 'Retardos', width: 45 },
        { key: 'permissionLateCount', label: 'Con permiso', width: 55 },
        { key: 'accumulatedLateCount', label: 'Días Acumulados', width: 50 },
        { key: 'accumulatedSaturdayCount', label: 'Sábados Acumulados', width: 55 }
    ];

    readonly pdfColumnVisibility = signal<Record<string, boolean>>(this.getDefaultPdfColumnVisibility());

    readonly pdfRowVisibility = signal<Record<string, boolean>>({});

    readonly visiblePdfColumns = computed(() => this.pdfColumns.filter((column) => this.isPdfColumnVisible(column.key)));

    readonly excludedPeople = signal<string[]>(this.loadExcludedPeople());

    readonly excludedPeopleText = computed(() => this.excludedPeople().join('\n'));

    constructor() {
        void this.loadAttendanceSettings();
    }

    readonly dashboardWeeks = computed<AttendanceDashboardWeek[]>(() => {
        if (this.lastImportedLogs.length === 0) {
            return [];
        }

        return this.weeks().map((week, index) => {
            const rows = this.buildReport(this.lastImportedLogs, week.dates).filter((row) => !this.isExcludedAttendancePerson(row.employee));
            const totalLates = rows.reduce((total, row) => total + row.lateCount, 0);
            const totalMissing = rows.reduce((total, row) => total + this.countMissingDays(row), 0);
            const pendingSaturdays = rows.reduce((total, row) => total + row.accumulatedSaturdayCount, 0);

            return {
                ...week,
                index,
                totalEmployees: rows.length,
                totalLates,
                totalMissing,
                pendingSaturdays,
                severity: pendingSaturdays > 0 ? 'danger' : totalLates > 0 || totalMissing > 0 ? 'warn' : 'success'
            };
        });
    });

    readonly simplifiedReport = computed(() => {
        const source = this.importedReport() ?? this.report;
        const rows = this.sortAttendanceRows(source);

        if (this.roleContext.currentRole() === 'employee' && !this.isCurrentUserDirection()) {
            const employeeName = this.normalize(this.auth.getEmployeeName());
            const employeeNumber = this.normalize(this.auth.getEmployeeNumber());
            return rows.filter((row) => this.normalize(row.employee) === employeeName || (employeeNumber && this.normalize(row.employeeId || '') === employeeNumber));
        }

        return rows.filter((row) => !this.isExcludedAttendancePerson(row.employee));
    });

    setWorkdayStartTime(time: string) {
        const normalizedTime = /^([01]\d|2[0-3]):[0-5]\d$/.test(String(time || '').trim()) ? String(time).trim() : '09:00';
        this.workdayStartTime.set(normalizedTime);
        this.refreshImportedReport();
        void this.saveAttendanceSettings({ workdayStartTime: normalizedTime }).catch(() => {});
    }

    setLateToleranceMinutes(minutes: number) {
        const normalizedMinutes = Number.isFinite(Number(minutes)) ? Math.max(0, Math.min(59, Number(minutes))) : 5;
        this.lateToleranceMinutes.set(normalizedMinutes);
        this.refreshImportedReport();
        void this.saveAttendanceSettings({ lateToleranceMinutes: normalizedMinutes }).catch(() => {});
    }

    setLateRecordsForSaturday(value: number) {
        const normalizedValue = Number.isFinite(Number(value)) ? Math.max(1, Math.min(20, Math.trunc(Number(value)))) : 3;
        this.lateRecordsForSaturday.set(normalizedValue);
        this.refreshImportedReport();
        void this.saveAttendanceSettings({ lateRecordsForSaturday: normalizedValue }).catch(() => {});
    }

    async loadAttendanceSettings() {
        try {
            const response = await firstValueFrom(
                this.http.get<ApiResponse<AttendanceSettings>>(`${this.attendanceRecordsUrl}/settings`, {
                    headers: this.getHeaders()
                })
            );
            this.applyAttendanceSettings(response.data);
        } catch {
            this.applyAttendanceSettings({
                workdayStartTime: '09:00',
                lateToleranceMinutes: 5,
                lateRecordsForSaturday: 3
            });
        }
    }

    private async saveAttendanceSettings(settings: Partial<AttendanceSettings>) {
        this.savingAttendanceSettings.set(true);

        try {
            const response = await firstValueFrom(
                this.http.put<ApiResponse<AttendanceSettings>>(`${this.attendanceRecordsUrl}/settings`, settings, {
                    headers: this.getHeaders()
                })
            );
            this.applyAttendanceSettings(response.data);
        } finally {
            this.savingAttendanceSettings.set(false);
        }
    }

    private applyAttendanceSettings(settings: Partial<AttendanceSettings>) {
        if (settings.workdayStartTime) this.workdayStartTime.set(settings.workdayStartTime);
        if (settings.lateToleranceMinutes !== undefined) this.lateToleranceMinutes.set(Number(settings.lateToleranceMinutes));
        if (settings.lateRecordsForSaturday !== undefined) this.lateRecordsForSaturday.set(Number(settings.lateRecordsForSaturday));
        this.refreshImportedReport();
    }

    private refreshImportedReport() {
        const index = this.selectedWeekIndex();
        const week = this.weeks()[index];
        if (week && this.lastImportedLogs.length > 0) {
            const report = this.buildReport(this.lastImportedLogs, week.dates);
            this.importedReport.set(this.applyCachedImportForgiveness(report, index));
            this.saveReportSnapshot();
        }
    }

    async setManualPermission(employee: string, field: AttendanceDayField, hasPermission: boolean, attendanceRecordId?: string) {
        const week = this.weeks()[this.selectedWeekIndex()];
        const dayIndex = this.getDayFieldIndex(field);
        const date = week?.dates[dayIndex];

        const log = this.lastImportedLogs.find((item) => item.employee === employee);
        if (log && date) {
            if (hasPermission) {
                log.permissionsByDay[date.getDate()] = true;
            } else {
                delete log.permissionsByDay[date.getDate()];
            }

            const report = this.buildReport(this.lastImportedLogs, week.dates);
            this.importedReport.set(this.applyCachedImportForgiveness(report, this.selectedWeekIndex()));
            this.saveReportSnapshot();
            return;
        }

        const currentRow = this.importedReport()?.find((row) => row.employee === employee && row.attendanceRecordId === attendanceRecordId);

        if (!attendanceRecordId) {
            this.applyPermissionToLocalReport(employee, field, hasPermission);
            return;
        }

        this.updatingPermission.set(true);

        try {
            const response = await firstValueFrom(
                this.http.put<ApiResponse<AttendanceStoredRecord | null>>(
                    `${this.attendanceRecordsUrl}/records/${attendanceRecordId}/permission`,
                    {
                        field,
                        hasPermission
                    },
                    { headers: this.getHeaders() }
                )
            );

            const updatedRow = response.data ? this.mapStoredRecordToSummary(response.data) : currentRow ? this.buildPermissionUpdatedRow(currentRow, field, hasPermission) : null;
            this.applyPermissionToImportedReport(employee, field, hasPermission, attendanceRecordId, updatedRow);
        } finally {
            this.updatingPermission.set(false);
        }
    }

    async forgiveAttendanceObservations(employee: string, options: AttendanceForgivenessOptions, attendanceRecordId?: string) {
        const currentRow = this.importedReport()?.find((row) => row.employee === employee && row.attendanceRecordId === attendanceRecordId);

        if (!attendanceRecordId) {
            this.applyForgivenessToImportedReport(employee, options);
            return;
        }

        this.updatingPermission.set(true);

        try {
            const response = await firstValueFrom(
                this.http.put<ApiResponse<AttendanceStoredRecord | null>>(
                    `${this.attendanceRecordsUrl}/records/${attendanceRecordId}/forgiveness`,
                    options,
                    { headers: this.getHeaders() }
                )
            );

            const updatedRow = response.data ? this.mapStoredRecordToSummary(response.data) : currentRow ? this.buildForgivenRow(currentRow, options) : null;
            this.applyForgivenessToImportedReport(employee, options, attendanceRecordId, updatedRow);
        } finally {
            this.updatingPermission.set(false);
        }
    }

    setExcludedPeopleFromText(value: string) {
        const people = value
            .split(/\r?\n|,/)
            .map((person) => person.trim())
            .filter(Boolean);

        this.excludedPeople.set(people);
        this.saveExcludedPeople(people);
        this.refreshImportedReport();
    }

    resetExcludedPeople() {
        this.excludedPeople.set(this.defaultExcludedPeople);
        this.saveExcludedPeople(this.defaultExcludedPeople);
        this.refreshImportedReport();
    }

    isExcludedAttendancePerson(employee: string) {
        const normalized = this.normalize(employee);
        return this.excludedPeople()
            .map((person) => this.normalize(person))
            .some((person) => person && normalized.includes(person));
    }

    isCurrentUserDirection() {
        const department = this.normalize(this.auth.getEmployeeDepartment());
        return department.includes('direccion');
    }

    async importWorkbook(file: File) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
        const logsSheetName = workbook.SheetNames.find((name) => name.toLowerCase() === 'logs') ?? workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json<string[]>(workbook.Sheets[logsSheetName], { header: 1, raw: false, defval: '' });
        const period = this.extractPeriod(rows);
        const logs = this.extractLogs(rows);
        const weeks = this.buildWeeks(period.start, period.end);

        await this.loadApprovedVacationRequests(period.start, period.end);
        this.lastImportedLogs = logs;
        this.restoredSnapshotReports = [];
        this.clearSelectedStoredWeekKey();
        this.weeks.set(weeks);
        this.selectedWeekIndex.set(Math.max(weeks.length - 1, 0));
        this.lastSaveResult.set(null);
        this.importedReport.set(this.buildReport(logs, weeks[this.selectedWeekIndex()]?.dates ?? []));
        this.saveReportSnapshot();
    }

    async saveImportedWeeks(sourceFileName?: string) {
        const weeks = this.weeks();

        if (weeks.length === 0 || this.lastImportedLogs.length === 0) {
            throw new Error('No hay semanas de asistencia para guardar.');
        }

        this.savingToDatabase.set(true);

        try {
            const payload = {
                sourceFileName,
                weeks: weeks
                    .map((week, weekIndex) => ({ week, weekIndex }))
                    .filter(({ week }) => week.dates.length > 0)
                    .map(({ week, weekIndex }) => {
                        const firstDate = week.dates[0];
                        const lastDate = week.dates[week.dates.length - 1];
                        const reportRows =
                            weekIndex === this.selectedWeekIndex() && this.importedReport()
                                ? this.importedReport()!
                                : this.applyCachedImportForgiveness(this.buildReport(this.lastImportedLogs, week.dates), weekIndex);

                        return {
                            weekKey: this.getWeekKey(week),
                            weekLabel: week.label,
                            weekStartDate: this.formatIsoDate(firstDate),
                            weekEndDate: this.formatIsoDate(lastDate),
                            rows: reportRows
                                .filter((row) => !this.isExcludedAttendancePerson(row.employee))
                                .map((row) => ({
                                    employeeId: row.employeeId,
                                    employeeName: row.employee,
                                    department: row.department,
                                    monday: row.monday,
                                    tuesday: row.tuesday,
                                    wednesday: row.wednesday,
                                    thursday: row.thursday,
                                    friday: row.friday,
                                    saturday: row.saturday,
                                    saturdayDueDate: row.saturdayDueDate,
                                    saturdayStatus: row.saturdayStatus,
                                    observations: row.observations,
                                    lateCount: row.lateCount,
                                    permissionLateCount: row.permissionLateCount,
                                    accumulatedLateCount: row.accumulatedLateCount,
                                    accumulatedSaturdayCount: row.accumulatedSaturdayCount,
                                    permissionOriginalValues: row.permissionOriginalValues,
                                    forgivenLateCount: row.forgivenLateCount,
                                    forgivenAccumulatedLateCount: row.forgivenAccumulatedLateCount,
                                    forgivenAccumulatedSaturdayCount: row.forgivenAccumulatedSaturdayCount,
                                    forgivenOriginalAccumulatedLateCount: row.forgivenOriginalAccumulatedLateCount,
                                    forgivenOriginalAccumulatedSaturdayCount: row.forgivenOriginalAccumulatedSaturdayCount,
                                    forgivenOriginalSaturday: row.forgivenOriginalSaturday,
                                    forgivenOriginalSaturdayDueDate: row.forgivenOriginalSaturdayDueDate,
                                    forgivenOriginalSaturdayStatus: row.forgivenOriginalSaturdayStatus
                                }))
                        };
                    })
            };

            const response = await firstValueFrom(
                this.http.post<ApiResponse<AttendanceImportResult>>(`${this.attendanceRecordsUrl}/import-weeks`, payload, {
                    headers: this.getHeaders()
                })
            );

            this.lastSaveResult.set(response.data);
            return response.data;
        } finally {
            this.savingToDatabase.set(false);
        }
    }

    async loadStoredImports(filters: { year?: number; month?: number } = {}) {
        this.loadingStoredImports.set(true);

        try {
            const queryParams = new URLSearchParams();
            queryParams.set('page', '1');
            queryParams.set('limit', '100');
            if (filters.year) queryParams.set('year', String(filters.year));
            if (filters.month) queryParams.set('month', String(filters.month));

            const response = await firstValueFrom(
                this.http.get<ApiResponse<{ data: AttendanceStoredImport[] }>>(`${this.attendanceRecordsUrl}/imports?${queryParams.toString()}`, {
                    headers: this.getHeaders()
                })
            );

            this.storedImports.set(response.data.data);
            return response.data.data;
        } finally {
            this.loadingStoredImports.set(false);
        }
    }

    getStoredWeeksFromLoadedImports(filters: { year?: number; month?: number } = {}) {
        const monthToken = filters.month ? String(filters.month).padStart(2, '0') : '';
        const yearToken = filters.year ? String(filters.year) : '';

        const weeks = this.storedImports()
            .flatMap((importItem) => importItem.weeks || [])
            .filter((week) => {
                const belongsToMonth = !monthToken || week.weekStartDate.startsWith(`${yearToken}-${monthToken}`) || week.weekEndDate.startsWith(`${yearToken}-${monthToken}`);
                const belongsToYear = !yearToken || week.weekStartDate.startsWith(yearToken) || week.weekEndDate.startsWith(yearToken);
                return week.status === 'GUARDADA' && belongsToYear && belongsToMonth;
            });

        const uniqueWeeks = Array.from(new Map(weeks.map((week) => [week.weekKey, week])).values()).sort((a, b) => a.weekStartDate.localeCompare(b.weekStartDate));

        return uniqueWeeks.map((week) => ({
            label: week.weekLabel,
            dates: this.buildDatesFromRange(week.weekStartDate, week.weekEndDate),
            weekKey: week.weekKey
        }));
    }

    async openStoredWeek(weekKey: string) {
        const queryParams = new URLSearchParams();
        queryParams.set('weekKey', weekKey);
        queryParams.set('page', '1');
        queryParams.set('limit', '500');

        const response = await firstValueFrom(
            this.http.get<ApiResponse<{ data: AttendanceStoredRecord[] }>>(`${this.attendanceRecordsUrl}/get-all?${queryParams.toString()}`, {
                headers: this.getHeaders()
            })
        );
        const rows = response.data.data;
        const firstRow = rows[0];

        if (!firstRow) {
            this.importedReport.set([]);
            return;
        }

        this.lastImportedLogs = [];
        const reportRows = rows.map((row) => this.mapStoredRecordToSummary(row));
        const storedWeeks = await this.getStoredWeeksForReport(firstRow);
        const selectedWeekIndex = Math.max(
            storedWeeks.findIndex((week) => week.weekKey === weekKey),
            0
        );

        this.weeks.set(storedWeeks);
        this.selectedWeekIndex.set(selectedWeekIndex);
        this.restoredSnapshotReports = storedWeeks.map((_, index) => (index === selectedWeekIndex ? reportRows : []));
        this.importedReport.set(reportRows);
        this.saveSelectedStoredWeekKey(weekKey);
        this.saveReportSnapshot();
    }

    getSelectedStoredWeekKey() {
        if (typeof window === 'undefined') return null;

        return localStorage.getItem(this.selectedStoredWeekStorageKey);
    }

    persistCurrentReportSnapshot() {
        this.clearReportSnapshotResidue();
    }

    restoreReportSnapshot() {
        this.clearReportSnapshotResidue();
        return false;
    }

    clearReportSnapshotResidue() {
        if (typeof window === 'undefined') return;

        localStorage.removeItem(this.reportSnapshotStorageKey);
    }

    async deleteStoredImport(importId: string) {
        this.deletingStoredImport.set(true);

        try {
            const response = await firstValueFrom(
                this.http.delete<ApiResponse<DeleteAttendanceImportResult>>(`${this.attendanceRecordsUrl}/imports/${importId}`, {
                    headers: this.getHeaders()
                })
            );

            this.storedImports.update((imports) => imports.filter((importItem) => importItem._id !== importId));
            return response.data;
        } finally {
            this.deletingStoredImport.set(false);
        }
    }

    async openReportWeek(index: number) {
        const week = this.weeks()[index];
        if (!week) return;

        if (week.weekKey && this.lastImportedLogs.length === 0) {
            this.selectedWeekIndex.set(index);
            const restoredReport = this.restoredSnapshotReports[index];

            if (restoredReport?.length) {
                this.importedReport.set(restoredReport);
                this.saveSelectedStoredWeekKey(week.weekKey);
                this.saveReportSnapshot();
                return;
            }

            await this.openStoredWeek(week.weekKey);
            return;
        }

        this.selectWeek(index);
    }

    selectWeek(index: number) {
        const week = this.weeks()[index];
        if (!week) return;

        this.clearSelectedStoredWeekKey();
        this.selectedWeekIndex.set(index);

        if (this.lastImportedLogs.length === 0) {
            const restoredReport = this.restoredSnapshotReports[index];
            if (restoredReport?.length) {
                this.importedReport.set(restoredReport);
                this.saveReportSnapshot();
            }
            return;
        }

        const report = this.buildReport(this.lastImportedLogs, week.dates);
        this.importedReport.set(this.applyCachedImportForgiveness(report, index));
        this.saveReportSnapshot();
    }

    togglePdfColumn(columnKey: AttendancePdfColumnKey) {
        const visibleColumns = this.visiblePdfColumns();
        if (this.isPdfColumnVisible(columnKey) && visibleColumns.length === 1) return;

        const nextVisibility = {
            ...this.pdfColumnVisibility(),
            [columnKey]: !this.isPdfColumnVisible(columnKey)
        };

        this.pdfColumnVisibility.set(nextVisibility);
    }

    togglePdfRow(row: AttendanceSummaryRow) {
        const rowKey = this.getPdfRowKey(row);
        const nextVisibility = {
            ...this.pdfRowVisibility(),
            [rowKey]: !this.isPdfRowVisible(row)
        };

        this.pdfRowVisibility.set(nextVisibility);
    }

    isPdfColumnVisible(columnKey: AttendancePdfColumnKey) {
        return this.pdfColumnVisibility()[columnKey] !== false;
    }

    isPdfRowVisible(row: AttendanceSummaryRow) {
        return this.pdfRowVisibility()[this.getPdfRowKey(row)] !== false;
    }

    generatePdf() {
        const rows = this.simplifiedReport().filter((row) => this.isPdfRowVisible(row));
        const visibleColumns = this.visiblePdfColumns();
        const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'legal' });
        const week = this.weeks()[this.selectedWeekIndex()];
        const title = week ? `Reporte de asistencia - ${week.label}` : 'Reporte de asistencia semanal';
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margins = { top: 54, left: 24, right: 24, bottom: 24 };
        const printableWidth = pageWidth - margins.left - margins.right;
        const visibleColumnsWidth = visibleColumns.reduce((total, column) => total + column.width, 0);
        const centeredLeftMargin = Math.max(margins.left, (pageWidth - visibleColumnsWidth) / 2);
        const tableMargins = visibleColumnsWidth < printableWidth
            ? { ...margins, left: centeredLeftMargin, right: centeredLeftMargin }
            : margins;
        const tableWidth = visibleColumnsWidth < printableWidth ? visibleColumnsWidth : printableWidth;
        const startY = 72;
        const availableTableHeight = pageHeight - startY - margins.bottom;
        const rowHeight = Math.min(Math.max((availableTableHeight - 28) / Math.max(rows.length, 1), 24), 44);
        const cellPadding = rows.length <= 6 ? 4 : 3;

        doc.setFontSize(20);
        doc.text(title, pageWidth / 2, 44, { align: 'center' });

        autoTable(doc, {
            startY,
            head: [visibleColumns.map((column) => column.label)],
            body: rows.map((row) => visibleColumns.map((column) => this.getPdfColumnValue(row, column.key))),
            tableWidth,
            styles: {
                fontSize: rows.length <= 6 ? 10.5 : 9,
                cellPadding,
                minCellHeight: rowHeight,
                overflow: 'linebreak',
                halign: 'center',
                valign: 'middle',
                lineColor: [229, 231, 235],
                lineWidth: 0.25
            },
            headStyles: { fillColor: [31, 41, 55], textColor: [255, 255, 255], halign: 'center' },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            columnStyles: this.getPdfColumnStyles(visibleColumns),
            margin: tableMargins,
            showHead: 'everyPage',
            didParseCell: (data) => {
                if (data.section !== 'body') return;

                const column = visibleColumns[data.column.index];
                const isAttendanceDayColumn = Boolean(column && this.isAttendanceDayColumn(column.key));
                if (isAttendanceDayColumn && this.isVacationAttendanceCell(data.cell.raw)) {
                    data.cell.styles.fillColor = [209, 250, 229];
                    data.cell.styles.textColor = [6, 95, 70];
                    return;
                }

                if (isAttendanceDayColumn && this.isMissingAttendanceCell(data.cell.raw)) {
                    data.cell.styles.fillColor = [254, 226, 226];
                    data.cell.styles.textColor = [127, 29, 29];
                    return;
                }

                if (isAttendanceDayColumn && this.isPermissionAttendanceCell(data.cell.raw)) {
                    data.cell.styles.fillColor = [219, 234, 254];
                    data.cell.styles.textColor = [30, 64, 175];
                    return;
                }

                if (isAttendanceDayColumn && this.isLateAttendanceCell(data.cell.raw)) {
                    data.cell.styles.fillColor = [254, 240, 138];
                    data.cell.styles.textColor = [113, 63, 18];
                    return;
                }

                if (column?.key === 'saturdayStatus' && data.cell.raw === 'Pendiente') {
                    data.cell.styles.fillColor = [254, 226, 226];
                    data.cell.styles.textColor = [127, 29, 29];
                }
            }
        });

        this.removeTrailingBlankPdfPages(doc);
        doc.save(`reporte-asistencia-${this.formatPdfFileDate(week)}.pdf`);
    }

    private extractPeriod(rows: string[][]) {
        const fallback = { start: new Date(), end: new Date() };
        const periodRow = rows.find((row) => row.some((cell) => String(cell).includes('~')));
        const text = periodRow?.join(' ') ?? '';
        const match = text.match(/(\d{4})\/(\d{2})\/(\d{2})\s*~\s*(?:(\d{4})\/)?(\d{2})\/(\d{2})/);
        if (!match) return fallback;

        const startYear = Number(match[1]);
        const start = new Date(startYear, Number(match[2]) - 1, Number(match[3]));
        const endYear = Number(match[4] ?? match[1]);
        const end = new Date(endYear, Number(match[5]) - 1, Number(match[6]));
        return { start, end };
    }

    private extractLogs(rows: string[][]): ImportedEmployeeLog[] {
        const logs: ImportedEmployeeLog[] = [];

        rows.forEach((row, index) => {
            const nameIndex = row.findIndex((cell) => String(cell).trim().toLowerCase() === 'name :');
            if (nameIndex < 0) return;

            const deptIndex = row.findIndex((cell) => String(cell).trim().toLowerCase() === 'dept :');
            const employeeId = this.extractEmployeeId(row, nameIndex);
            const employee = String(row[nameIndex + 2] ?? '').trim();
            const department = String(deptIndex >= 0 ? row[deptIndex + 2] : 'Sin departamento').trim() || 'Sin departamento';
            const dayRow = rows[index - 1] ?? [];
            const punchesRow = rows[index + 1] ?? [];
            const punchesByDay: Record<number, string[]> = {};

            dayRow.forEach((cell, cellIndex) => {
                const day = Number(String(cell).trim());
                if (!day || day > 31) return;
                punchesByDay[day] = this.extractTimes(String(punchesRow[cellIndex] ?? ''));
            });

            if (employee) {
                logs.push({ employeeId, department, employee: this.toTitleCase(employee), punchesByDay, permissionsByDay: {} });
            }
        });

        return logs;
    }

    private extractEmployeeId(row: string[], nameIndex: number) {
        const employeeIdLabelIndex = row.findIndex((cell) => {
            const normalizedCell = this.normalize(String(cell))
                .replace(/[.:]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            return /^(no|num|numero|id|ac no|employee id|numero de empleado)$/.test(normalizedCell);
        });
        const searchStart = employeeIdLabelIndex >= 0 ? employeeIdLabelIndex + 1 : 0;
        const searchEnd = employeeIdLabelIndex >= 0 ? Math.min(row.length, employeeIdLabelIndex + 4) : row.length;

        for (let index = searchStart; index < searchEnd; index += 1) {
            const value = String(row[index] ?? '').trim();
            if (index === nameIndex + 2) continue;
            if (/^\d+$/.test(value)) return value;
        }

        return undefined;
    }

    private buildWeeks(start: Date, end: Date) {
        const weeks: AttendanceWeek[] = [];
        const cursor = new Date(start);
        const daysFromMonday = (cursor.getDay() + 6) % 7;
        cursor.setDate(cursor.getDate() - daysFromMonday);

        while (cursor <= end) {
            const dates = Array.from({ length: 6 }, (_, offset) => new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + offset)).filter((date) => date >= start && date <= end);
            if (this.isReportWeek(dates)) {
                weeks.push({
                    label: `${this.formatShortDate(dates[0])} - ${this.formatShortDate(dates[dates.length - 1])}`,
                    dates
                });
            }
            cursor.setDate(cursor.getDate() + 7);
        }

        return weeks;
    }

    private isReportWeek(dates: Date[]) {
        return dates.some((date) => date.getDay() >= 1 && date.getDay() <= 5);
    }

    private buildReport(logs: ImportedEmployeeLog[], weekDates: Date[]) {
        const dayFields: Array<keyof Pick<AttendanceSummaryRow, 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday'>> = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

        return logs.map((log) => {
            const row: AttendanceSummaryRow = {
                employeeId: log.employeeId,
                department: this.resolveDepartment(log),
                employee: log.employee,
                monday: 'No aplica',
                tuesday: 'No aplica',
                wednesday: 'No aplica',
                thursday: 'No aplica',
                friday: 'No aplica',
                saturday: 'No aplica',
                saturdayDueDate: 'No generado',
                saturdayStatus: 'Sin sábado',
                observations: 'Correcto',
                lateCount: 0,
                permissionLateCount: 0,
                accumulatedLateCount: 0,
                accumulatedSaturdayCount: 0,
                permissionOriginalValues: {},
                forgivenLateCount: false,
                forgivenAccumulatedLateCount: false,
                forgivenAccumulatedSaturdayCount: false,
                forgivenOriginalAccumulatedLateCount: undefined,
                forgivenOriginalAccumulatedSaturdayCount: undefined,
                forgivenOriginalSaturday: undefined,
                forgivenOriginalSaturdayDueDate: undefined,
                forgivenOriginalSaturdayStatus: undefined,
                severity: 'success' as AttendanceSeverity
            };

            weekDates.forEach((date, index) => {
                const field = dayFields[index];
                if (!field) return;

                const punches = log.punchesByDay[date.getDate()] ?? [];
                const isSaturday = date.getDay() === 6;
                const hasPermission = Boolean(log.permissionsByDay[date.getDate()]);
                const hasVacation = this.isVacationDate(log, date);
                const originalValue = isSaturday ? this.formatSaturday(date, punches) : this.formatWorkday(punches);
                row[field] = hasVacation ? 'Vacaciones' : hasPermission ? 'Permiso' : originalValue;

                if (hasVacation) {
                    return;
                }

                if (hasPermission) {
                    row.permissionOriginalValues = {
                        ...(row.permissionOriginalValues || {}),
                        [field]: originalValue
                    };
                    row.permissionLateCount += 1;
                    return;
                }

                if (!isSaturday && this.isLate(punches[0])) {
                    row.lateCount += 1;
                }
            });

            const lateBalance = this.calculateLateBalanceUntilWeek(log, weekDates);
            row.accumulatedLateCount = lateBalance.accumulatedLateCount;
            row.accumulatedSaturdayCount = lateBalance.pendingSaturdayDebtCount;
            row.saturdayDueDate = row.accumulatedSaturdayCount > 0 ? this.formatNumericDate(this.getSaturdayForWeek(weekDates)) : 'No generado';
            row.saturdayStatus = this.resolveSaturdayStatus(row.accumulatedSaturdayCount, lateBalance.coveredSaturdayCount);

            if (row.accumulatedSaturdayCount > 0 && row.saturday === 'No aplica') {
                row.saturday = 'Sin registro';
            }

            const missingCount = this.countMissingDays(row);

            if (row.lateCount > 0 || row.accumulatedSaturdayCount > 0 || row.accumulatedLateCount > 0 || lateBalance.coveredSaturdayCount > 0 || missingCount > 0) {
                row.observations = this.formatLateObservations(row.lateCount, row.accumulatedSaturdayCount, row.accumulatedLateCount, lateBalance.coveredSaturdayCount, missingCount);
                row.severity = row.accumulatedSaturdayCount > 0 || missingCount > 0 ? 'danger' : 'warn';
            }

            return row;
        });
    }

    private calculateLateBalanceUntilWeek(log: ImportedEmployeeLog, weekDates: Date[]) {
        const weekEnd = weekDates[weekDates.length - 1];
        const balance = {
            accumulatedLateCount: 0,
            pendingSaturdayDebtCount: 0,
            coveredSaturdayCount: 0
        };
        if (!weekEnd) return balance;

        this.weeks()
            .flatMap((week) => week.dates)
            .filter((date) => date <= weekEnd)
            .forEach((date) => {
                const punches = log.punchesByDay[date.getDate()] ?? [];

                if (this.isVacationDate(log, date)) return;
                if (log.permissionsByDay[date.getDate()]) return;

                if (date.getDay() === 6) {
                    if (punches.length > 0 && balance.pendingSaturdayDebtCount > 0) {
                        balance.pendingSaturdayDebtCount -= 1;
                        balance.coveredSaturdayCount += 1;
                    }
                    return;
                }

                if (!this.isLate(punches[0])) return;

                balance.accumulatedLateCount += 1;

                if (balance.accumulatedLateCount === this.lateRecordsForSaturday()) {
                    balance.pendingSaturdayDebtCount += 1;
                    balance.accumulatedLateCount = 0;
                }
            });

        return balance;
    }

    private formatLateObservations(lateCount: number, saturdayDebtCount: number, accumulatedLateCount: number, coveredSaturdayCount: number, missingCount = 0) {
        const parts: string[] = [];

        if (missingCount > 0) {
            parts.push(`${missingCount} falta${missingCount === 1 ? '' : 's'}`);
        }

        if (lateCount > 0) {
            parts.push(`${lateCount} retardo${lateCount === 1 ? '' : 's'} semana`);
        }

        if (coveredSaturdayCount > 0) {
            parts.push(`Cubrio ${coveredSaturdayCount} sabado${coveredSaturdayCount === 1 ? '' : 's'}`);
        }

        if (saturdayDebtCount > 0) {
            parts.push(`Debe ${saturdayDebtCount} sabado${saturdayDebtCount === 1 ? '' : 's'}`);
        }

        if (accumulatedLateCount > 0) {
            parts.push(`${accumulatedLateCount} día${accumulatedLateCount === 1 ? '' : 's'} acumulado${accumulatedLateCount === 1 ? '' : 's'}`);
        }

        return parts.join(' | ');
    }

    private resolveDepartment(log: ImportedEmployeeLog) {
        const normalizedEmployee = this.normalize(log.employee);
        const override = Object.entries(this.departmentOverrides).find(([employee]) => normalizedEmployee.includes(employee))?.[1];
        if (override) return override;

        const department = this.toTitleCase(log.department);
        return department.toLowerCase() === 'unset' ? 'Sin departamento' : department;
    }

    private extractTimes(value: string) {
        return value.match(/\d{1,2}:\d{2}/g) ?? [];
    }

    private formatWorkday(punches: string[]) {
        if (punches.length === 0) return 'Falta';
        if (punches.length === 1) return punches[0];
        return `${punches[0]} - ${punches[punches.length - 1]}`;
    }

    private formatSaturday(date: Date, punches: string[]) {
        if (punches.length === 0) return 'No aplica';
        return this.formatWorkday(punches);
    }

    private isLate(value?: string) {
        if (!value) return false;
        const [hours, minutes] = value.split(':').map(Number);
        const arrivalMinutes = hours * 60 + minutes;
        const limitMinutes = this.getWorkdayStartMinutes() + this.lateToleranceMinutes();
        return arrivalMinutes > limitMinutes;
    }

    private getWorkdayStartMinutes() {
        const [hours, minutes] = this.workdayStartTime().split(':').map(Number);
        if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 9 * 60;

        return hours * 60 + minutes;
    }

    private formatMinutesAsTime(value: number) {
        const hours = Math.floor(value / 60) % 24;
        const minutes = value % 60;

        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }

    isLateAttendanceCell(value: unknown) {
        const firstPunch = this.extractTimes(String(value ?? ''))[0];
        return this.isLate(firstPunch);
    }

    isMissingAttendanceCell(value: unknown) {
        const normalizedValue = String(value ?? '').trim();
        return normalizedValue === 'Falta' || normalizedValue === 'Sin registro';
    }

    isPermissionAttendanceCell(value: unknown) {
        return String(value ?? '').trim() === 'Permiso';
    }

    isVacationAttendanceCell(value: unknown) {
        return String(value ?? '').trim() === 'Vacaciones';
    }

    private async loadApprovedVacationRequests(start: Date, end: Date) {
        try {
            const response = await firstValueFrom(
                this.http.get<ApiResponse<{ data: VacationRequestRecord[] }>>(`${this.vacationRequestsUrl}/get-all`, {
                    params: {
                        status: 'Aprobada',
                        page: '1',
                        limit: '500'
                    },
                    headers: getAuthHeaders()
                })
            );

            const startKey = this.formatIsoDate(start);
            const endKey = this.formatIsoDate(end);
            this.approvedVacationRequests = (response.data.data || []).filter((request) => request.startDate <= endKey && request.endDate >= startKey);
        } catch (error) {
            this.approvedVacationRequests = [];
            console.error('No pude cargar las vacaciones aprobadas para cruzarlas con asistencia.', error);
        }
    }

    private isVacationDate(log: ImportedEmployeeLog, date: Date) {
        if (date.getDay() === 0 || date.getDay() === 6 || this.isFederalHoliday(date)) return false;

        const dateKey = this.formatIsoDate(date);

        return this.approvedVacationRequests.some((request) => {
            if (request.status !== 'Aprobada') return false;
            if (request.startDate > dateKey || request.endDate < dateKey) return false;

            const requestEmployeeId = this.normalize(request.employeeId || '');
            const logEmployeeId = this.normalize(log.employeeId || '');
            if (requestEmployeeId && logEmployeeId && requestEmployeeId === logEmployeeId) return true;

            return this.normalize(request.employeeName) === this.normalize(log.employee);
        });
    }

    private isFederalHoliday(date: Date) {
        return getMexicoFederalHolidayDates(date.getFullYear()).has(this.formatIsoDate(date));
    }

    private getPdfColumnValue(row: AttendanceSummaryRow, columnKey: AttendancePdfColumnKey) {
        const value = row[columnKey];
        return typeof value === 'number' ? String(value) : value;
    }

    private getPdfColumnStyles(columns: AttendancePdfColumn[]) {
        return columns.reduce<Record<number, { cellWidth: number; halign?: 'left' | 'center' }>>((styles, column, index) => {
            styles[index] = {
                cellWidth: column.width,
                halign: column.align || 'center'
            };

            return styles;
        }, {});
    }

    private isAttendanceDayColumn(columnKey: AttendancePdfColumnKey) {
        return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].includes(columnKey);
    }

    private resolveSaturdayStatus(pendingSaturdayDebtCount: number, coveredSaturdayCount: number) {
        if (pendingSaturdayDebtCount > 0) return 'Pendiente';
        if (coveredSaturdayCount > 0) return 'Se presentó';
        return 'Sin sábado';
    }

    private getSaturdayForWeek(weekDates: Date[]) {
        const saturday = weekDates.find((date) => date.getDay() === 6);
        if (saturday) return saturday;

        const lastDate = weekDates[weekDates.length - 1] ?? new Date();
        const nextSaturday = new Date(lastDate);
        nextSaturday.setDate(lastDate.getDate() + ((6 - lastDate.getDay() + 7) % 7));
        return nextSaturday;
    }

    private countMissingDays(row: AttendanceSummaryRow) {
        return [row.monday, row.tuesday, row.wednesday, row.thursday, row.friday].filter((value) => value === 'Falta').length;
    }

    private getDayFieldIndex(field: AttendanceDayField) {
        const dayFields: AttendanceDayField[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        return dayFields.indexOf(field);
    }

    private formatShortDate(date: Date) {
        return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
    }

    private formatNumericDate(date: Date) {
        return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
    }

    private formatPdfFileDate(week?: AttendanceWeek) {
        if (!week?.dates.length) {
            return this.formatFileDate(new Date());
        }

        const firstDate = week.dates[0];
        const lastDate = week.dates[week.dates.length - 1];
        return `${this.formatFileDate(firstDate)}_a_${this.formatFileDate(lastDate)}`;
    }

    private getWeekKey(week: AttendanceWeek) {
        const firstDate = week.dates[0];
        const lastDate = week.dates[week.dates.length - 1];
        return `${this.formatIsoDate(firstDate)}_${this.formatIsoDate(lastDate)}`;
    }

    private removeTrailingBlankPdfPages(doc: jsPDF) {
        const internalDoc = doc.internal as unknown as { pages?: unknown[][] };
        const pageCount = doc.getNumberOfPages();

        if (pageCount <= 1) return;

        const lastPage = internalDoc.pages?.[pageCount];
        if (Array.isArray(lastPage) && lastPage.length <= 2) {
            doc.deletePage(pageCount);
        }
    }

    private formatIsoDate(date: Date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    private formatFileDate(date: Date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${day}-${month}-${year}`;
    }

    private buildDatesFromRange(startDate: string, endDate: string) {
        const dates: Date[] = [];
        const cursor = new Date(`${startDate}T00:00:00`);
        const end = new Date(`${endDate}T00:00:00`);

        while (cursor <= end) {
            dates.push(new Date(cursor));
            cursor.setDate(cursor.getDate() + 1);
        }

        return dates;
    }

    private mapStoredRecordToSummary(row: AttendanceStoredRecord): AttendanceSummaryRow {
        const summaryRow: AttendanceSummaryRow = {
            attendanceRecordId: row._id,
            employeeId: row.employeeId,
            department: row.department,
            employee: row.employee || row.employeeName,
            monday: row.monday,
            tuesday: row.tuesday,
            wednesday: row.wednesday,
            thursday: row.thursday,
            friday: row.friday,
            saturday: row.saturday,
            saturdayDueDate: row.saturdayDueDate,
            saturdayStatus: row.saturdayStatus,
            observations: row.observations,
            lateCount: row.lateCount,
            permissionLateCount: row.permissionLateCount,
            accumulatedLateCount: row.accumulatedLateCount,
            accumulatedSaturdayCount: row.accumulatedSaturdayCount,
            permissionOriginalValues: row.permissionOriginalValues,
            forgivenLateCount: row.forgivenLateCount,
            forgivenAccumulatedLateCount: row.forgivenAccumulatedLateCount,
            forgivenAccumulatedSaturdayCount: row.forgivenAccumulatedSaturdayCount,
            forgivenOriginalAccumulatedLateCount: row.forgivenOriginalAccumulatedLateCount,
            forgivenOriginalAccumulatedSaturdayCount: row.forgivenOriginalAccumulatedSaturdayCount,
            forgivenOriginalSaturday: row.forgivenOriginalSaturday,
            forgivenOriginalSaturdayDueDate: row.forgivenOriginalSaturdayDueDate,
            forgivenOriginalSaturdayStatus: row.forgivenOriginalSaturdayStatus,
            severity: 'success'
        };

        summaryRow.severity = this.resolveRowSeverity(summaryRow);

        return summaryRow;
    }

    private toTitleCase(value: string) {
        return value
            .trim()
            .toLowerCase()
            .replace(/\b\w/g, (letter) => letter.toUpperCase());
    }

    private normalize(value: string) {
        return value
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLowerCase();
    }

    private applyPermissionToImportedReport(employee: string, field: AttendanceDayField, hasPermission: boolean, attendanceRecordId: string, updatedRow?: AttendanceSummaryRow | null) {
        const rows = this.importedReport();
        if (!rows) return;

        const updatedRows = rows.map((row) => {
            if (row.employee !== employee || row.attendanceRecordId !== attendanceRecordId) return row;

            return updatedRow || this.buildPermissionUpdatedRow(row, field, hasPermission);
        });

        this.importedReport.set(updatedRows);
        this.restoredSnapshotReports[this.selectedWeekIndex()] = updatedRows;
        this.saveReportSnapshot();
    }

    private applyPermissionToLocalReport(employee: string, field: AttendanceDayField, hasPermission: boolean) {
        const rows = this.importedReport();
        if (!rows) return;

        const updatedRows = rows.map((row) => {
            if (row.employee !== employee) return row;

            return this.buildPermissionUpdatedRow(row, field, hasPermission);
        });

        this.importedReport.set(updatedRows);
        this.restoredSnapshotReports[this.selectedWeekIndex()] = updatedRows;
        this.saveReportSnapshot();
    }

    private applyForgivenessToImportedReport(employee: string, options: AttendanceForgivenessOptions, attendanceRecordId?: string, updatedRow?: AttendanceSummaryRow | null) {
        const rows = this.importedReport();
        if (!rows) return;

        const updatedRows = rows.map((row) => {
            const sameStoredRecord = attendanceRecordId && row.attendanceRecordId === attendanceRecordId;
            const sameLocalRecord = !attendanceRecordId && row.employee === employee;
            if (!sameStoredRecord && !sameLocalRecord) return row;

            return updatedRow || this.buildForgivenRow(row, options);
        });

        this.importedReport.set(updatedRows);
        this.restoredSnapshotReports[this.selectedWeekIndex()] = updatedRows;
        this.saveReportSnapshot();
    }

    private applyCachedImportForgiveness(rows: AttendanceSummaryRow[], weekIndex: number) {
        const cachedRows = this.restoredSnapshotReports[weekIndex];
        if (!cachedRows?.length) return rows;

        return rows.map((row) => {
            const cachedRow = cachedRows.find((candidate) =>
                row.employeeId && candidate.employeeId
                    ? row.employeeId === candidate.employeeId
                    : this.normalize(row.employee) === this.normalize(candidate.employee)
            );
            if (!cachedRow) return row;

            return this.buildForgivenRow(row, {
                forgiveLateCount: Boolean(cachedRow.forgivenLateCount),
                forgiveAccumulatedSaturdayCount: Boolean(cachedRow.forgivenAccumulatedSaturdayCount),
                forgiveAccumulatedLateCount: Boolean(cachedRow.forgivenAccumulatedLateCount)
            });
        });
    }

    private buildForgivenRow(row: AttendanceSummaryRow, options: AttendanceForgivenessOptions): AttendanceSummaryRow {
        const nextRow: AttendanceSummaryRow = {
            ...row,
            forgivenLateCount: 'forgiveLateCount' in options ? Boolean(options.forgiveLateCount) : row.forgivenLateCount,
            forgivenAccumulatedLateCount: 'forgiveAccumulatedLateCount' in options ? Boolean(options.forgiveAccumulatedLateCount) : row.forgivenAccumulatedLateCount,
            forgivenAccumulatedSaturdayCount: 'forgiveAccumulatedSaturdayCount' in options ? Boolean(options.forgiveAccumulatedSaturdayCount) : row.forgivenAccumulatedSaturdayCount
        };

        if ('forgiveLateCount' in options) {
            nextRow.lateCount = options.forgiveLateCount ? 0 : this.countLateWorkdays(row);
        }

        if ('forgiveAccumulatedLateCount' in options) {
            if (options.forgiveAccumulatedLateCount) {
                nextRow.forgivenOriginalAccumulatedLateCount = row.forgivenOriginalAccumulatedLateCount ?? row.accumulatedLateCount;
                nextRow.accumulatedLateCount = 0;
            } else {
                nextRow.accumulatedLateCount = row.forgivenOriginalAccumulatedLateCount ?? row.accumulatedLateCount;
            }
        }

        if ('forgiveAccumulatedSaturdayCount' in options) {
            if (options.forgiveAccumulatedSaturdayCount) {
                nextRow.forgivenOriginalAccumulatedSaturdayCount = row.forgivenOriginalAccumulatedSaturdayCount ?? row.accumulatedSaturdayCount;
                nextRow.forgivenOriginalSaturday = row.forgivenOriginalSaturday ?? row.saturday;
                nextRow.forgivenOriginalSaturdayDueDate = row.forgivenOriginalSaturdayDueDate ?? row.saturdayDueDate;
                nextRow.forgivenOriginalSaturdayStatus = row.forgivenOriginalSaturdayStatus ?? row.saturdayStatus;
                nextRow.accumulatedSaturdayCount = 0;
                nextRow.saturdayDueDate = 'No generado';
                nextRow.saturdayStatus = 'Sin sábado';
                if (nextRow.saturday === 'Sin registro') {
                    nextRow.saturday = 'No aplica';
                }
            } else {
                nextRow.accumulatedSaturdayCount = row.forgivenOriginalAccumulatedSaturdayCount ?? row.accumulatedSaturdayCount;
                nextRow.saturday = row.forgivenOriginalSaturday ?? row.saturday;
                nextRow.saturdayDueDate = row.forgivenOriginalSaturdayDueDate ?? row.saturdayDueDate;
                nextRow.saturdayStatus = row.forgivenOriginalSaturdayStatus ?? row.saturdayStatus;
            }
        }

        nextRow.severity = this.resolveRowSeverity(nextRow);
        nextRow.observations = this.buildStoredObservation(nextRow);

        return nextRow;
    }

    private countLateWorkdays(row: AttendanceSummaryRow) {
        return [row.monday, row.tuesday, row.wednesday, row.thursday, row.friday].filter((value) => this.isLateAttendanceCell(value)).length;
    }

    private buildPermissionUpdatedRow(row: AttendanceSummaryRow, field: AttendanceDayField, hasPermission: boolean): AttendanceSummaryRow {
        const currentValue = row[field];
        const wasPermission = this.isPermissionAttendanceCell(currentValue);
        const wasLate = this.isLateAttendanceCell(currentValue);
        const originalValue = row.permissionOriginalValues?.[field] || 'Falta';
        const nextRow: AttendanceSummaryRow = {
            ...row,
            permissionOriginalValues: { ...(row.permissionOriginalValues || {}) },
            [field]: hasPermission ? 'Permiso' : originalValue
        };

        if (hasPermission && !wasPermission) {
            nextRow.permissionOriginalValues = {
                ...(nextRow.permissionOriginalValues || {}),
                [field]: currentValue === 'Permiso' ? originalValue : currentValue
            };
            nextRow.permissionLateCount += 1;
            if (wasLate) nextRow.lateCount = Math.max(0, nextRow.lateCount - 1);
        }

        if (!hasPermission && wasPermission) {
            const nextPermissionOriginalValues = { ...(nextRow.permissionOriginalValues || {}) };
            delete nextPermissionOriginalValues[field];
            nextRow.permissionOriginalValues = nextPermissionOriginalValues;
            nextRow.permissionLateCount = Math.max(0, nextRow.permissionLateCount - 1);
            if (this.isLateAttendanceCell(originalValue)) nextRow.lateCount += 1;
        }

        nextRow.severity = this.resolveRowSeverity(nextRow);
        nextRow.observations = this.buildStoredObservation(nextRow);

        return nextRow;
    }

    private buildStoredObservation(row: AttendanceSummaryRow) {
        const missingCount = this.countMissingDays(row);

        if (row.lateCount === 0 && row.accumulatedSaturdayCount === 0 && row.accumulatedLateCount === 0 && row.permissionLateCount === 0 && missingCount === 0) {
            return 'Correcto';
        }

        const observations = this.formatLateObservations(row.lateCount, row.accumulatedSaturdayCount, row.accumulatedLateCount, 0, missingCount);
        const permissionText = row.permissionLateCount > 0 ? `${row.permissionLateCount} permiso${row.permissionLateCount === 1 ? '' : 's'}` : '';

        return [observations, permissionText].filter(Boolean).join(' | ');
    }

    private sortAttendanceRows(rows: AttendanceSummaryRow[]) {
        return [...rows].sort((a, b) => {
            const departmentOrder = this.getDepartmentOrder(a.department) - this.getDepartmentOrder(b.department);
            if (departmentOrder !== 0) return departmentOrder;

            return a.employee.localeCompare(b.employee, 'es-MX');
        });
    }

    private resolveRowSeverity(row: AttendanceSummaryRow): AttendanceSeverity {
        if (row.accumulatedSaturdayCount > 0 || this.countMissingDays(row) > 0) return 'danger';
        if (row.lateCount > 0 || row.accumulatedLateCount > 0) return 'warn';
        return 'success';
    }

    private getDepartmentOrder(department: string) {
        const normalizedDepartment = this.normalize(department);
        if (normalizedDepartment.includes('direccion')) return 0;
        if (normalizedDepartment.includes('desarrollo')) return 1;
        return 2;
    }

    private loadExcludedPeople() {
        if (typeof window === 'undefined') return this.defaultExcludedPeople;

        const storedValue = localStorage.getItem(this.excludedPeopleStorageKey);
        if (!storedValue) return this.defaultExcludedPeople;

        try {
            const parsedValue = JSON.parse(storedValue);
            return Array.isArray(parsedValue) && parsedValue.every((item) => typeof item === 'string') ? parsedValue : this.defaultExcludedPeople;
        } catch {
            return this.defaultExcludedPeople;
        }
    }

    private saveExcludedPeople(people: string[]) {
        if (typeof window === 'undefined') return;

        localStorage.setItem(this.excludedPeopleStorageKey, JSON.stringify(people));
    }

    private saveSelectedStoredWeekKey(weekKey: string) {
        if (typeof window === 'undefined') return;

        localStorage.setItem(this.selectedStoredWeekStorageKey, weekKey);
    }

    private saveReportSnapshot() {
        this.clearReportSnapshotResidue();
    }

    private clearSelectedStoredWeekKey() {
        if (typeof window === 'undefined') return;

        localStorage.removeItem(this.selectedStoredWeekStorageKey);
    }

    private async getStoredWeeksForReport(firstRow: AttendanceStoredRecord) {
        const firstDate = new Date(`${firstRow.weekStartDate}T00:00:00`);
        const year = firstDate.getFullYear();
        const month = firstDate.getMonth() + 1;

        await this.loadStoredImports({ year, month });

        const monthToken = String(month).padStart(2, '0');
        const yearToken = String(year);
        const weeks = this.storedImports()
            .flatMap((importItem) => importItem.weeks || [])
            .filter((week) => {
                const belongsToPeriod = week.weekStartDate.startsWith(`${yearToken}-${monthToken}`) || week.weekEndDate.startsWith(`${yearToken}-${monthToken}`);
                return week.status === 'GUARDADA' && belongsToPeriod;
            });

        const uniqueWeeks = Array.from(new Map(weeks.map((week) => [week.weekKey, week])).values()).sort((a, b) => a.weekStartDate.localeCompare(b.weekStartDate));

        if (uniqueWeeks.length === 0) {
            return [
                {
                    label: firstRow.weekLabel,
                    dates: this.buildDatesFromRange(firstRow.weekStartDate, firstRow.weekEndDate),
                    weekKey: firstRow.weekKey
                }
            ];
        }

        return uniqueWeeks.map((week) => ({
            label: week.weekLabel,
            dates: this.buildDatesFromRange(week.weekStartDate, week.weekEndDate),
            weekKey: week.weekKey
        }));
    }

    private getDefaultPdfColumnVisibility() {
        return this.pdfColumns.reduce<Record<string, boolean>>((visibility, column) => {
            visibility[column.key] = true;
            return visibility;
        }, {});
    }

    private getPdfRowKey(row: AttendanceSummaryRow) {
        return this.normalize(`${row.department}-${row.employee}`);
    }

    private getHeaders() {
        return getAuthHeaders();
    }
}
