import { Component } from '@angular/core';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { AvatarGroupModule } from 'primeng/avatargroup';
import { AvatarModule } from 'primeng/avatar';

@Component({
    selector: 'recent-blog-post-widget',
    imports: [TagModule, ButtonModule, AvatarModule, AvatarGroupModule],
    standalone: true,
    template: `
        <div class="card h-full">
            <div class="font-semibold text-xl mb-4">Recent Blog Posts</div>
            <div class="flex flex-col mb-4">
                <span class="text-lg mb-4">What is the Customer Journey?</span>
                <span><p-tag value="Conversion" styleClass="mb-4"></p-tag></span>

                <span class="inline-flex items-center">
                    <i class="pi pi-clock mr-1 text-muted-color"></i>
                    <span class="text-muted-color">Jan 15.</span>
                    <span class="font-bold ml-2">4 days 36 mins</span>
                </span>
            </div>
            <p class="leading-normal mt-0 mb-8">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </p>

            <p class="leading-normal mt-0 mb-8">Sit amet nulla facilisi morbi tempus iaculis. Dolor magna eget est lorem ipsum dolor sit. Turpis egestas pretium aenean pharetra magna ac placerat vestibulum lectus.</p>

            <div class="flex flex-wrap items-center justify-between">
                <div class="flex items-center">
                    <p-button type="button" icon="pi pi-angle-left" outlined rounded plain size="small" styleClass="mr-2"></p-button>
                    <p-button type="button" icon="pi pi-angle-right" outlined rounded plain size="small"></p-button>
                    <span class="font-bold ml-4">4</span>
                    <span>/8</span>
                </div>
                <p-avatar-group>
                    <p-avatar image="/demo/images/avatar/amyelsner.png" shape="circle"></p-avatar>
                    <p-avatar image="/demo/images/avatar/asiyajavayant.png" shape="circle"></p-avatar>
                    <p-avatar image="/demo/images/avatar/onyamalimba.png" shape="circle"></p-avatar>
                    <p-avatar image="/demo/images/avatar/ionibowcher.png" shape="circle"></p-avatar>
                    <p-avatar image="/demo/images/avatar/xuxuefeng.png" shape="circle"></p-avatar>
                </p-avatar-group>
            </div>
        </div>
    `
})
export class RecentBlogPostWidget {}
