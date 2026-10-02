import { Routes } from '@angular/router';
import { AppLayout } from '@/app/layout/components/layout/app.layout';
import { authGuard, roleGuard } from '@/app/guards/role.guard';

export const appRoutes: Routes = [
    {
        path: '',
        component: AppLayout,
        canActivateChild: [authGuard],
        children: [
            { path: '', data: { breadcrumb: 'Panel principal' }, loadComponent: () => import('@/app/pages/hr/dashboard/hr-dashboard').then((c) => c.HrDashboard) },
            { path: 'vacaciones/nueva', canActivate: [roleGuard], data: { breadcrumb: ['Vacaciones', 'Nueva solicitud de vacaciones'], roles: ['employee', 'manager'] }, loadComponent: () => import('@/app/pages/hr/vacations/new-vacation-request').then((c) => c.NewVacationRequest) },
            { path: 'vacaciones/mis-solicitudes', canActivate: [roleGuard], data: { breadcrumb: ['Vacaciones', 'Mis solicitudes'], roles: ['employee', 'manager'] }, loadComponent: () => import('@/app/pages/hr/vacations/my-requests').then((c) => c.MyRequests) },
            { path: 'vacaciones/aprobaciones', canActivate: [roleGuard], data: { breadcrumb: ['Vacaciones', 'Solicitudes por aprobar'], roles: ['manager', 'admin'] }, loadComponent: () => import('@/app/pages/hr/vacations/approvals').then((c) => c.VacationApprovals) },
            { path: 'vacaciones/historial', canActivate: [roleGuard], data: { breadcrumb: ['Vacaciones', 'Historial de solicitudes'], roles: ['manager', 'admin'] }, loadComponent: () => import('@/app/pages/hr/vacations/request-history').then((c) => c.RequestHistory) },
            { path: 'vacaciones/saldos', canActivate: [roleGuard], data: { breadcrumb: ['Vacaciones', 'Días disponibles'], roles: ['employee', 'manager', 'admin'] }, loadComponent: () => import('@/app/pages/hr/vacations/vacation-balance').then((c) => c.VacationBalance) },
            { path: 'asistencia/dashboard', canActivate: [roleGuard], data: { breadcrumb: ['Asistencia', 'Dashboard semanal'], roles: ['manager', 'admin'], directionRoles: ['employee'] }, loadComponent: () => import('@/app/pages/hr/attendance/weekly-attendance-dashboard').then((c) => c.WeeklyAttendanceDashboard) },
            { path: 'asistencia/cargar', canActivate: [roleGuard], data: { breadcrumb: ['Asistencia', 'Cargar registro de asistencia'], roles: ['admin'], directionRoles: ['employee', 'manager'] }, loadComponent: () => import('@/app/pages/hr/attendance/upload-attendance').then((c) => c.UploadAttendance) },
            { path: 'asistencia/reporte', canActivate: [roleGuard], data: { breadcrumb: ['Asistencia', 'Reporte semanal de asistencia'], roles: ['employee', 'manager', 'admin'] }, loadComponent: () => import('@/app/pages/hr/attendance/attendance-report').then((c) => c.AttendanceReport) },
            { path: 'admin/empleados', canActivate: [roleGuard], data: { breadcrumb: ['Administración', 'Empleados'], roles: ['admin'] }, loadComponent: () => import('@/app/pages/hr/admin/employees').then((c) => c.Employees) },
            { path: 'cuenta/perfil', data: { breadcrumb: ['Cuenta', 'Perfil'] }, loadComponent: () => import('@/app/pages/account/profile').then((c) => c.AccountProfile) },
            { path: 'cuenta/notificaciones', data: { breadcrumb: ['Cuenta', 'Notificaciones'] }, loadComponent: () => import('@/app/pages/account/notifications').then((c) => c.AccountNotifications) },
            { path: 'cuenta/configuracion', data: { breadcrumb: ['Cuenta', 'Configuración'] }, loadComponent: () => import('@/app/pages/account/settings').then((c) => c.AccountSettings) }
        ]
    },
    { path: 'auth', loadChildren: () => import('@/app/pages/auth/auth.routes') },
    { path: 'notfound', loadComponent: () => import('@/app/pages/notfound/notfound').then((c) => c.Notfound) },
    { path: '**', redirectTo: '/notfound' }
];
