import type { Response } from "express";
import { ConflictError } from "../error/conflictError.js";
import { NotFoundError } from "../error/notFoundError.js";
import { ValidationError } from "../error/ValidationError.js";

export function respondWithError(
    res: Response,
    error: unknown,
    internalMessage: string,
): void {
    console.log(internalMessage, error);

    if (error instanceof ValidationError) {
        res.status(400).json({ message: error.message });
        return;
    }

    if (error instanceof NotFoundError) {
        res.status(404).json({ message: error.message });
        return;
    }

    if (error instanceof ConflictError) {
        res.status(409).json({ message: error.message });
        return;
    }

    res.status(500).json({ message: internalMessage });
}
