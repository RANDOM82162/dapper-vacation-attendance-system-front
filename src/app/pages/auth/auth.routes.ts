import { Routes } from '@angular/router';
import { AccessDenied } from '@/app/pages/auth/acccessdenied/accessdenied';
import { Error } from '@/app/pages/auth/error/error';
import { Login } from '@/app/pages/auth/login/login';
import { ForgotPassword } from '@/app/pages/auth/forgotpassword/forgotpassword';
import { Register } from '@/app/pages/auth/register/register';
import { NewPassword } from '@/app/pages/auth/newpassword/newpassword';
import { Verification } from '@/app/pages/auth/verification/verification';
import { LockScreenComponent } from '@/app/pages/auth/lockscreen/lockscreen';

export default [
    { path: 'error', component: Error },
    { path: 'access', component: AccessDenied },
    { path: 'login', component: Login },
    { path: 'forgotpassword', component: ForgotPassword },
    { path: 'register', component: Register },
    { path: 'newpassword', component: NewPassword },
    { path: 'verification', component: Verification },
    { path: 'lockscreen', component: LockScreenComponent },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
