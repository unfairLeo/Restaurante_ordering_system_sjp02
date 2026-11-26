import supabase from "../config/supabase.js";

export interface Category {
    id?: string;
    name: string;
    description: string | null;
    icon: string | null;
    display_order: number;
    active: boolean;
}

export type CategoryCreateInput = Pick<Category, "name" | "display_order">
    & Partial<Pick<Category, "description" | "icon" | "active">>;

export type CategoryUpdateInput = Omit<Category, "id">;


async function findAll() {
    const { data, error } = await supabase
        .from("categories")
        .select("*");

    if (error) {
        throw error;
    }

    return data;
}

async function findById(id: string) {
    const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
        throw error;
    }

    return data;
}

async function create(category: CategoryCreateInput) {
    const { data, error } = await supabase
        .from("categories")
        .insert({
            name: category.name,
            description: category.description ?? null,
            icon: category.icon ?? null,
            display_order: category.display_order,
            active: category.active ?? true,
        })
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}

async function update(
    id: string,
    category: CategoryUpdateInput) {
    const { data, error } = await supabase
        .from("categories")
        .update(category)
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
        .from("categories")
        .delete()
        .eq("id", id)
        .single();

    if (error) {
        throw error;
    }

    return data;
}

async function searchByKeyword(keyword: string) {
    const { data, error } = await supabase
        .from("categories")
        .select("*")
        .or(`name.ilike.%${keyword}%,description.ilike.%${keyword}%`)
        .order("display_order", { ascending: true });

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