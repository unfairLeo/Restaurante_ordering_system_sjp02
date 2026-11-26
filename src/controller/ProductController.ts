import type { Request, Response } from "express";
import ProductRepository from "../repositories/productRepositories.js";
import type { ProductCreateInput, ProductUpdateInput } from "../model/product.js";
import { ValidationError } from "../error/ValidationError.js";
import { parseKeyword, parseObjectBody, parseUuid } from "./requestValidation.js";
import { respondWithError } from "./respondWithError.js";

function parseProduct(input: unknown): ProductCreateInput {
    const body = parseObjectBody(input, "produto");

    const categoryId = parseUuid(body.categoryId, "categoryId");

    if (typeof body.name !== "string" || body.name.trim() === "") {
        throw new ValidationError("name é obrigatório.");
    }

    if (typeof body.description !== "string") {
        throw new ValidationError("description deve ser um texto.");
    }

    if (typeof body.price !== "number" || !Number.isFinite(body.price) || body.price < 0) {
        throw new ValidationError("price deve ser um número maior ou igual a zero.");
    }

    if (typeof body.image !== "string") {
        throw new ValidationError("image deve ser um texto.");
    }

    if (typeof body.available !== "boolean") {
        throw new ValidationError("available deve ser true ou false.");
    }

    if (typeof body.active !== "boolean") {
        throw new ValidationError("active deve ser true ou false.");
    }

    return {
        categoryId,
        name: body.name.trim(),
        description: body.description,
        price: body.price,
        image: body.image,
        available: body.available,
        active: body.active,
    };
}

async function getAll(_req: Request, res: Response) {
    try {
        const products = await ProductRepository.findAll();
        return res.status(200).json(products);
    } catch (error) {
        respondWithError(res, error, "Erro ao buscar produtos.");
    }
}

async function getByKeyword(req: Request, res: Response) {
    try {
        const keyword = parseKeyword(req.query.keyword);
        const products = await ProductRepository.searchByKeyword(keyword);
        return res.status(200).json(products);
    } catch (error) {
        respondWithError(res, error, "Erro ao pesquisar produtos.");
    }
}

async function getById(req: Request<{ id: string }>, res: Response) {
    try {
        const id = parseUuid(req.params.id, "ID do produto");
        const product = await ProductRepository.findById(id);
        return res.status(200).json(product);
    } catch (error) {
        respondWithError(res, error, "Erro ao buscar produto.");
    }
}

async function create(req: Request, res: Response) {
    try {
        const product = parseProduct(req.body);
        const createdProduct = await ProductRepository.create(product);
        return res.status(201).json(createdProduct);
    } catch (error) {
        respondWithError(res, error, "Erro ao criar produto.");
    }
}

async function update(req: Request<{ id: string }>, res: Response) {
    try {
        const id = parseUuid(req.params.id, "ID do produto");
        const product: ProductUpdateInput = parseProduct(req.body);
        const updatedProduct = await ProductRepository.update(id, product);
        return res.status(200).json(updatedProduct);
    } catch (error) {
        respondWithError(res, error, "Erro ao atualizar produto.");
    }
}

async function remove(req: Request<{ id: string }>, res: Response) {
    try {
        const id = parseUuid(req.params.id, "ID do produto");
        await ProductRepository.remove(id);
        return res.status(200).json({
            message: "Produto removido com sucesso.",
        });
    } catch (error) {
        respondWithError(res, error, "Erro ao excluir produto.");
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
