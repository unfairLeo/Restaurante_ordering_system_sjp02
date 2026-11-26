import type { Request, Response } from "express";
import OrderRepository from "../repositories/orderRepositories.js";
import type { OrderStatus, OrderUpdateInput } from "../model/order.js";
import { ValidationError } from "../error/ValidationError.js";
import { parseKeyword, parseObjectBody, parseUuid } from "./requestValidation.js";
import { respondWithError } from "./respondWithError.js";

const VALID_ORDER_STATUSES = new Set<string>([
    "pending",
    "preparing",
    "ready",
    "delivered",
]);

function isOrderStatus(value: unknown): value is OrderStatus {
    return typeof value === "string" && VALID_ORDER_STATUSES.has(value);
}

function parseOrder(input: unknown): OrderUpdateInput {
    const body = parseObjectBody(input, "pedido");

    if (typeof body.customer_name !== "string" || body.customer_name.trim() === "") {
        throw new ValidationError("customer_name é obrigatório.");
    }

    const productId = parseUuid(body.product_id, "product_id");

    if (typeof body.quantity !== "number"
        || !Number.isInteger(body.quantity)
        || body.quantity <= 0) {
        throw new ValidationError("quantity deve ser um inteiro maior que zero.");
    }

    if (body.status !== undefined && !isOrderStatus(body.status)) {
        throw new ValidationError(
            "status deve ser: pending, preparing, ready ou delivered.",
        );
    }

    return {
        customer_name: body.customer_name.trim(),
        product_id: productId,
        quantity: body.quantity,
        status: body.status === undefined ? "pending" : body.status,
    };
}

async function getAll(_req: Request, res: Response) {
    try {
        const orders = await OrderRepository.findAll();
        return res.status(200).json(orders);
    } catch (error) {
        respondWithError(res, error, "Erro ao buscar pedidos.");
    }
}

async function getByKeyword(req: Request, res: Response) {
    try {
        const keyword = parseKeyword(req.query.keyword);
        const orders = await OrderRepository.searchByKeyword(keyword);
        return res.status(200).json(orders);
    } catch (error) {
        respondWithError(res, error, "Erro ao pesquisar pedidos.");
    }
}

async function getById(req: Request<{ id: string }>, res: Response) {
    try {
        const id = parseUuid(req.params.id, "ID do pedido");
        const order = await OrderRepository.findById(id);
        return res.status(200).json(order);
    } catch (error) {
        respondWithError(res, error, "Erro ao buscar pedido.");
    }
}

async function create(req: Request, res: Response) {
    try {
        const order = parseOrder(req.body);
        const createdOrder = await OrderRepository.create(order);
        return res.status(201).json(createdOrder);
    } catch (error) {
        respondWithError(res, error, "Erro ao criar pedido.");
    }
}

async function update(req: Request<{ id: string }>, res: Response) {
    try {
        const id = parseUuid(req.params.id, "ID do pedido");
        const order = parseOrder(req.body);
        const updatedOrder = await OrderRepository.update(id, order);
        return res.status(200).json(updatedOrder);
    } catch (error) {
        respondWithError(res, error, "Erro ao atualizar pedido.");
    }
}

async function remove(req: Request<{ id: string }>, res: Response) {
    try {
        const id = parseUuid(req.params.id, "ID do pedido");
        await OrderRepository.remove(id);
        return res.status(200).json({
            message: "Pedido removido com sucesso.",
        });
    } catch (error) {
        respondWithError(res, error, "Erro ao excluir pedido.");
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
