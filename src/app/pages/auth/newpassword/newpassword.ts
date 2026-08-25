import { Component } from '@angular/core';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { Password } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { Ripple } from 'primeng/ripple';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-new-password',
    standalone: true,
    imports: [IconField, InputIcon, Password, ButtonModule, RouterModule, FormsModule],
    templateUrl: './newpassword.html'
})
export class NewPassword {
    value1: string = '';

    value2: string = '';
}
