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