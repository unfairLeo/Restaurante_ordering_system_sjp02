export interface Product {
    id?: string;
    categoryId: string;
    name: string;
    description: string | null;
    price: number;
    image: string | null;
    available: boolean;
    active: boolean;
}

export type ProductCreateInput = Pick<Product, "categoryId" | "name" | "price">
    & Partial<Pick<Product, "description" | "image" | "available" | "active">>;

export type ProductUpdateInput = Omit<Product, "id">;
