import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { Ripple } from 'primeng/ripple';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InputNumber } from 'primeng/inputnumber';

@Component({
    selector: 'app-verification',
    standalone: true,
    imports: [ButtonModule, Ripple, RouterModule, FormsModule, InputNumber],
    templateUrl: './verification.html'
})
export class Verification {
    value: string = '';

    focusOnNext(inputEl: InputNumber) {
        inputEl.input.nativeElement.focus();
    }
}
