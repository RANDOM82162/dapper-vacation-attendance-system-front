import { Component } from '@angular/core';

@Component({
    standalone: true,
    selector: 'optimizing-widget',
    template: `<div class="card p-0!">
        <img src="/demo/images/dashboard/bg-product.jpg" alt="blog-bg" class="w-full rounded-t-2xl" />
        <div class="p-6">
            <div class="flex items-center justify-between mb-4">
                <div class="inline-flex items-center">
                    <span class="font-bold">Optimizing Logistics with AI</span>
                    <i class="pi pi-check-circle ml-4 text-xl! text-green-500"></i>
                </div>
                <i class="pi pi-bookmark ml-4 text-xl! text-muted-color"></i>
            </div>
            <p class="mb-8 leading-normal">Sit amet nulla facilisi morbi tempus iaculis. Dolor magna eget est lorem ipsum dolor sit. Turpis egestas pretium aenean pharetra magna ac placerat vestibulum lectus.</p>
            <div class="flex items-center justify-between">
                <img src="/demo/images/avatar/amyelsner.png" alt="avatar" class="shrink-0 w-8 h-8" />
                <div class="text-muted-color flex items-center">
                    <i class="pi pi-heart mr-1"></i>
                    <span>888</span>
                    <i class="pi pi-eye ml-6 mr-1"></i>
                    <span>8888</span>
                </div>
            </div>
        </div>
    </div>`
})
export class OptimizingWidget {}
