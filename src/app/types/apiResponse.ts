export interface ApiResponse<T = unknown> {
    data: T;
    status: number;
    message: string;
    hasError?: boolean;
    methodName?: string;
    errorDetails?: unknown;
    errorType?: string;
}