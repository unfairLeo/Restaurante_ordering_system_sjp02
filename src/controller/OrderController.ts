import type { Request, Response } from "express";
import Order from "../model/order.js";

const VALID_STATUS = ["pending", "preparing", "ready", "delivered"];

function validateOrder(body: any): string | null {
    if (!body || typeof body.customer_name !== "string" || body.customer_name.trim() === "") {
        return "customer_name é obrigatório.";
    }

    if (typeof body.product_id !== "string" || body.product_id.trim() === "") {
        return "product_id é obrigatório.";
    }

    if (!Number.isInteger(body.quantity) || body.quantity <= 0) {
        return "quantity deve ser um inteiro maior que zero.";
    }

    if (body.status !== undefined && !VALID_STATUS.includes(body.status)) {
        return "status deve ser: pending, preparing, ready ou delivered.";
    }

    return null;
}

async function getAll(req: Request, res: Response) {
    try {
        const orders = await Order.findAll();

        res.status(200).json(orders);
    } catch (error) {
        console.log("Erro ao buscar pedidos: ", error);

        res.status(500).json({
            message: "Erro ao buscar pedidos."
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
        const orders = await Order.searchByKeyword(keyword);

        res.status(200).json(orders);
    } catch (error) {
        console.log("Erro ao pesquisar pedidos: ", error);

        res.status(500).json({
            message: "Erro ao pesquisar pedidos.",
        });
    }
}

async function getById(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    if (!id) {
        return res.status(404).json({
            message: "ID do pedido não informado."
        });
    }

    try {
        const order = await Order.findById(id);

        res.status(200).json(order);
    } catch (error) {
        console.log("Erro ao buscar pedido: ", error);

        res.status(404).json({
            message: "Pedido não encontrado."
        });
    }
}

async function create(req: Request, res: Response) {
    const validationError = validateOrder(req.body);

    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }

    try {
        const order = await Order.create({
            customer_name: req.body.customer_name.trim(),
            product_id: req.body.product_id,
            quantity: req.body.quantity,
            status: req.body.status ?? "pending",
        });

        res.status(201).json(order);
    } catch (error) {
        console.log("Erro ao criar pedido: ", error);

        res.status(500).json({
            message: "Erro ao criar pedido."
        });
    }
}

async function update(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    if (!id) {
        return res.status(404).json({
            message: "ID do pedido não informado."
        });
    }

    const validationError = validateOrder(req.body);

    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }

    try {
        const order = await Order.update(id, {
            customer_name: req.body.customer_name.trim(),
            product_id: req.body.product_id,
            quantity: req.body.quantity,
            status: req.body.status ?? "pending",
        });

        res.status(200).json(order);
    } catch (error) {
        console.log("Erro ao atualizar pedido: ", error);

        res.status(404).json({
            message: "Pedido não encontrado."
        });
    }
}

async function remove(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    if (!id) {
        return res.status(404).json({
            message: "ID do pedido não informado."
        });
    }

    try {
        await Order.remove(id);

        res.status(200).json({
            message: "Pedido removido com sucesso."
        });
    } catch (error) {
        console.log("Erro ao excluir pedido: ", error);

        res.status(404).json({
            message: "Pedido não encontrado."
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