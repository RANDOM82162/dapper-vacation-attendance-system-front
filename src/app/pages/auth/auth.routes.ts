import { Routes } from '@angular/router';
import { AccessDenied } from '@/app/pages/auth/acccessdenied/accessdenied';
import { Error } from '@/app/pages/auth/error/error';
import { Login } from '@/app/pages/auth/login/login';
import { ForgotPassword } from '@/app/pages/auth/forgotpassword/forgotpassword';
import { NewPassword } from '@/app/pages/auth/newpassword/newpassword';

export default [
    { path: 'error', component: Error },
    { path: 'access', component: AccessDenied },
    { path: 'login', component: Login },
    { path: 'forgotpassword', component: ForgotPassword },
    { path: 'newpassword', component: NewPassword },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
