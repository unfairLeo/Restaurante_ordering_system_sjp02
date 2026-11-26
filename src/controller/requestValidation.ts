import { ValidationError } from "../error/ValidationError.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseObjectBody(input: unknown, resourceName: string): Record<string, unknown> {
    if (typeof input !== "object" || input === null || Array.isArray(input)) {
        throw new ValidationError(`Os dados de ${resourceName} devem ser um objeto.`);
    }

    return input as Record<string, unknown>;
}

export function parseUuid(input: unknown, fieldName: string): string {
    if (typeof input !== "string" || !UUID_PATTERN.test(input)) {
        throw new ValidationError(`${fieldName} deve ser um UUID válido.`);
    }

    return input;
}

export function parseKeyword(input: unknown): string {
    if (typeof input !== "string" || input.trim() === "") {
        throw new ValidationError("Palavra-chave não informada.");
    }

    return input.trim();
}
