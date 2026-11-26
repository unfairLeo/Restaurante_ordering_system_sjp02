export type OrderStatus = "pending" | "preparing" | "ready" | "delivered";

export interface Order {
    id?: string;
    customer_name: string;
    product_id: string;
    quantity: number;
    status: OrderStatus;
}


export type OrderCreateInput = Pick<Order, "customer_name" | "product_id" | "quantity">
    & Partial<Pick<Order, "status">>;

export type OrderUpdateInput = Omit<Order, "id">;