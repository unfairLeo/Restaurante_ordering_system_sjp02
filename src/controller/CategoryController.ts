import type { Request, Response } from "express";
import Category, {
    type Category as CategoryData,
    type CategoryCreateInput,
    type CategoryUpdateInput,
} from "../model/category.js";

type CategoryBaseInput = Pick<
    CategoryData,
    "name" | "description" | "icon" | "display_order"
>;

type ParseResult<T> =
    | { value: T; error?: never }
    | { value?: never; error: string };

function parseCategoryFields(input: unknown): ParseResult<{
    body: Record<string, unknown>;
    value: CategoryBaseInput;
}> {
    if (typeof input !== "object" || input === null || Array.isArray(input)) {
        return { error: "Os dados da categoria devem ser um objeto." };
    }

    const body = input as Record<string, unknown>;

    if (typeof body.name !== "string" || body.name.trim() === "") {
        return { error: "name é obrigatório." };
    }

    if (body.description !== undefined && body.description !== null && typeof body.description !== "string") {
        return { error: "description deve ser um texto ou null." };
    }

    if (body.icon !== undefined && body.icon !== null && typeof body.icon !== "string") {
        return { error: "icon deve ser um texto ou null." };
    }

    if (typeof body.display_order !== "number" || !Number.isInteger(body.display_order)) {
        return { error: "display_order deve ser um número inteiro." };
    }

    return {
        value: {
            body,
            value: {
                name: body.name.trim(),
                description: body.description ?? null,
                icon: body.icon ?? null,
                display_order: body.display_order,
            },
        },
    };
}

function parseCreateCategory(input: unknown): ParseResult<CategoryCreateInput> {
    const parsed = parseCategoryFields(input);

    if (!parsed.value) {
        return { error: parsed.error };
    }

    const { body, value } = parsed.value;

    if (body.active !== undefined && typeof body.active !== "boolean") {
        return { error: "active deve ser true ou false." };
    }

    return {
        value: body.active === undefined ? value : { ...value, active: body.active },
    };
}

function parseUpdateCategory(input: unknown): ParseResult<CategoryUpdateInput> {
    const parsed = parseCategoryFields(input);

    if (!parsed.value) {
        return { error: parsed.error };
    }

    const { body, value } = parsed.value;

    if (typeof body.active !== "boolean") {
        return { error: "active deve ser true ou false." };
    }

    return {
        value: { ...value, active: body.active },
    };
}

function isNotFoundError(error: unknown): boolean {
    return typeof error === "object"
        && error !== null
        && "code" in error
        && error.code === "PGRST116";
}

async function getAll(req: Request, res: Response) {
    try {
        const categories = await Category.findAll();

        res.status(200).json(categories)
    } catch (error) {
        console.log("Erro ao buscar categorias: ", error);

        res.status(500).json({
            message: "Erro ao buscar categorias."
        });
    }
}

async function getByKeyword(req: Request, res: Response) {
    const { keyword } = req.query;

    if (!keyword || typeof keyword != "string") {
        return res.status(400).json({
            message: "Palavra-chave não informada."
        });
    }

    try {
        const categories = await Category.searchByKeyword(keyword);

        res.status(200).json(categories);
    } catch (error) {
        console.log("Erro ao pesquisar categorias: ", error);

        res.status(500).json({
            message: "Erro ao pesquisar categorias.",
        });
    }
}

async function getById(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    if (!id) {
        return res.status(404).json({
            message: "ID da categoria não informado."
        });
    }

    try {
        const category = await Category.findById(id);

        res.status(200).json(category)
    } catch (error) {
        console.log("Erro ao buscar categoria: ", error);

        const notFound = isNotFoundError(error);
        res.status(notFound ? 404 : 500).json({
            message: notFound ? "Categoria não encontrada." : "Erro ao buscar categoria."
        });
    }
}

async function create(req: Request, res: Response) {
    const parsedCategory = parseCreateCategory(req.body);

    if (!parsedCategory.value) {
        return res.status(400).json({
            message: parsedCategory.error
        });
    }

    try {
        const category = await Category.create(parsedCategory.value);

        res.status(201).json(category)
    } catch (error) {
        console.log("Erro ao criar categoria: ", error);

        res.status(500).json({
            message: "Erro ao criar categoria."
        });
    }
}

async function update(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    if (!id) {
        return res.status(404).json({
            message: "ID da categoria não informado."
        });
    }

    const parsedCategory = parseUpdateCategory(req.body);

    if (!parsedCategory.value) {
        return res.status(400).json({
            message: parsedCategory.error
        });
    }

    try {
        const category = await Category.update(id, parsedCategory.value);

        res.status(200).json(category)
    } catch (error) {
        console.log("Erro ao atualizar categoria: ", error);

        const notFound = isNotFoundError(error);
        res.status(notFound ? 404 : 500).json({
            message: notFound ? "Categoria não encontrada." : "Erro ao atualizar categoria."
        });
    }
}

async function remove(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    if (!id) {
        return res.status(404).json({
            message: "ID da categoria não informado."
        });
    }

    try {
        await Category.remove(id);

        res.status(200).json({
            message: "Categoria removida com sucesso."
        })
    } catch (error) {
        console.log("Erro ao excluir categoria: ", error);

        const notFound = isNotFoundError(error);
        res.status(notFound ? 404 : 500).json({
            message: notFound ? "Categoria não encontrada." : "Erro ao excluir categoria."
        });
    }
}

export default {
    getAll,
    getByKeyword,
    getById,
    create,
    update,
    remove
}