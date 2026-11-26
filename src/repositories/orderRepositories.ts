import supabase from "../config/supabase.js";
import type {
    OrderCreateInput,
    OrderUpdateInput,
} from "../model/order.js";
import { NotFoundError } from "../error/notFoundError.js";
import { rethrowDatabaseError, rethrowWriteError } from "./repositoryErrors.js";

async function findAll() {
    const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        throw error;
    }

    return data;
}

async function findById(id: string) {
    const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
        rethrowDatabaseError(error, "Pedido não encontrado.");
    }

    if (!data) {
        throw new NotFoundError("Pedido não encontrado.");
    }

    return data;
}

async function create(order: OrderCreateInput) {
    const { data, error } = await supabase
        .from("orders")
        .insert({
            ...order,
            status: order.status ?? "pending",
        })
        .select()
        .single();

    if (error) {
        rethrowWriteError(error, "Produto informado não encontrado.");
    }

    if (!data) {
        throw new Error("Falha ao criar pedido.");
    }

    return data;
}

async function update(id: string, order: OrderUpdateInput) {
    const { data, error } = await supabase
        .from("orders")
        .update(order)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        rethrowDatabaseError(error, "Pedido não encontrado.", "Produto informado não encontrado.");
    }

    if (!data) {
        throw new NotFoundError("Pedido não encontrado.");
    }

    return data;
}

async function remove(id: string) {
    const { data, error } = await supabase
        .from("orders")
        .delete()
        .eq("id", id)
        .select()
        .single();

    if (error) {
        rethrowDatabaseError(error, "Pedido não encontrado.");
    }

    if (!data) {
        throw new NotFoundError("Pedido não encontrado.");
    }

    return data;
}

async function searchByKeyword(keyword: string) {
    const { data, error } = await supabase
        .from("orders")
        .select("*")
        .ilike("customer_name", `%${keyword}%`)
        .order("created_at", { ascending: false });

    if (error) {
        throw error;
    }

    return data;
}

export default {
    findAll,
    findById,
    create,
    update,
    remove,
    searchByKeyword,
}