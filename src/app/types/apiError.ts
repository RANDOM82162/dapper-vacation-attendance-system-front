class ApiError extends Error {
    public override message: string;
    public methodName: string;
    public errorDetails: unknown;
    public errorType: string;

    constructor(msg: string, methodName: string, errorDetails: unknown, errorType: string) {
        super(msg);
        this.message = msg;
        this.methodName = methodName;
        this.errorDetails = errorDetails;
        this.errorType = errorType;
        // Set the prototype explicitly.
        Object.setPrototypeOf(this, ApiError.prototype);
    }

    getFormattedMessage() {
        console.log('error type...', this.errorType);
        switch (this.errorType) {
            case 'PARAMETERS_ERROR':
                return 'Lo sentimos, algunos parametros son incorrectos';
            case 'SW_API_ERROR':
                let details = this.errorDetails as { message: string; messageDetail: string };
                return details.message;
            case 'CERTIFICATE_ERROR':
                return this.message;
            case 'BASE_ERROR':
                return this.message;
            default:
                return 'Ocurrió un error inesperado';
        }
    }
}

export default ApiError;