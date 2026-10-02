---
trigger: always_on
---

# Backend Connection Rules

This rule documents the backend architecture, API conventions, and the standard pattern for consuming services in the Verona project.

## 1. Backend Architecture
The backend follows a modular **MVC-S (Model-View-Controller-Service)** architecture.

### Technology Stack
- **Runtime:** Node.js (v16.x)
- **Framework:** Express.js (v4.x)
- **Language:** TypeScript
- **Database:** MongoDB (Mongoose)
- **Auth:** Firebase Admin SDK & JWT

### Architectural Layers (per module)
1.  **Routes (`.routes.ts`)**: Endpoint entry points with security middlewares.
2.  **Controller (`Controller.ts`)**: Handles requests and delegates business logic.
3.  **Service (`Service.ts`)**: Core logic, business rules, and side effects.
4.  **Model (`Model.ts`)**: Database interactions.
5.  **Dto (`Dto.ts`)**: Data contracts (Interfaces, Enums, Types).
6.  **Swagger (`.swagger.ts`)**: API documentation specifics.

## 2. API Conventions
- **Base Prefix:** `/api/v1` (or as configured in `environment.URL_API`).
- **Standard Routes:**
    - `GET /get-all`: List resources.
    - `GET /get-by-id/:id`: Resource detail.
    - `POST /create`: Create resource.
    - `PUT /update/:id`: Update resource.
    - `DELETE /delete/:id`: Delete resource.

### Security Middlewares
- `verifyToken`: JWT validation.
- `hasPermissionOrRole`: RBAC.
- `canManageResource/ByUid`: Ownership check.

## 3. Response and Error Standards
### Success JSON Format
```json
{
  "status": 200,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Handling
- Use the standardized error interceptor.
- Common statuses: 400 (Bad Request), 401/403 (Unauthorized/Forbidden), 404 (Not Found), 500 (Internal Error).

## 4. Frontend Service Implementation Pattern
All Angular services must follow this structure for consistency.

### Standard Service Template
```typescript
import { ApiResponse } from '@/app/types/apiResponse';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { catchError, map, throwError } from 'rxjs';
import ApiError from '@/app/types/apiError';

@Injectable({ providedIn: 'root' })
export class MyService {
    private baseUrl = `${environment.URL_API}/my-module/`;
    private http = inject(HttpClient);

    public getItems() {
        return this.http.get<ApiResponse<Item[]>>(this.baseUrl + 'get-all').pipe(
            map((data) => data.data),
            catchError((httpError: HttpErrorResponse) => {
                let apiErrorResponse = httpError.error as ApiResponse;
                return throwError(() => new ApiError(
                    apiErrorResponse.message, 
                    apiErrorResponse.methodName!, 
                    apiErrorResponse.errorDetails!, 
                    apiErrorResponse.errorType!
                ));
            })
        );
    }

    // Add other methods using the same pattern (map+catchError)
}
```

### Key Requirements
- Use `inject(HttpClient)` instead of constructor injection.
- Always map `data.data`.
- Use the centralized `ApiError` class in the `catchError` block.
- Base URL should use `environment.URL_API`.
