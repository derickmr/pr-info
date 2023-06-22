import { HttpStatusCode } from "axios";

/**
 * A custom error for handling API errors, which includes the http code and name for the error (e.g. 500 - Internal server error)
 */
export class ApiError extends Error {
    public readonly name: string;
    public readonly httpCode: HttpStatusCode;

    constructor(name: string, httpCode: HttpStatusCode, description: string) {
        super(description);

        this.name = name;
        this.httpCode = httpCode;

        Error.captureStackTrace(this, this.constructor)
    }

    toJSON() {
        return {
            name: this.name,
            message: this.message,
            httpCode: this.httpCode
        };
    }
}

