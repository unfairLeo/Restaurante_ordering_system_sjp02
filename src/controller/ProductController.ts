import type { Request, Response } from "express";
import Product from "../model/product.js";

async function getAll(req: Request, res: Response) {
    try {
        const products = await Product.findAll();

        res.status(200).json(products);
    } catch (error) {
        console.log("Erro ao buscar produtos: ", error);

        res.status(500).json({
            message: "Erro ao buscar produtos."
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
        const products = await Product.searchByKeyword(keyword);

        res.status(200).json(products);
    } catch (error) {
        console.log("Erro ao pesquisar produtos: ", error);

        res.status(500).json({
            message: "Erro ao pesquisar produtos.",
        });
    }
}

async function getById(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    if (!id) {
        return res.status(404).json({
            message: "ID do produto não informado."
        });
    }

    try {
        const product = await Product.findById(id);

        res.status(200).json(product);
    } catch (error) {
        console.log("Erro ao buscar produto: ", error);

        res.status(404).json({
            message: "Produto não encontrado."
        });
    }
}

async function create(req: Request, res: Response) {
    try {
        const product = await Product.create(req.body);

        res.status(201).json(product);
    } catch (error) {
        console.log("Erro ao criar produto: ", error);

        res.status(500).json({
            message: "Erro ao criar produto."
        });
    }
}

async function update(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    if (!id) {
        return res.status(404).json({
            message: "ID do produto não informado."
        });
    }

    try {
        const product = await Product.update(id, req.body);

        res.status(200).json(product);
    } catch (error) {
        console.log("Erro ao atualizar produto: ", error);

        res.status(404).json({
            message: "Produto não encontrado."
        });
    }
}

async function remove(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    if (!id) {
        return res.status(404).json({
            message: "ID do produto não informado."
        });
    }

    try {
        await Product.remove(id);

        res.status(200).json({
            message: "Produto removido com sucesso."
        });
    } catch (error) {
        console.log("Erro ao excluir produto: ", error);

        res.status(404).json({
            message: "Produto não encontrado."
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
};