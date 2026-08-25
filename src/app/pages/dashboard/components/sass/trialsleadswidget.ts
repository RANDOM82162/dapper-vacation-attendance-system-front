import { Component } from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';

@Component({
    standalone: true,
    selector: 'trials-leads-widget',
    imports: [AvatarModule, AvatarGroupModule],
    template: `<div class="card h-full">
        <div class="font-semibold text-xl">Trials Leads By Role</div>
        <div class="flex items-center justify-between pb-2 mb-1 pt-6 border-b border-surface">
            <span class="font-bold">Role</span>
            <span class="font-bold">Leads</span>
        </div>
        <ul class="list-none p-0 m-0">
            <li class="flex flex-wrap items-center justify-between py-1">
                <span>Finance</span>
                <p-avatar-group class="w-32 justify-evenly">
                    <p-avatar image="/demo/images/avatar/amyelsner.png" shape="circle"></p-avatar>
                    <p-avatar image="/demo/images/avatar/asiyajavayant.png" shape="circle"></p-avatar>
                    <p-avatar image="/demo/images/avatar/onyamalimba.png" shape="circle"></p-avatar>
                    <p-avatar image="/demo/images/avatar/ionibowcher.png" shape="circle"></p-avatar>
                </p-avatar-group>
            </li>
            <li class="flex flex-wrap items-center justify-between py-1">
                <span>Management</span>
                <p-avatar-group class="w-24 justify-evenly">
                    <p-avatar image="/demo/images/avatar/annafali.png" shape="circle"></p-avatar>
                    <p-avatar image="/demo/images/avatar/bernardodominic.png" shape="circle"></p-avatar>
                    <p-avatar image="/demo/images/avatar/elwinsharvill.png" shape="circle"></p-avatar>
                </p-avatar-group>
            </li>
            <li class="flex flex-wrap items-center justify-between py-1">
                <span>Human Resources</span>
                <p-avatar-group class="w-16 justify-evenly">
                    <p-avatar image="/demo/images/avatar/ivanmagalhaes.png" shape="circle"></p-avatar>
                    <p-avatar image="/demo/images/avatar/onyamalimba.png" shape="circle"></p-avatar>
                </p-avatar-group>
            </li>
            <li class="flex flex-wrap items-center justify-between py-2">
                <span>Development</span>
                <p-avatar-group class="w-32 justify-evenly">
                    <p-avatar image="/demo/images/avatar/amyelsner.png" shape="circle"></p-avatar>
                    <p-avatar image="/demo/images/avatar/asiyajavayant.png" shape="circle"></p-avatar>
                    <p-avatar image="/demo/images/avatar/onyamalimba.png" shape="circle"></p-avatar>
                    <p-avatar image="/demo/images/avatar/ionibowcher.png" shape="circle"></p-avatar>
                </p-avatar-group>
            </li>
            <li class="flex flex-wrap items-center justify-between py-2">
                <span>Design</span>
                <p-avatar-group class="w-16 justify-evenly">
                    <p-avatar image="/demo/images/avatar/amyelsner.png" shape="circle"></p-avatar>
                    <p-avatar image="/demo/images/avatar/asiyajavayant.png" shape="circle"></p-avatar>
                </p-avatar-group>
            </li>
            <li class="flex flex-wrap items-center justify-between py-2">
                <span>R&D</span>
                <p-avatar-group class="w-24 justify-evenly">
                    <p-avatar image="/demo/images/avatar/amyelsner.png" shape="circle"></p-avatar>
                    <p-avatar image="/demo/images/avatar/asiyajavayant.png" shape="circle"></p-avatar>
                    <p-avatar image="/demo/images/avatar/onyamalimba.png" shape="circle"></p-avatar>
                </p-avatar-group>
            </li>
            <li class="flex flex-wrap items-center justify-between py-2">
                <span>Reliability</span>
                <p-avatar-group class="w-16 justify-evenly">
                    <p-avatar image="/demo/images/avatar/amyelsner.png" shape="circle"></p-avatar>
                    <p-avatar image="/demo/images/avatar/asiyajavayant.png" shape="circle"></p-avatar>
                </p-avatar-group>
            </li>
            <li class="flex flex-wrap items-center justify-between py-2">
                <span>Social Media</span>
                <p-avatar-group class="w-32 justify-evenly">
                    <p-avatar image="/demo/images/avatar/amyelsner.png" shape="circle"></p-avatar>
                    <p-avatar image="/demo/images/avatar/asiyajavayant.png" shape="circle"></p-avatar>
                    <p-avatar image="/demo/images/avatar/onyamalimba.png" shape="circle"></p-avatar>
                    <p-avatar image="/demo/images/avatar/ionibowcher.png" shape="circle"></p-avatar>
                </p-avatar-group>
            </li>
        </ul>
    </div>`,
    host: {
        style: 'display: contents;'
    }
})
export class TrialsLeadsWidget {}
