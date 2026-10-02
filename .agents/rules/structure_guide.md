---
trigger: always_on
---

# Verona-NG (v21.0.0) Comprehensive Technical Guide & Standards

This document serves as the high-fidelity blueprint for AI agents and developers building within the Verona-NG ecosystem. It ensures architectural consistency, design alignment (Verona/Vidadent style), and technical excellence.

---

## 1. Core Technology Stack & Constraints

The platform (Vidadent Operational Platform) follows a "Standalone & Signals" architecture.

- **Framework**: Angular v21.0.0 (Strict use of `@if`, `@for`, `signal`, `computed`).
- **Backend as a Service (BaaS)**: 
  - **Firebase**: v12.9.0 (Exclusive use for **Authentication** and **Storage**). See [Firebase Usage Rules](firebase-usage.md) for details.
  - **AngularFire**: v20.0.1 (use for Auth, and Storage).
- **UI Component Library**: PrimeNG v21.0.4 with `@primeuix/themes` (Aura Preset).
- **Utility CSS**: Tailwind CSS v4.1.11 with `tailwindcss-primeui` plugin.
- **Icons**: PrimeIcons v7.0.0.
- **Secondary Tools**:
  - **Charts**: Chart.js v4.4.2.
  - **Editor**: Quill v2.0.3 (Clinical Notes).
  - **Build System**: Angular Application Builder (esbuild-based).
- **Backend API**: Express.js + MongoDB (See [Backend Connection Rules](backend-connection.md) for API and Service patterns).

---

## 2. Design System & Styling Rules

Verona uses a hybrid approach: **PrimeUI Design Tokens** + **Tailwind Utilities**.

### A. Variables & Tokens
Styles are driven by PrimeUI tokens (`--p-` prefix) mapped to layout variables (`--v-` prefix).
- **Main Body BG**: `var(--v-body-bg)` (Maps to `var(--p-surface-0)`).
- **Surface Ground**: `var(--surface-ground)` (Maps to `var(--p-surface-100)`).
- **Surface Cards**: `var(--surface-card)` (Maps to `var(--p-content-background)`).
- **Typography**: Lato, Helvetica, sans-serif. Base size: `14px`.

### B. The ".card" Standard
All content sections must be wrapped in a `.card` container:
```css
.card {
    background: var(--surface-card);
    padding: 1.5rem;
    margin-bottom: 1rem;
    box-shadow: 0px 3px 4px rgba(0, 0, 0, 0.1), 0px 24px 36px rgba(0, 0, 0, 0.04);
    border-radius: 14px;
}
```

---

## 3. Component File Structure Standard

Verona-Vidadent components MUST separate logic from presentation. **Inline templates are forbidden.**

Whenever a new component is created, it must follow this folder structure:
- **`component-name/`**
  - `component-name.ts` (Logic & Imports)
  - `component-name.html` (Markup & Structure)

**Example (.ts):**
```typescript
@Component({
    selector: 'app-example',
    standalone: true,
    imports: [CommonModule, ButtonModule, ...],
    templateUrl: './example.html' // MANDATORY
})
export class ExampleComponent { ... }
```

---

## 4. CRUD View Blueprint (Visual Structure)

All CRUD operations MUST follow this visual hierarchy in their `.html` file.

```html
<div class="card">
    <p-toast />
    <p-confirmdialog />

    <!-- 1. Toolbar Section: Primary Actions -->
    <p-toolbar styleClass="mb-12">
        <ng-template #start>
            <p-button label="New" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="openNew()" />
            <p-button label="Delete" icon="pi pi-trash" severity="secondary" outlined 
                [disabled]="!selectedItems || !selectedItems.length" (onClick)="deleteSelected()" />
        </ng-template>
        <ng-template #end>
            <p-button label="Export" icon="pi pi-upload" severity="secondary" (onClick)="exportCSV()" />
        </ng-template>
    </p-toolbar>

    <!-- 2. Table Section: Main Data Grid -->
    <p-table 
        #dt 
        [value]="items()" 
        [rows]="10" 
        [paginator]="true" 
        [globalFilterFields]="['name', 'email']"
        [(selection)]="selectedItems" 
        [rowHover]="true" 
        dataKey="id"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries" 
        [showCurrentPageReport]="true"
        [tableStyle]="{ 'min-width': '75rem' }"
    >
        <ng-template #caption>
            <div class="flex items-center justify-between">
                <h5 class="m-0 text-xl font-semibold">Manage [Entities]</h5>
                <p-iconfield>
                    <p-inputicon class="pi pi-search" />
                    <input pInputText type="text" (input)="onGlobalFilter(dt, $event)" placeholder="Search..." />
                </p-iconfield>
            </div>
        </ng-template>

        <ng-template #header>
            <tr>
                <th style="width: 3rem">
                    <p-tableHeaderCheckbox />
                </th>
                <th pSortableColumn="name">Name <p-sortIcon field="name" /></th>
                <th pSortableColumn="field2">Field 2 <p-sortIcon field="field2" /></th>
                <th>Actions</th>
            </tr>
        </ng-template>

        <ng-template #body let-entity>
            <tr>
                <td>
                    <p-tableCheckbox [value]="entity" />
                </td>
                <td>{{ entity.name }}</td>
                <td>{{ entity.field2 }}</td>
                <td>
                    <p-button icon="pi pi-pencil" [rounded]="true" [outlined]="true" class="mr-2" (onClick)="editItem(entity)" />
                    <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (onClick)="deleteItem(entity)" />
                </td>
            </tr>
        </ng-template>
    </p-table>

    <!-- 3. Modal Section: Entity Dialog -->
    <p-dialog 
        [(visible)]="itemDialog" 
        [style]="{ width: '450px' }" 
        header="Entity Details" 
        [modal]="true" 
        styleClass="p-fluid"
    >
        <ng-template #content>
            <div class="flex flex-col gap-4">
                <div class="flex flex-col gap-2">
                    <label for="name" class="font-bold">Name</label>
                    <input pInputText id="name" [(ngModel)]="item().name" required autofocus />
                </div>
            </div>
        </ng-template>

        <ng-template #footer>
            <p-button label="Cancel" icon="pi pi-times" [text]="true" (onClick)="hideDialog()" />
            <p-button label="Save" icon="pi pi-check" (onClick)="saveItem()" />
        </ng-template>
    </p-dialog>
</div>
```

