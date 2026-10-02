import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { TagModule } from 'primeng/tag';
import { TagSeverity, VacationHistoryEntry } from './vacation-workflow.service';

interface ReviewerHistoryEntry {
    action: string;
    reviewer: string;
    detail: string;
    comment: string;
    severity: TagSeverity;
    timestamp?: number;
}

@Component({
    selector: 'app-vacation-history-timeline',
    standalone: true,
    imports: [CommonModule, TagModule],
    template: `
        <ul class="m-0 p-0 list-none flex flex-col gap-3">
            @for (item of entries; track $index) {
                @if (reviewerEntry(item); as entry) {
                    <li
                        class="rounded-lg border overflow-hidden"
                        [ngClass]="{
                            'border-green-300 bg-green-50/70 dark:border-green-900 dark:bg-green-950/20': entry.severity === 'success',
                            'border-red-300 bg-red-50/70 dark:border-red-900 dark:bg-red-950/20': entry.severity === 'danger',
                            'border-amber-300 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/20': entry.severity === 'warn',
                            'border-blue-300 bg-blue-50/70 dark:border-blue-900 dark:bg-blue-950/20': entry.severity === 'info'
                        }"
                    >
                        <div class="flex flex-wrap items-center gap-2 p-3">
                            <p-tag [value]="entry.action" [severity]="entry.severity" />
                            <span class="font-semibold">Por {{ entry.reviewer }}</span>
                        </div>
                        @if (entry.timestamp) {
                            <p class="text-xs text-muted-color px-3 pb-3 m-0">
                                Fecha y hora: <time>{{ entry.timestamp | date: 'dd/MM/yyyy HH:mm' }}</time>
                            </p>
                        }
                        @if (entry.detail) {
                            <p class="text-sm text-muted-color px-3 pb-3 m-0">{{ entry.detail }}</p>
                        }
                        @if (entry.comment) {
                            <div class="mx-3 mb-3 p-3 rounded-md border border-surface bg-surface-0 dark:bg-surface-900">
                                <span class="block text-xs font-semibold text-muted-color mb-1">Comentario de {{ entry.reviewer }}</span>
                                <p class="m-0 font-medium text-color whitespace-pre-line">{{ entry.comment }}</p>
                            </div>
                        }
                    </li>
                } @else {
                    <li class="border-l-2 border-surface pl-3 py-1 text-sm text-muted-color leading-6">
                        <span>{{ historyMessage(item) }}</span>
                        @if (historyTimestamp(item); as timestamp) {
                            <time class="block mt-1 text-xs">{{ timestamp | date: 'dd/MM/yyyy HH:mm' }}</time>
                        }
                    </li>
                }
            }
        </ul>
    `
})
export class VacationHistoryTimeline {
    @Input() entries: VacationHistoryEntry[] = [];

    historyMessage(entry: VacationHistoryEntry) {
        return typeof entry === 'string' ? entry : entry.message;
    }

    historyTimestamp(entry: VacationHistoryEntry) {
        if (typeof entry === 'string' || !Number.isFinite(entry.timestamp) || entry.timestamp <= 0) return null;
        return entry.timestamp;
    }

    reviewerEntry(entry: VacationHistoryEntry): ReviewerHistoryEntry | null {
        const value = this.historyMessage(entry);
        const commentMarker = value.match(/\s+Comentario:\s*/i);
        const summary = commentMarker?.index === undefined
            ? value.trim()
            : value.slice(0, commentMarker.index).trim();
        const comment = commentMarker?.index === undefined
            ? ''
            : value.slice(commentMarker.index + commentMarker[0].length).trim();

        const matchers: Array<{ pattern: RegExp; action: string; severity: TagSeverity }> = [
            { pattern: /^Solicitud aprobada por (.+?)\.(?:\s*(.*))?$/i, action: 'Solicitud aprobada', severity: 'success' },
            { pattern: /^Solicitud rechazada por (.+?)\.(?:\s*(.*))?$/i, action: 'Solicitud rechazada', severity: 'danger' },
            { pattern: /^(.+?) solicitó cambios\.(?:\s*(.*))?$/i, action: 'Cambios solicitados', severity: 'warn' },
            { pattern: /^Comentario del jefe\/director actualizado por (.+?)\.$/i, action: 'Comentario actualizado', severity: 'info' }
        ];

        for (const matcher of matchers) {
            const match = summary.match(matcher.pattern);
            if (match) {
                return {
                    action: matcher.action,
                    reviewer: match[1].trim(),
                    detail: (match[2] || '').trim() || (matcher.action === 'Comentario actualizado' && !comment ? 'El texto de esta actualización no se guardó en el historial.' : ''),
                    comment,
                    severity: matcher.severity,
                    timestamp: this.historyTimestamp(entry) ?? undefined
                };
            }
        }

        return null;
    }
}
