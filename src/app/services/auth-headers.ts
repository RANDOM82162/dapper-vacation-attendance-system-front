import { HttpHeaders } from '@angular/common/http';

export function getAuthHeaders() {
    const token = getStoredToken();
    let headers = new HttpHeaders();

    if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
}

function getStoredToken() {
    if (typeof window === 'undefined') return null;

    return window.sessionStorage.getItem('authToken') || window.sessionStorage.getItem('token') || window.sessionStorage.getItem('accessToken');
}
