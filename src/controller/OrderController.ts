import type { Request, Response } from "express";
import OrderRepository from "../repositories/orderRepositories.js";
import type { OrderStatus, OrderUpdateInput } from "../model/order.js";
import { NotFoundError } from "../error/notFoundError.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VALID_ORDER_STATUSES = new Set<string>([
    "pending",
    "preparing",
    "ready",
    "delivered",
]);

function isUuid(value: string): boolean {
    return UUID_PATTERN.test(value.trim());
}

function isOrderStatus(value: unknown): value is OrderStatus {
    return typeof value === "string" && VALID_ORDER_STATUSES.has(value);
}

function validateOrder(input: unknown): OrderUpdateInput | string {
    if (typeof input !== "object" || input === null || Array.isArray(input)) {
        return "Os dados do pedido devem ser um objeto.";
    }

    const body = input as Record<string, unknown>;
    if (typeof body.customer_name !== "string" || body.customer_name.trim() === "") {
        return "customer_name é obrigatório.";
    }
    if (typeof body.product_id !== "string" || !isUuid(body.product_id)) {
        return "product_id deve ser um UUID válido.";
    }
    if (typeof body.quantity !== "number"
        || !Number.isInteger(body.quantity)
        || body.quantity <= 0) {
        return "quantity deve ser um inteiro maior que zero.";
    }
    if (body.status !== undefined && !isOrderStatus(body.status)) {
        return "status deve ser: pending, preparing, ready ou delivered.";
    }

    return {
        customer_name: body.customer_name.trim(),
        product_id: body.product_id.trim(),
        quantity: body.quantity,
        status: body.status === undefined ? "pending" : body.status,
    };
}

async function getAll(_req: Request, res: Response) {
    try {
        const orders = await OrderRepository.findAll();
        return res.status(200).json(orders);
    } catch (error) {
        console.log("Erro ao buscar pedidos: ", error);
        return res.status(500).json({ message: "Erro ao buscar pedidos." });
    }
}

async function getByKeyword(req: Request, res: Response) {
    const { keyword } = req.query;
    if (typeof keyword !== "string" || keyword.trim() === "") {
        return res.status(400).json({ message: "Palavra-chave não informada." });
    }

    try {
        const orders = await OrderRepository.searchByKeyword(keyword.trim());
        return res.status(200).json(orders);
    } catch (error) {
        console.log("Erro ao pesquisar pedidos: ", error);
        return res.status(500).json({ message: "Erro ao pesquisar pedidos." });
    }
}

async function getById(req: Request<{ id: string }>, res: Response) {
    const id = req.params.id;
    if (!isUuid(id)) {
        return res.status(400).json({ message: "ID do pedido deve ser um UUID válido." });
    }

    try {
        const order = await OrderRepository.findById(id.trim());
        return res.status(200).json(order);
    } catch (error) {
        console.log("Erro ao buscar pedido: ", error);
        if (error instanceof NotFoundError) {
            return res.status(404).json({ message: error.message });
        }
        return res.status(500).json({ message: "Erro ao buscar pedido." });
    }
}

async function create(req: Request, res: Response) {
    const order = validateOrder(req.body);
    if (typeof order === "string") {
        return res.status(400).json({ message: order });
    }

    try {
        const createdOrder = await OrderRepository.create(order);
        return res.status(201).json(createdOrder);
    } catch (error) {
        console.log("Erro ao criar pedido: ", error);
        if (typeof error === "object" && error !== null && "code" in error && error.code === "23503") {
            return res.status(400).json({ message: "O produto informado não existe." });
        }
        return res.status(500).json({ message: "Erro ao criar pedido." });
    }
}

async function update(req: Request<{ id: string }>, res: Response) {
    const id = req.params.id;
    if (!isUuid(id)) {
        return res.status(400).json({ message: "ID do pedido deve ser um UUID válido." });
    }

    const order = validateOrder(req.body);
    if (typeof order === "string") {
        return res.status(400).json({ message: order });
    }

    try {
        const updatedOrder = await OrderRepository.update(id.trim(), order);
        return res.status(200).json(updatedOrder);
    } catch (error) {
        console.log("Erro ao atualizar pedido: ", error);
        if (error instanceof NotFoundError) {
            return res.status(404).json({ message: error.message });
        }
        if (typeof error === "object" && error !== null && "code" in error && error.code === "23503") {
            return res.status(400).json({ message: "O produto informado não existe." });
        }
        return res.status(500).json({ message: "Erro ao atualizar pedido." });
    }
}

async function remove(req: Request<{ id: string }>, res: Response) {
    const id = req.params.id;
    if (!isUuid(id)) {
        return res.status(400).json({ message: "ID do pedido deve ser um UUID válido." });
    }

    try {
        await OrderRepository.remove(id.trim());
        return res.status(200).json({ message: "Pedido removido com sucesso." });
    } catch (error) {
        console.log("Erro ao excluir pedido: ", error);
        if (error instanceof NotFoundError) {
            return res.status(404).json({ message: error.message });
        }
        return res.status(500).json({ message: "Erro ao excluir pedido." });
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
