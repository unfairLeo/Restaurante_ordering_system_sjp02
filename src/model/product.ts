export interface Product {
    id?: string;
    categoryId: string;
    name: string;
    description: string;
    price: number;
    image: string;
    available: boolean;
    active: boolean;
}

export type ProductCreateInput = Omit<Product, "id">;
export type ProductUpdateInput = Omit<Product, "id">;