import { Component } from '@angular/core';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { RouterModule } from '@angular/router';

@Component({
    standalone: true,
    selector: 'app-forgot-password',
    imports: [IconField, InputIcon, InputText, ButtonModule, RouterModule],
    templateUrl: './forgotpassword.html'
})
export class ForgotPassword { }
