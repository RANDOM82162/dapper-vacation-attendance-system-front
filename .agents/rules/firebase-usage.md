---
trigger: always_on
---

# Firebase and External Integrations Rule

This rule documentation outlines the specific usage of Firebase and other external integrations within the project.

## 1. Firebase Usage Policy
- **Authorized Features**: **Authentication** and **Cloud Storage** only.
- **FORBIDDEN**: The use of **Firestore** or **Realtime Database** is strictly prohibited in this project.
- **Provider**: Use `@angular/fire` (v20.0+) for all integrations.

### Architecture for Auth
- Use `AuthService` (if already implemented) or standard AngularFire Auth methods for:
  - User login/logout.
  - Password recovery.
  - Token management (backend uses the UID/Token for authorization).

### Architecture for Storage
- Use `Firebase Cloud Storage` for file uploads (e.g., patient documents, images).
- Backend often manages the URL reference in MongoDB.

## 2. API Data Contracts
All business data should be retrieved through the backend REST API, not directly from Firebase.

### Integration Flow
1.  **Frontend** authenticates with Firebase.
2.  **Frontend** sends the Firebase ID Token in the request header to the backend.
3.  **Backend** (`verifyToken` middleware) validates the token with Firebase Admin SDK.
4.  **Backend** interacts with MongoDB and returns the data to the frontend in standard JSON format.

## 3. External Tool Integration
- **Charts**: Use `Chart.js` for all data visualizations.
- **Rich Text Editor**: Use `Quill` for all clinical notes and large text fields.
- **UI Components**: Exclusively use PrimeNG (Aura theme).
