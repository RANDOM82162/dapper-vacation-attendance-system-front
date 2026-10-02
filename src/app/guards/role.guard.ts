import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@/app/services/auth.service';
import { type UserRole } from '@/app/pages/hr/role-context.service';

export const authGuard: CanActivateChildFn = async () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
        return router.createUrlTree(['/auth/login']);
    }

    if (auth.currentEmployee()) return true;

    try {
        await auth.loadCurrentEmployee();
        return true;
    } catch {
        auth.logout();
        return router.createUrlTree(['/auth/login']);
    }
};

export const roleGuard: CanActivateFn = (route) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const allowedRoles = route.data?.['roles'] as UserRole[] | undefined;
    const directionRoles = route.data?.['directionRoles'] as UserRole[] | undefined;
    const currentRole = auth.getCurrentUserRole();

    if (!currentRole) {
        auth.logout();
        return router.createUrlTree(['/auth/login']);
    }

    if (!allowedRoles?.length || allowedRoles.includes(currentRole)) {
        return true;
    }

    if (directionRoles?.includes(currentRole) && isDirectionDepartment(auth.getEmployeeDepartment())) {
        return true;
    }

    return router.createUrlTree(['/']);
};

function isDirectionDepartment(department: string) {
    return department
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase()
        .includes('direccion');
}
