import { Routes } from '@angular/router';
import { AppLayout } from '@/app/layout/components/layout/app.layout';

export const appRoutes: Routes = [
    {
        path: '',
        component: AppLayout,
        children: [
            { path: '', data: { breadcrumb: 'Panel principal' }, loadComponent: () => import('@/app/pages/hr/dashboard/hr-dashboard').then((c) => c.HrDashboard) },
            { path: 'vacaciones/nueva', data: { breadcrumb: 'Nueva solicitud' }, loadComponent: () => import('@/app/pages/hr/vacations/new-vacation-request').then((c) => c.NewVacationRequest) },
            { path: 'vacaciones/mis-solicitudes', data: { breadcrumb: 'Mis solicitudes' }, loadComponent: () => import('@/app/pages/hr/vacations/my-requests').then((c) => c.MyRequests) },
            { path: 'vacaciones/aprobaciones', data: { breadcrumb: 'Solicitudes por aprobar' }, loadComponent: () => import('@/app/pages/hr/vacations/approvals').then((c) => c.VacationApprovals) },
            { path: 'vacaciones/saldos', data: { breadcrumb: 'Dias disponibles' }, loadComponent: () => import('@/app/pages/hr/vacations/vacation-balance').then((c) => c.VacationBalance) },
            { path: 'asistencia/cargar', data: { breadcrumb: 'Cargar asistencia' }, loadComponent: () => import('@/app/pages/hr/attendance/upload-attendance').then((c) => c.UploadAttendance) },
            { path: 'asistencia/reporte', data: { breadcrumb: 'Reporte semanal' }, loadComponent: () => import('@/app/pages/hr/attendance/attendance-report').then((c) => c.AttendanceReport) },
            { path: 'admin/empleados', data: { breadcrumb: 'Empleados' }, loadComponent: () => import('@/app/pages/hr/admin/employees').then((c) => c.Employees) },
            { path: 'admin/plantillas', data: { breadcrumb: 'Plantillas de respuesta' }, loadComponent: () => import('@/app/pages/hr/admin/templates').then((c) => c.ResponseTemplates) }
        ]
    },
    { path: 'auth', loadChildren: () => import('@/app/pages/auth/auth.routes') },
    { path: 'notfound', loadComponent: () => import('@/app/pages/notfound/notfound').then((c) => c.Notfound) },
    { path: '**', redirectTo: '/notfound' }
];
