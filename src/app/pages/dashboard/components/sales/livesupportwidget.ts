import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputTextModule } from 'primeng/inputtext';

interface Message {
    self: boolean;
    from: string;
    url: string;
    messages: string[];
}

@Component({
    standalone: true,
    selector: 'live-support-widget',
    imports: [CommonModule, InputGroupModule, InputTextModule],
    template: `<div class="card h-full">
        <div class="font-semibold text-xl mb-4">Live Support</div>
        <div>
            <ul class="chat-container list-none p-0 px-4 mt-6 mb-12 h-84 overflow-y-auto">
                @for (chatMessage of chatMessages; track chatMessage.from) {
                    <li class="flex items-start mb-6" [ngClass]="{ 'justify-content-start': !chatMessage.self, 'justify-end': chatMessage.self }">
                        <img *ngIf="!chatMessage.self" [src]="chatMessage.url" width="36" height="36" class="rounded-full" />
                        <div *ngIf="!chatMessage.self" class="ml-2 flex flex-col items-start">
                            <div>
                                <span class="font-bold mr-6">{{ chatMessage.from }}</span>
                                <span class="text-muted-color">2m ago</span>
                            </div>
                            @for (message of chatMessage.messages; track message) {
                                <div class="inline-block text-left bg-surface-100 dark:bg-surface-700 rounded-border px-8 py-4 mt-4">
                                    {{ message }}
                                </div>
                            }
                        </div>
                        <div *ngIf="chatMessage.self" class="mr-6 flex flex-col items-end">
                            <div>
                                <span class="text-muted-color">2m ago</span>
                                <span class="font-bold ml-6">{{ chatMessage.from }}</span>
                            </div>
                            @for (message of chatMessage.messages; track message) {
                                <div class="inline-block text-right bg-primary-500 text-primary-50 rounded-border px-8 py-4 mt-4">
                                    {{ message }}
                                </div>
                            }
                        </div>
                        <img *ngIf="chatMessage.self" [src]="chatMessage.url" width="36" height="36" class="rounded-full" />
                    </li>
                }
            </ul>
            <p-input-group class="mt-6">
                <input pInputText type="text" placeholder="Write your message (Hint: 'PrimeNG')" (keydown)="onChatKeydown($event)" />
            </p-input-group>
        </div>
    </div>`
})
export class LiveSupportWidget {
    chatMessages: Message[] = [
        { self: false, from: 'Jane Cooper', url: '/demo/images/avatar/stephenshaw.png', messages: ['Hey M. hope you are well. Our idea is accepted by the board. '] },
        { self: true, from: 'Jerome Bell', url: '/demo/images/avatar/ivanmagalhaes.png', messages: ['we did it! 🤠'] },
        { self: false, from: 'Darlene Robertson', url: '/demo/images/avatar/amyelsner.png', messages: ['I will be looking at the process then, just to be sure 🤓 '] }
    ];

    onChatKeydown(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            const inputElement = event.target as HTMLInputElement;
            const message = inputElement.value;

            const lastMessage: Message = this.chatMessages[this.chatMessages.length - 1];

            if (lastMessage.from) {
                this.chatMessages.push({
                    self: true,
                    from: 'Jerome Bell',
                    url: '/demo/images/avatar/ivanmagalhaes.png',
                    messages: [message]
                });
            } else {
                lastMessage.messages.push(message);
            }

            if (message.match(/primeng|primereact|primefaces|primevue/i)) {
                this.chatMessages.push({
                    self: false,
                    from: 'Ioni Bowcher',
                    url: '/demo/images/avatar/ionibowcher.png',
                    messages: ['Always bet on Prime!']
                });
            }

            inputElement.value = '';

            setTimeout(() => {
                const chatContainer = document.querySelector('.chat-container') as HTMLElement;
                if (chatContainer) {
                    chatContainer.scrollTo({
                        top: chatContainer.scrollHeight,
                        behavior: 'smooth'
                    });
                }
            });
        }
    }
}
