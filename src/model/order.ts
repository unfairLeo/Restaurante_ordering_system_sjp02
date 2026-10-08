import supabase from "../config/supabase.js";

export interface Order {
    id?: string;
    customer_name: string;
    product_id: string;
    quantity: number;
    status: string;
}


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
        throw error;
    }

    return data;
}

async function create(order: {
    customer_name: string;
    product_id: string;
    quantity: number;
    status: string;
}) {
    const { data, error } = await supabase
        .from("orders")
        .insert(order)
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}

async function update(
    id: string,
    order: {
        customer_name: string;
        product_id: string;
        quantity: number;
        status: string;
    }) {
    const { data, error } = await supabase
        .from("orders")
        .update(order)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        throw error;
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
        throw error;
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