type OperationOptions = {
    status?: number;
    parameters?: object[];
    requestSchema?: string;
    errors?: Record<string, string>;
};

function operation(
    tag: string,
    summary: string,
    {
        status = 200,
        parameters = [],
        requestSchema,
        errors = {},
    }: OperationOptions = {},
) {
    const responses: Record<string, { description: string }> = {
        [status]: { description: "Operação realizada com sucesso." },
    };

    for (const [code, description] of Object.entries(errors)) {
        responses[code] = { description };
    }

    return {
        tags: [tag],
        summary,
        ...(parameters.length > 0 ? { parameters } : {}),
        ...(requestSchema
            ? {
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: `#/components/schemas/${requestSchema}` },
                        },
                    },
                },
            }
            : {}),
        responses,
    };
}

const idParameter = {
    name: "id",
    in: "path",
    required: true,
    schema: { type: "string", format: "uuid" },
};

const keywordParameter = {
    name: "keyword",
    in: "query",
    required: true,
    schema: { type: "string", minLength: 1 },
};

export const openApiSpec = {
    openapi: "3.0.3",
    info: {
        title: "Restaurant Ordering System API",
        version: "1.0.0",
    },
    servers: [{ url: "http://localhost:3000" }],
    paths: {
        "/categories": {
            get: operation("Categorias", "Lista categorias", {
                errors: { "500": "Erro interno." },
            }),
            post: operation("Categorias", "Cria uma categoria", {
                status: 201,
                requestSchema: "CategoryCreate",
                errors: { "400": "Dados inválidos.", "500": "Erro interno." },
            }),
        },
        "/categories/search": {
            get: operation("Categorias", "Pesquisa categorias", {
                parameters: [keywordParameter],
                errors: { "400": "Palavra-chave inválida.", "500": "Erro interno." },
            }),
        },
        "/categories/{id}": {
            get: operation("Categorias", "Busca categoria por ID", {
                parameters: [idParameter],
                errors: { "400": "ID inválido.", "404": "Não encontrada.", "500": "Erro interno." },
            }),
            put: operation("Categorias", "Atualiza uma categoria", {
                parameters: [idParameter],
                requestSchema: "CategoryUpdate",
                errors: { "400": "Dados ou ID inválidos.", "404": "Não encontrada.", "500": "Erro interno." },
            }),
            delete: operation("Categorias", "Remove uma categoria", {
                parameters: [idParameter],
                errors: {
                    "400": "ID inválido.",
                    "404": "Não encontrada.",
                    "409": "Categoria possui produtos vinculados.",
                    "500": "Erro interno.",
                },
            }),
        },
        "/products": {
            get: operation("Produtos", "Lista produtos", {
                errors: { "500": "Erro interno." },
            }),
            post: operation("Produtos", "Cria um produto", {
                status: 201,
                requestSchema: "ProductCreate",
                errors: { "400": "Dados inválidos ou categoria inexistente.", "500": "Erro interno." },
            }),
        },
        "/products/search": {
            get: operation("Produtos", "Pesquisa produtos", {
                parameters: [keywordParameter],
                errors: { "400": "Palavra-chave inválida.", "500": "Erro interno." },
            }),
        },
        "/products/{id}": {
            get: operation("Produtos", "Busca produto por ID", {
                parameters: [idParameter],
                errors: { "400": "ID inválido.", "404": "Não encontrado.", "500": "Erro interno." },
            }),
            put: operation("Produtos", "Atualiza um produto", {
                parameters: [idParameter],
                requestSchema: "ProductUpdate",
                errors: { "400": "Dados ou categoria inválidos.", "404": "Não encontrado.", "500": "Erro interno." },
            }),
            delete: operation("Produtos", "Remove um produto", {
                parameters: [idParameter],
                errors: {
                    "400": "ID inválido.",
                    "404": "Não encontrado.",
                    "409": "Produto possui pedidos vinculados.",
                    "500": "Erro interno.",
                },
            }),
        },
        "/orders": {
            get: operation("Pedidos", "Lista pedidos", {
                errors: { "500": "Erro interno." },
            }),
            post: operation("Pedidos", "Cria um pedido", {
                status: 201,
                requestSchema: "OrderInput",
                errors: { "400": "Dados inválidos ou produto inexistente.", "500": "Erro interno." },
            }),
        },
        "/orders/search": {
            get: operation("Pedidos", "Pesquisa pedidos pelo cliente", {
                parameters: [keywordParameter],
                errors: { "400": "Palavra-chave inválida.", "500": "Erro interno." },
            }),
        },
        "/orders/{id}": {
            get: operation("Pedidos", "Busca pedido por ID", {
                parameters: [idParameter],
                errors: { "400": "ID inválido.", "404": "Não encontrado.", "500": "Erro interno." },
            }),
            put: operation("Pedidos", "Atualiza um pedido", {
                parameters: [idParameter],
                requestSchema: "OrderInput",
                errors: {
                    "400": "Dados inválidos ou produto inexistente.",
                    "404": "Não encontrado.",
                    "500": "Erro interno.",
                },
            }),
            delete: operation("Pedidos", "Remove um pedido", {
                parameters: [idParameter],
                errors: { "400": "ID inválido.", "404": "Não encontrado.", "500": "Erro interno." },
            }),
        },
    },
    components: {
        schemas: {
            CategoryCreate: {
                type: "object",
                required: ["name", "display_order"],
                properties: {
                    name: { type: "string", example: "Pizzas" },
                    description: { type: "string", nullable: true },
                    icon: { type: "string", nullable: true },
                    display_order: { type: "integer", minimum: 0 },
                    active: { type: "boolean" },
                },
            },
            CategoryUpdate: {
                type: "object",
                required: ["name", "display_order", "active"],
                properties: {
                    name: { type: "string" },
                    description: { type: "string", nullable: true },
                    icon: { type: "string", nullable: true },
                    display_order: { type: "integer", minimum: 0 },
                    active: { type: "boolean" },
                },
            },
            ProductCreate: {
                type: "object",
                required: ["categoryId", "name", "price"],
                properties: {
                    categoryId: { type: "string", format: "uuid" },
                    name: { type: "string", example: "Pizza Margherita" },
                    description: { type: "string", nullable: true },
                    price: { type: "number", minimum: 0 },
                    image: { type: "string", nullable: true },
                    available: { type: "boolean" },
                    active: { type: "boolean" },
                },
            },
            ProductUpdate: {
                type: "object",
                required: ["categoryId", "name", "price", "available", "active"],
                properties: {
                    categoryId: { type: "string", format: "uuid" },
                    name: { type: "string" },
                    description: { type: "string", nullable: true },
                    price: { type: "number", minimum: 0 },
                    image: { type: "string", nullable: true },
                    available: { type: "boolean" },
                    active: { type: "boolean" },
                },
            },
            OrderInput: {
                type: "object",
                required: ["customer_name", "product_id", "quantity"],
                properties: {
                    customer_name: { type: "string", example: "Leonardo" },
                    product_id: { type: "string", format: "uuid" },
                    quantity: { type: "integer", minimum: 1 },
                    status: {
                        type: "string",
                        enum: ["pending", "preparing", "ready", "delivered"],
                    },
                },
            },
        },
    },
} as const;
