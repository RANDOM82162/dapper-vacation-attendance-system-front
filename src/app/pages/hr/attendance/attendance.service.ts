import { Injectable, computed, inject, signal } from '@angular/core';
import { RoleContextService } from '../role-context.service';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export type AttendanceSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

export interface AttendanceSummaryRow {
    department: string;
    employee: string;
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    observations: string;
    lateCount: number;
    permissionLateCount: number;
    accumulatedLateCount: number;
    severity: AttendanceSeverity;
}

export interface AttendanceWeek {
    label: string;
    dates: Date[];
}

interface ImportedEmployeeLog {
    department: string;
    employee: string;
    punchesByDay: Record<number, string[]>;
}

@Injectable({
    providedIn: 'root'
})
export class AttendanceService {
    private readonly roleContext = inject(RoleContextService);

    private readonly currentEmployee = 'Jose Alejandro Paz';

    private readonly excludedManagers = ['saul casal', 'jorge diaz', 'cinthia montoya', 'saul', 'jorge', 'cinthia'];

    private readonly departmentOverrides: Record<string, string> = {
        alonso: 'Desarrollo',
        karen: 'Desarrollo'
    };

    private lastImportedLogs: ImportedEmployeeLog[] = [];

    readonly importedReport = signal<AttendanceSummaryRow[] | null>(null);

    readonly weeks = signal<AttendanceWeek[]>([]);

    readonly selectedWeekIndex = signal<number>(0);

    readonly report: AttendanceSummaryRow[] = [];

    readonly simplifiedReport = computed(() => {
        const source = this.importedReport() ?? this.report;
        const rows = source.filter((row) => !this.isExcludedManager(row.employee));

        if (this.roleContext.currentRole() === 'employee') {
            return rows.filter((row) => row.employee === this.currentEmployee);
        }

        return rows;
    });

    isExcludedManager(employee: string) {
        const normalized = this.normalize(employee);
        return this.excludedManagers.some((manager) => normalized.includes(manager));
    }

    async importWorkbook(file: File) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
        const logsSheetName = workbook.SheetNames.find((name) => name.toLowerCase() === 'logs') ?? workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json<string[]>(workbook.Sheets[logsSheetName], { header: 1, raw: false, defval: '' });
        const period = this.extractPeriod(rows);
        const logs = this.extractLogs(rows);
        const weeks = this.buildWeeks(period.start, period.end);

        this.lastImportedLogs = logs;
        this.weeks.set(weeks);
        this.selectedWeekIndex.set(Math.max(weeks.length - 1, 0));
        this.importedReport.set(this.buildReport(logs, weeks[this.selectedWeekIndex()]?.dates ?? []));
    }

    selectWeek(index: number) {
        const week = this.weeks()[index];
        if (!week) return;

        this.selectedWeekIndex.set(index);
        this.importedReport.set(this.buildReport(this.lastImportedLogs, week.dates));
    }

    generatePdf() {
        const rows = this.simplifiedReport();
        const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });
        const week = this.weeks()[this.selectedWeekIndex()];
        const title = week ? `Reporte de asistencia - ${week.label}` : 'Reporte de asistencia semanal';

        doc.setFontSize(14);
        doc.text(title, 40, 34);

        autoTable(doc, {
            startY: 52,
            head: [[
                'Departamento',
                'Empleado',
                'Lunes',
                'Martes',
                'Miercoles',
                'Jueves',
                'Viernes',
                'Sabado',
                'Observaciones',
                'Retardos',
                'Con permiso',
                'Acumulados'
            ]],
            body: rows.map((row) => [
                row.department,
                row.employee,
                row.monday,
                row.tuesday,
                row.wednesday,
                row.thursday,
                row.friday,
                row.saturday,
                row.observations,
                String(row.lateCount),
                String(row.permissionLateCount),
                String(row.accumulatedLateCount)
            ]),
            styles: { fontSize: 7, cellPadding: 3, overflow: 'linebreak' },
            headStyles: { fillColor: [31, 41, 55] },
            margin: { left: 24, right: 24 }
        });

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

            if (employee && !this.isExcludedManager(employee)) {
                logs.push({ department, employee: this.toTitleCase(employee), punchesByDay });
            }
        });

        return logs;
    }

    private buildWeeks(start: Date, end: Date) {
        const weeks: AttendanceWeek[] = [];
        const cursor = new Date(start);

        while (cursor <= end) {
            if (cursor.getDay() === 1) {
                const dates = Array.from({ length: 6 }, (_, offset) => new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + offset)).filter((date) => date <= end);
                if (dates.length > 0) {
                    weeks.push({
                        label: `${this.formatShortDate(dates[0])} - ${this.formatShortDate(dates[dates.length - 1])}`,
                        dates
                    });
                }
            }
            cursor.setDate(cursor.getDate() + 1);
        }

        return weeks;
    }

    private buildReport(logs: ImportedEmployeeLog[], weekDates: Date[]) {
        const dayFields: Array<keyof Pick<AttendanceSummaryRow, 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday'>> = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

        return logs.map((log) => {
            const row = {
                department: this.resolveDepartment(log),
                employee: log.employee,
                monday: 'No aplica',
                tuesday: 'No aplica',
                wednesday: 'No aplica',
                thursday: 'No aplica',
                friday: 'No aplica',
                saturday: 'No aplica',
                observations: 'Correcto',
                lateCount: 0,
                permissionLateCount: 0,
                accumulatedLateCount: 0,
                severity: 'success' as AttendanceSeverity
            };

            weekDates.forEach((date, index) => {
                const field = dayFields[index];
                if (!field) return;

                const punches = log.punchesByDay[date.getDate()] ?? [];
                const isSaturday = date.getDay() === 6;
                row[field] = isSaturday ? this.formatSaturday(date, punches) : this.formatWorkday(punches);

                if (!isSaturday && this.isLate(punches[0])) {
                    row.lateCount += 1;
                }
            });

            if (row.lateCount > 0) {
                row.observations = `${row.lateCount} retardo${row.lateCount === 1 ? '' : 's'}`;
                row.accumulatedLateCount = row.lateCount;
                row.severity = row.lateCount >= 3 ? 'danger' : 'warn';
            }

            return row;
        });
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
        return `${this.formatNumericDate(date)} - Asistio`;
    }

    private isLate(value?: string) {
        if (!value) return false;
        const [hours, minutes] = value.split(':').map(Number);
        return hours > 9 || (hours === 9 && minutes > 10);
    }

    private formatShortDate(date: Date) {
        return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
    }

    private formatNumericDate(date: Date) {
        return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
    }

    private formatPdfFileDate(week?: AttendanceWeek) {
        if (!week?.dates.length) {
            return this.formatIsoDate(new Date());
        }

        const firstDate = week.dates[0];
        const lastDate = week.dates[week.dates.length - 1];
        return `${this.formatIsoDate(firstDate)}_a_${this.formatIsoDate(lastDate)}`;
    }

    private formatIsoDate(date: Date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
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
}
