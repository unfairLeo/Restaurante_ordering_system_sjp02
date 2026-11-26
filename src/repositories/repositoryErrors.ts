import { ConflictError } from "../error/conflictError.js";
import { NotFoundError } from "../error/notFoundError.js";
import { ValidationError } from "../error/ValidationError.js";

export function rethrowDatabaseError(
    error: unknown,
    notFoundMessage: string,
    foreignKeyMessage?: string,
    conflictMessage?: string,
): never {
    if (typeof error === "object" && error !== null && "code" in error) {
        if (error.code === "PGRST116") {
            throw new NotFoundError(notFoundMessage);
        }

        if (error.code === "23503") {
            if (conflictMessage) {
                throw new ConflictError(conflictMessage);
            }

            if (foreignKeyMessage) {
                throw new ValidationError(foreignKeyMessage);
            }
        }
    }

    throw error;
}

export function rethrowWriteError(error: unknown, foreignKeyMessage: string): never {
    if (typeof error === "object"
        && error !== null
        && "code" in error
        && error.code === "23503") {
        throw new ValidationError(foreignKeyMessage);
    }

    throw error;
}
