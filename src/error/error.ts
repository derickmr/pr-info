import { HttpStatusCode } from "axios";

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

