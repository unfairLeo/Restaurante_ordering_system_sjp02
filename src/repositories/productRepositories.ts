import supabase from "../config/supabase.js";
import type {
    ProductCreateInput,
    ProductUpdateInput,
} from "../model/product.js";
import { NotFoundError } from "../error/notFoundError.js";

async function findAll() {
    const { data, error } = await supabase
        .from("products")
        .select("*");

    if (error) {
        throw error;
    }

    return data;
}

async function findById(id: string) {
    const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (error) {
        throw error;
    }

    if (!data) {
        throw new NotFoundError("Produto não encontrado.");
    }

    return data;
}

async function create(product: ProductCreateInput) {
    const { data, error } = await supabase
        .from("products")
        .insert({
            categoryId: product.categoryId,
            name: product.name,
            description: product.description ?? null,
            price: product.price,
            image: product.image ?? null,
            available: product.available ?? true,
            active: product.active ?? true,
        })
        .select()
        .single();

    if (error) {
        throw error;
    }

    if (!data) {
        throw new Error("Falha ao criar produto.");
    }

    return data;
}

async function update(id: string, product: ProductUpdateInput) {
    const { data, error } = await supabase
        .from("products")
        .update(product)
        .eq("id", id)
        .select()
        .maybeSingle();

    if (error) {
        throw error;
    }

    if (!data) {
        throw new NotFoundError("Produto não encontrado.");
    }

    return data;
}

async function remove(id: string) {
    const { data, error } = await supabase
        .from("products")
        .delete()
        .eq("id", id)
        .select()
        .maybeSingle();

    if (error) {
        throw error;
    }

    if (!data) {
        throw new NotFoundError("Produto não encontrado.");
    }

    return data;
}

async function searchByKeyword(keyword: string) {
    const { data, error } = await supabase
        .from("products")
        .select("*")
        .or(`name.ilike.%${keyword}%,description.ilike.%${keyword}%`)
        .order("name", { ascending: true });

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