---

## 5. Data Field Definitions (Vidadent Schema)

### A. Client Basic Data
- **Personal**: Name (Full Name), Address (Domicilio), Birth Date, Age, Email.
- **Emergency Contact**: Name, Phone Number, Relationship (Parentezco).
- **Source**: Recommended By (Recomendado por).

### B. Clinical Record (Expediente Clínico)
- **Medical Info**: Allergies, Pathological History (Antecedentes patológicos), Current Medication.

### C. Treatment History
- **Registration Fields**: Date, Treatment (Dropdown with Search), Cost, Discount, Advance (Anticipo), Balance (Saldo), Payment Status.

---

## 6. Component Standards (PrimeNG)

### A. Buttons
- **Secondary**: Use `severity="secondary"` for standard actions (New, Export).
- **Danger**: Use `severity="danger"` for destructive actions.
- **Table Rows**: Use `[rounded]="true"` and `[outlined]="true"`.

### B. Tables (CRUD View)
- **Configuration**: `[paginator]="true"`, `[rows]="10"`, `[showCurrentPageReport]="true"`.
- **Selection**: `[(selection)]="selectedItems"`, `dataKey="id"`.
- **Filtering**: Global filter in `#caption` using `p-iconfield` + `p-inputicon`.
- **Responsiveness**: `[tableStyle]="{ 'min-width': '75rem' }"`.

### C. Specialized Inputs
- **Searchable Dropdowns**: For the **Treatment** field, use `<p-select [filter]="true" ...>` to allow high-speed searching within the list.

### D. Toolbars
Standard table header action bar:
```html
<p-toolbar styleClass="mb-12">
    <ng-template #start>
        <p-button label="New" icon="pi pi-plus" severity="secondary" class="mr-2" />
        <p-button label="Delete" icon="pi pi-trash" severity="secondary" outlined [disabled]="selectedItems.length === 0" />
    </ng-template>
    <ng-template #end>
        <p-button label="Export" icon="pi pi-upload" severity="secondary" />
    </ng-template>
</p-toolbar>
```

---

## 7. Functional Operational Blocks (Vidadent System)

### Block 1: Authentication (Autenticación)
- Login with username and password (**Firebase Auth**).
- Password recovery flow.
- Secure Logout.
- Admin Management (CRUD): Create, edit, and delete system administrators.

### Block 2: Clients (Clientes)
- Client registration using basic data fields.
- Fast search and consult engine for registered clients.
- Centralized general history associated with each specific client.

### Block 3: Clinical Record (Expediente Clínico)
- Registration of basic clinical information.
- Capture sub-sections: Allergies, pathological history, and current medication.
- Integrity: Absolute association of the record to the corresponding client.

### Block 4: Treatment History (Historial de Tratamientos)
- Detailed record of dental interventions/treatments performed per client.
- Data points: Date, treatment (searchable list), cost, discount, advance, balance, and payment status.
- Full consultation: View a patient's entire chronological history.
- Dynamic Updates: Ability to update payments and settle pending balances.

### Block 5: Executive Dashboard
- Unified view of system health.
- Count of total clients and treatments performed.
- Key Financial Indicators: Summaries of payments Made vs. Pending balances (Executive view).
- Reporting: Generate simplified records/summaries of relevant system data.

---

## 8. Implementation Commandments for AI Agents

1. **Standalone & Signals**: Every component must be **Standalone** and use **Signals**.
2. **File Separation**: **Forbidden to use inline templates**. Always separate logic in `.ts` and markup in `.html`.
3. **Standard CRUD Structure**: Always use the hierarchy: **Card -> Toolbar -> Table -> Dialog**.
4. **Fluid Form Consistency**: Standardize on `p-fluid` for all form containers.
5. **Firebase Usage**: Use `@angular/fire` exclusively for **Authentication** and **Cloud Storage**. Do not use Firestore.
6. **Interactive Lists**: All treatment fields use searchable dropdowns (`p-select` with `filter="true"`).
7. **Verona Visuals**: Follow the 14px border radius and specific `.card` shadow.
8. **Feedback**: MessageService (Toast) and ConfirmationService are mandatory.
9. **Language**: All end-user content (labels, messages, dialogs) must be strictly in **Spanish**.
10. **Confirmation on Save**: A confirmation dialog must always be shown before processing any save or edit action.
