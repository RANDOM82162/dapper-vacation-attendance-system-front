import { Component, inject } from '@angular/core';
import { LayoutService } from '@/app/layout/service/layout.service';
import { AvatarModule } from 'primeng/avatar';

@Component({
    selector: 'profile-widget',
    standalone: true,
    imports: [AvatarModule],
    template: ` <div class="card">
        <div class="text-center mb-20">
            <img [src]="setSvg('completion-graph')" alt="graph" class="w-full" />
        </div>

        <ul class="list-none p-0 m-0">
            <li class="mb-6 flex items-center justify-start">
                <p-avatar icon="pi pi-user-edit" size="large" shape="circle" styleClass="shrink-0 text-base font-bold" [style]="{ 'background-color': 'rgba(250, 219, 95, 0.1)', color: '#DE911D', border: '1px solid #FADB5F' }"></p-avatar>
                <div class="ml-6">
                    <span class="block">Add your personal information</span>
                    <span class="text-blue-500 hover:underline cursor-pointer block font-bold">Go Profile Edit</span>
                </div>
            </li>

            <li class="mb-6 flex items-center justify-start">
                <p-avatar icon="pi pi-send" size="large" shape="circle" styleClass="shrink-0 text-base font-bold" [style]="{ 'background-color': 'rgba(250, 219, 95, 0.1)', color: '#DE911D', border: '1px solid #FADB5F' }"></p-avatar>
                <div class="ml-6">
                    <span class="block">Verify your phone</span>
                    <span class="text-blue-500 hover:underline cursor-pointer block font-bold">Send Verification SMS</span>
                </div>
            </li>

            <li class="mb-6 flex items-center justify-start">
                <p-avatar icon="pi pi-video" size="large" shape="circle" styleClass="shrink-0 text-base font-bold" [style]="{ 'background-color': 'rgba(250, 219, 95, 0.1)', color: '#DE911D', border: '1px solid #FADB5F' }"></p-avatar>
                <div class="ml-6">
                    <span class="block">Verify your Face ID</span>
                    <span class="text-blue-500 hover:underline cursor-pointer block font-bold">Upload Pictures</span>
                </div>
            </li>

            <li class="mb-6 flex items-center justify-start">
                <p-avatar icon="pi pi-briefcase" size="large" shape="circle" styleClass="shrink-0 text-base font-bold" [style]="{ 'background-color': 'rgba(250, 219, 95, 0.1)', color: '#DE911D', border: '1px solid #FADB5F' }"></p-avatar>
                <div class="ml-6">
                    <span class="block">Give permissions for personal data</span>
                    <span class="text-blue-500 hover:underline cursor-pointer block font-bold">View Agreement</span>
                </div>
            </li>
        </ul>
    </div>`,
    host: {
        style: 'display: contents;'
    }
})
export class ProfileWidget {
    layoutService = inject(LayoutService);

    setSvg(path: string) {
        return `/demo/images/dashboard/${path}` + (this.layoutService.isDarkTheme() ? '-dark' : '') + '.svg';
    }
}
