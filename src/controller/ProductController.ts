import type { Request, Response } from "express";
import ProductRepository from "../repositories/productRepositories.js";
import type {
    Product,
    ProductCreateInput,
    ProductUpdateInput,
} from "../model/product.js";
import { NotFoundError } from "../error/notFoundError.js";

type ProductBaseInput = Pick<
    Product,
    "categoryId" | "name" | "description" | "price" | "image"
>;

type ProductFieldsResult =
    | { valid: true; body: Record<string, unknown>; fields: ProductBaseInput }
    | { valid: false; error: string };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
    return UUID_PATTERN.test(value.trim());
}

function validateProductFields(input: unknown): ProductFieldsResult {
    if (typeof input !== "object" || input === null || Array.isArray(input)) {
        return { valid: false, error: "Os dados do produto devem ser um objeto." };
    }

    const body = input as Record<string, unknown>;
    if (typeof body.categoryId !== "string" || !isUuid(body.categoryId)) {
        return { valid: false, error: "categoryId deve ser um UUID válido." };
    }

    if (typeof body.name !== "string" || body.name.trim() === "") {
        return { valid: false, error: "name é obrigatório." };
    }

    if (body.description !== undefined
        && body.description !== null
        && typeof body.description !== "string") {
        return { valid: false, error: "description deve ser um texto ou null." };
    }

    if (typeof body.price !== "number" || !Number.isFinite(body.price) || body.price < 0) {
        return { valid: false, error: "price deve ser um número maior ou igual a zero." };
    }

    if (body.image !== undefined && body.image !== null && typeof body.image !== "string") {
        return { valid: false, error: "image deve ser um texto ou null." };
    }

    return {
        valid: true,
        body,
        fields: {
            categoryId: body.categoryId.trim(),
            name: body.name.trim(),
            description: body.description ?? null,
            price: body.price,
            image: body.image ?? null,
        },
    };
}

function validateCreateProduct(input: unknown): ProductCreateInput | string {
    const result = validateProductFields(input);
    if (!result.valid) {
        return result.error;
    }

    if (result.body.available !== undefined && typeof result.body.available !== "boolean") {
        return "available deve ser true ou false.";
    }
    if (result.body.active !== undefined && typeof result.body.active !== "boolean") {
        return "active deve ser true ou false.";
    }

    return {
        ...result.fields,
        ...(result.body.available === undefined ? {} : { available: result.body.available }),
        ...(result.body.active === undefined ? {} : { active: result.body.active }),
    };
}

function validateUpdateProduct(input: unknown): ProductUpdateInput | string {
    const result = validateProductFields(input);
    if (!result.valid) {
        return result.error;
    }
    if (typeof result.body.available !== "boolean") {
        return "available deve ser true ou false.";
    }
    if (typeof result.body.active !== "boolean") {
        return "active deve ser true ou false.";
    }

    return {
        ...result.fields,
        available: result.body.available,
        active: result.body.active,
    };
}

async function getAll(_req: Request, res: Response) {
    try {
        const products = await ProductRepository.findAll();
        return res.status(200).json(products);
    } catch (error) {
        console.log("Erro ao buscar produtos: ", error);
        return res.status(500).json({ message: "Erro ao buscar produtos." });
    }
}

async function getByKeyword(req: Request, res: Response) {
    const { keyword } = req.query;
    if (typeof keyword !== "string" || keyword.trim() === "") {
        return res.status(400).json({ message: "Palavra-chave não informada." });
    }

    try {
        const products = await ProductRepository.searchByKeyword(keyword.trim());
        return res.status(200).json(products);
    } catch (error) {
        console.log("Erro ao pesquisar produtos: ", error);
        return res.status(500).json({ message: "Erro ao pesquisar produtos." });
    }
}

async function getById(req: Request<{ id: string }>, res: Response) {
    const id = req.params.id;
    if (!isUuid(id)) {
        return res.status(400).json({ message: "ID do produto deve ser um UUID válido." });
    }

    try {
        const product = await ProductRepository.findById(id.trim());
        return res.status(200).json(product);
    } catch (error) {
        console.log("Erro ao buscar produto: ", error);
        if (error instanceof NotFoundError) {
            return res.status(404).json({ message: error.message });
        }
        return res.status(500).json({ message: "Erro ao buscar produto." });
    }
}

async function create(req: Request, res: Response) {
    const product = validateCreateProduct(req.body);
    if (typeof product === "string") {
        return res.status(400).json({ message: product });
    }

    try {
        const createdProduct = await ProductRepository.create(product);
        return res.status(201).json(createdProduct);
    } catch (error) {
        console.log("Erro ao criar produto: ", error);
        if (typeof error === "object" && error !== null && "code" in error && error.code === "23503") {
            return res.status(400).json({ message: "A categoria informada não existe." });
        }
        return res.status(500).json({ message: "Erro ao criar produto." });
    }
}

async function update(req: Request<{ id: string }>, res: Response) {
    const id = req.params.id;
    if (!isUuid(id)) {
        return res.status(400).json({ message: "ID do produto deve ser um UUID válido." });
    }

    const product = validateUpdateProduct(req.body);
    if (typeof product === "string") {
        return res.status(400).json({ message: product });
    }

    try {
        const updatedProduct = await ProductRepository.update(id.trim(), product);
        return res.status(200).json(updatedProduct);
    } catch (error) {
        console.log("Erro ao atualizar produto: ", error);
        if (error instanceof NotFoundError) {
            return res.status(404).json({ message: error.message });
        }
        if (typeof error === "object" && error !== null && "code" in error && error.code === "23503") {
            return res.status(400).json({ message: "A categoria informada não existe." });
        }
        return res.status(500).json({ message: "Erro ao atualizar produto." });
    }
}

async function remove(req: Request<{ id: string }>, res: Response) {
    const id = req.params.id;
    if (!isUuid(id)) {
        return res.status(400).json({ message: "ID do produto deve ser um UUID válido." });
    }

    try {
        await ProductRepository.remove(id.trim());
        return res.status(200).json({ message: "Produto removido com sucesso." });
    } catch (error) {
        console.log("Erro ao excluir produto: ", error);
        if (error instanceof NotFoundError) {
            return res.status(404).json({ message: error.message });
        }
        if (typeof error === "object" && error !== null && "code" in error && error.code === "23503") {
            return res.status(409).json({
                message: "Produto não pode ser removido enquanto houver pedidos vinculados.",
            });
        }
        return res.status(500).json({ message: "Erro ao excluir produto." });
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
