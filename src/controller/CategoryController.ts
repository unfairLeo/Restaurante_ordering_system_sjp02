import type { Request, Response } from "express";
import CategoryRepository from "../repositories/categoryRepository.js";
import type {
    CategoryCreateInput,
    CategoryUpdateInput,
} from "../model/category.js";
import { ValidationError } from "../error/ValidationError.js";
import { parseKeyword, parseObjectBody, parseUuid } from "./requestValidation.js";
import { respondWithError } from "./respondWithError.js";

type CategoryFields = Pick<
    CategoryUpdateInput,
    "name" | "description" | "icon" | "display_order"
>;

function parseCategoryFields(input: unknown): {
    body: Record<string, unknown>;
    value: CategoryFields;
} {
    const body = parseObjectBody(input, "categoria");

    if (typeof body.name !== "string" || body.name.trim() === "") {
        throw new ValidationError("name é obrigatório.");
    }

    if (body.description !== undefined
        && body.description !== null
        && typeof body.description !== "string") {
        throw new ValidationError("description deve ser um texto ou null.");
    }

    if (body.icon !== undefined && body.icon !== null && typeof body.icon !== "string") {
        throw new ValidationError("icon deve ser um texto ou null.");
    }

    if (typeof body.display_order !== "number"
        || !Number.isInteger(body.display_order)
        || body.display_order < 0) {
        throw new ValidationError(
            "display_order deve ser um número inteiro maior ou igual a zero.",
        );
    }

    return {
        body,
        value: {
            name: body.name.trim(),
            description: body.description ?? null,
            icon: body.icon ?? null,
            display_order: body.display_order,
        },
    };
}

function parseCreateCategory(input: unknown): CategoryCreateInput {
    const { body, value } = parseCategoryFields(input);

    if (body.active !== undefined && typeof body.active !== "boolean") {
        throw new ValidationError("active deve ser true ou false.");
    }

    return body.active === undefined ? value : { ...value, active: body.active };
}

function parseUpdateCategory(input: unknown): CategoryUpdateInput {
    const { body, value } = parseCategoryFields(input);

    if (typeof body.active !== "boolean") {
        throw new ValidationError("active deve ser true ou false.");
    }

    return { ...value, active: body.active };
}

async function getAll(_req: Request, res: Response) {
    try {
        const categories = await CategoryRepository.findAll();
        return res.status(200).json(categories);
    } catch (error) {
        respondWithError(res, error, "Erro ao buscar categorias.");
    }
}

async function getByKeyword(req: Request, res: Response) {
    try {
        const keyword = parseKeyword(req.query.keyword);
        const categories = await CategoryRepository.searchByKeyword(keyword);
        return res.status(200).json(categories);
    } catch (error) {
        respondWithError(res, error, "Erro ao pesquisar categorias.");
    }
}

async function getById(req: Request<{ id: string }>, res: Response) {
    try {
        const id = parseUuid(req.params.id, "ID da categoria");
        const category = await CategoryRepository.findById(id);
        return res.status(200).json(category);
    } catch (error) {
        respondWithError(res, error, "Erro ao buscar categoria.");
    }
}

async function create(req: Request, res: Response) {
    try {
        const category = parseCreateCategory(req.body);
        const createdCategory = await CategoryRepository.create(category);
        return res.status(201).json(createdCategory);
    } catch (error) {
        respondWithError(res, error, "Erro ao criar categoria.");
    }
}

async function update(req: Request<{ id: string }>, res: Response) {
    try {
        const id = parseUuid(req.params.id, "ID da categoria");
        const category = parseUpdateCategory(req.body);
        const updatedCategory = await CategoryRepository.update(id, category);
        return res.status(200).json(updatedCategory);
    } catch (error) {
        respondWithError(res, error, "Erro ao atualizar categoria.");
    }
}

async function remove(req: Request<{ id: string }>, res: Response) {
    try {
        const id = parseUuid(req.params.id, "ID da categoria");
        await CategoryRepository.remove(id);
        return res.status(200).json({
            message: "Categoria removida com sucesso.",
        });
    } catch (error) {
        respondWithError(res, error, "Erro ao excluir categoria.");
    }
}

export default {
    getAll,
    getByKeyword,
    getById,
    create,
    update,
    remove,
};
