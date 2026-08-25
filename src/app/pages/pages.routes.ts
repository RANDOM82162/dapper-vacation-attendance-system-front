import { Routes } from '@angular/router';
import { Crud } from './crud/crud';
import { Invoice } from './invoice/invoice';

export default [
    { path: 'crud', data: { breadcrumb: 'Crud' }, component: Crud },
    { path: 'invoice', data: { breadcrumb: 'Invoice' }, component: Invoice },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
