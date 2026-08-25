import { Component, inject } from '@angular/core';
import { AvatarGroupModule } from 'primeng/avatargroup';
import { ProgressBarModule } from 'primeng/progressbar';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { LayoutService } from '@/app/layout/service/layout.service';

@Component({
    selector: 'timeline-widget',
    imports: [AvatarGroupModule, AvatarModule, ProgressBarModule, ButtonModule],
    standalone: true,
    template: ` <div class="card widget-timeline">
        <div class="font-semibold text-xl mb-4">Timeline</div>
        <ul class="list-none p-0 m-0">
            <li class="flex mb-6">
                <div class="flex flex-col items-center">
                    <span class="flex items-center justify-center rounded-full p-2 timeline-icon bg-blue-100 text-blue-500">
                        <i class="pi pi-twitter"></i>
                    </span>
                    <div class="h-full bg-blue-100" style="width: 2px; min-height: 4rem"></div>
                </div>

                <div class="ml-6 flex-1">
                    <div class="flex items-center justify-between mb-6">
                        <span> <strong>Tom Mathias</strong> retweeted a tweet about your following keyword. </span>
                        <span class="font-bold text-muted-color">46m</span>
                    </div>
                    <div class="p-6 rounded-border" [style]="{ 'background-color': dynamicBackground() }">
                        <div class="flex items-center justify-between mb-2">
                            <img src="/demo/images/avatar/xuxuefeng.png" alt="avatar" class="w-8" />
                            <p-avatar-group>
                                <p-avatar image="/demo/images/avatar/amyelsner.png" shape="circle"></p-avatar>
                                <p-avatar image="/demo/images/avatar/asiyajavayant.png" shape="circle"></p-avatar>
                                <p-avatar image="/demo/images/avatar/onyamalimba.png" shape="circle"></p-avatar>
                            </p-avatar-group>
                        </div>
                        <div class="font-bold mb-2">Jeff Atwood</div>
                        <p class="text-muted-color text-sm leading-normal mb-6" style="max-width: 28rem">Hooray! I suck at hardware but I was able to get the pi zero W, plus usb case, plus two color e-ink hat, to work!</p>

                        <p-progress-bar [value]="50" [showValue]="false" class="w-full md:w-6/12" [style]="{ height: '.5rem' }"></p-progress-bar>
                    </div>
                </div>
            </li>
            <li class="flex mb-6">
                <div class="flex flex-col items-center">
                    <span class="flex items-center justify-center rounded-full p-2 timeline-icon bg-yellow-100 text-yellow-500">
                        <i class="pi pi-star"></i>
                    </span>
                    <div class="h-full bg-yellow-100" style="width: 2px; min-height: 4rem"></div>
                </div>

                <div class="ml-6 flex-1">
                    <div class="flex items-center justify-between">
                        <span><strong>Scott Wesley</strong> starred NS0021 on customer list.</span>
                        <span class="font-bold text-muted-color">1h 51m</span>
                    </div>
                </div>
            </li>
            <li class="flex mb-6">
                <div class="flex flex-col items-center">
                    <span class="flex items-center justify-center rounded-full p-2 timeline-icon bg-green-100 text-green-500">
                        <i class="pi pi-link"></i>
                    </span>
                    <div class="h-full bg-green-100" style="width: 2px; min-height: 4rem"></div>
                </div>

                <div class="ml-6 flex-1">
                    <div class="flex items-center justify-between mb-6">
                        <span> <strong>Jorge Gomez</strong> shared design files on cloud. </span>
                        <span class="font-bold text-muted-color">12h</span>
                    </div>
                    <ul class="list-none p-0 m-0">
                        <li class="flex items-center justify-start mb-2">
                            <img src="/demo/images/dashboard/bg-detail.svg" alt="bg" class="w-8" />
                            <span class="font-bold ml-2">01.Verona-Remastered.fig</span>
                        </li>
                        <li class="flex items-center justify-start">
                            <img src="/demo/images/dashboard/bg-detail.svg" alt="bg" class="w-8" />
                            <span class="font-bold ml-2">02.Verona-Marketing.fig</span>
                        </li>
                    </ul>
                </div>
            </li>
            <li class="text-center">
                <p-button icon="pi pi-chevron-down" label="View More" text></p-button>
            </li>
        </ul>
    </div>`,
    host: {
        style: 'display: contents;'
    }
})
export class TimelineWidget {
    layoutService = inject(LayoutService);

    dynamicBackground() {
        return this.layoutService.isDarkTheme() ? 'rgba(227, 248, 255, 0.1)' : 'rgba(227, 248, 255, 0.5)';
    }
}
