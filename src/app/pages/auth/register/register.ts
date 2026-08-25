import { Component } from '@angular/core';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { Password } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InputText } from 'primeng/inputtext';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [IconField, InputIcon, Password, ButtonModule, RouterModule, FormsModule, InputText],
    templateUrl: './register.html'
})
export class Register {
    value: string = '';
}
