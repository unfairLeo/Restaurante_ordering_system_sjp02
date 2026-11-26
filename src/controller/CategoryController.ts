import type { Request, Response } from "express";
import CategoryRepository from "../repositories/categoryRepository.js";
import type {
    CategoryCreateInput,
    CategoryUpdateInput,
} from "../model/category.js";
import { NotFoundError } from "../error/notFoundError.js";

type CategoryBaseInput = Pick<
    CategoryUpdateInput,
    "name" | "description" | "icon" | "display_order"
>;

type CategoryFieldsResult =
    | { valid: true; body: Record<string, unknown>; fields: CategoryBaseInput }
    | { valid: false; error: string };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
    return UUID_PATTERN.test(value.trim());
}

function validateCategoryFields(input: unknown): CategoryFieldsResult {
    if (typeof input !== "object" || input === null || Array.isArray(input)) {
        return { valid: false, error: "Os dados da categoria devem ser um objeto." };
    }

    const body = input as Record<string, unknown>;

    if (typeof body.name !== "string" || body.name.trim() === "") {
        return { valid: false, error: "name é obrigatório." };
    }

    if (body.description !== undefined
        && body.description !== null
        && typeof body.description !== "string") {
        return { valid: false, error: "description deve ser um texto ou null." };
    }

    if (body.icon !== undefined && body.icon !== null && typeof body.icon !== "string") {
        return { valid: false, error: "icon deve ser um texto ou null." };
    }

    if (typeof body.display_order !== "number"
        || !Number.isInteger(body.display_order)
        || body.display_order < 0) {
        return {
            valid: false,
            error: "display_order deve ser um número inteiro maior ou igual a zero.",
        };
    }

    return {
        valid: true,
        body,
        fields: {
            name: body.name.trim(),
            description: body.description ?? null,
            icon: body.icon ?? null,
            display_order: body.display_order,
        },
    };
}

function validateCreateCategory(input: unknown): CategoryCreateInput | string {
    const result = validateCategoryFields(input);
    if (!result.valid) {
        return result.error;
    }

    if (result.body.active !== undefined && typeof result.body.active !== "boolean") {
        return "active deve ser true ou false.";
    }

    return result.body.active === undefined
        ? result.fields
        : { ...result.fields, active: result.body.active };
}

function validateUpdateCategory(input: unknown): CategoryUpdateInput | string {
    const result = validateCategoryFields(input);
    if (!result.valid) {
        return result.error;
    }

    if (typeof result.body.active !== "boolean") {
        return "active deve ser true ou false.";
    }

    return { ...result.fields, active: result.body.active };
}

async function getAll(_req: Request, res: Response) {
    try {
        const categories = await CategoryRepository.findAll();
        return res.status(200).json(categories);
    } catch (error) {
        console.log("Erro ao buscar categorias: ", error);
        return res.status(500).json({ message: "Erro ao buscar categorias." });
    }
}

async function getByKeyword(req: Request, res: Response) {
    const { keyword } = req.query;
    if (typeof keyword !== "string" || keyword.trim() === "") {
        return res.status(400).json({ message: "Palavra-chave não informada." });
    }

    try {
        const categories = await CategoryRepository.searchByKeyword(keyword.trim());
        return res.status(200).json(categories);
    } catch (error) {
        console.log("Erro ao pesquisar categorias: ", error);
        return res.status(500).json({ message: "Erro ao pesquisar categorias." });
    }
}

async function getById(req: Request<{ id: string }>, res: Response) {
    const id = req.params.id;
    if (!isUuid(id)) {
        return res.status(400).json({ message: "ID da categoria deve ser um UUID válido." });
    }

    try {
        const category = await CategoryRepository.findById(id.trim());
        return res.status(200).json(category);
    } catch (error) {
        console.log("Erro ao buscar categoria: ", error);
        if (error instanceof NotFoundError) {
            return res.status(404).json({ message: error.message });
        }
        return res.status(500).json({ message: "Erro ao buscar categoria." });
    }
}

async function create(req: Request, res: Response) {
    const category = validateCreateCategory(req.body);
    if (typeof category === "string") {
        return res.status(400).json({ message: category });
    }

    try {
        const createdCategory = await CategoryRepository.create(category);
        return res.status(201).json(createdCategory);
    } catch (error) {
        console.log("Erro ao criar categoria: ", error);
        return res.status(500).json({ message: "Erro ao criar categoria." });
    }
}

async function update(req: Request<{ id: string }>, res: Response) {
    const id = req.params.id;
    if (!isUuid(id)) {
        return res.status(400).json({ message: "ID da categoria deve ser um UUID válido." });
    }

    const category = validateUpdateCategory(req.body);
    if (typeof category === "string") {
        return res.status(400).json({ message: category });
    }

    try {
        const updatedCategory = await CategoryRepository.update(id.trim(), category);
        return res.status(200).json(updatedCategory);
    } catch (error) {
        console.log("Erro ao atualizar categoria: ", error);
        if (error instanceof NotFoundError) {
            return res.status(404).json({ message: error.message });
        }
        return res.status(500).json({ message: "Erro ao atualizar categoria." });
    }
}

async function remove(req: Request<{ id: string }>, res: Response) {
    const id = req.params.id;
    if (!isUuid(id)) {
        return res.status(400).json({ message: "ID da categoria deve ser um UUID válido." });
    }

    try {
        await CategoryRepository.remove(id.trim());
        return res.status(200).json({ message: "Categoria removida com sucesso." });
    } catch (error) {
        console.log("Erro ao excluir categoria: ", error);
        if (error instanceof NotFoundError) {
            return res.status(404).json({ message: error.message });
        }
        if (typeof error === "object" && error !== null && "code" in error && error.code === "23503") {
            return res.status(409).json({
                message: "Categoria não pode ser removida enquanto houver produtos vinculados.",
            });
        }
        return res.status(500).json({ message: "Erro ao excluir categoria." });
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
