import assert from "node:assert/strict";
import { after, afterEach, before, test } from "node:test";

process.env.SUPABASE_URL ??= "http://127.0.0.1:54321";
process.env.SUPABASE_SECRET_KEY ??= "test-key";

const [
    { default: app },
    { default: ProductRepository },
    { NotFoundError },
] = await Promise.all([
    import("../app.js"),
    import("../repositories/productRepositories.js"),
    import("../error/notFoundError.js"),
]);

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

const categoryId = "bdf4183d-79a0-4f6f-8ead-03400eb6ed60";
const productId = "c9bf9e57-1685-4c89-bafb-ff5af830be8a";
const restorers: Array<() => void> = [];
let server: ReturnType<typeof app.listen>;
let baseUrl: string;

function stubMethod<T extends object, K extends keyof T>(
    target: T,
    key: K,
    replacement: T[K],
): void {
    const original = target[key];
    target[key] = replacement;
    restorers.push(() => {
        target[key] = original;
    });
}

async function request(
    path: string,
    init?: RequestInit,
): Promise<{ status: number; body: Json }> {
    const response = await fetch(`${baseUrl}${path}`, init);
    return { status: response.status, body: await response.json() as Json };
}

function jsonRequest(method: string, value: unknown): RequestInit {
    return {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(value),
    };
}

async function withoutControllerLogs<T>(action: () => Promise<T>): Promise<T> {
    const originalLog = console.log;
    console.log = () => {};
    try {
        return await action();
    } finally {
        console.log = originalLog;
    }
}

before(async () => {
    server = app.listen(0, "127.0.0.1");
    await new Promise<void>((resolve, reject) => {
        server.once("error", reject);
        server.once("listening", resolve);
    });

    const address = server.address();
    if (!address || typeof address === "string") {
        throw new Error("Não foi possível iniciar o servidor de testes.");
    }
    baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
    await new Promise<void>((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
    });
});

afterEach(() => {
    for (const restore of restorers.splice(0).reverse()) {
        restore();
    }
});

test("cria produto válido, normaliza campos e aplica padrões", async () => {
    let received: unknown;
    stubMethod(ProductRepository, "create", async (product) => {
        received = product;
        return {
            id: productId,
            ...product,
            available: product.available ?? true,
            active: product.active ?? true,
        };
    });

    const response = await request("/products", jsonRequest("POST", {
        categoryId,
        name: "  Pizza Margherita  ",
        price: 42.5,
    }));

    assert.equal(response.status, 201);
    assert.deepEqual(received, {
        categoryId,
        name: "Pizza Margherita",
        description: null,
        price: 42.5,
        image: null,
    });
    assert.deepEqual(response.body, {
        id: productId,
        categoryId,
        name: "Pizza Margherita",
        description: null,
        price: 42.5,
        image: null,
        available: true,
        active: true,
    });
});

test("rejeita categoria, nome, preço e estados inválidos", async () => {
    let repositoryCalls = 0;
    stubMethod(ProductRepository, "create", async (product) => {
        repositoryCalls += 1;
        return product;
    });

    const invalidPayloads = [
        { categoryId: "invalid", name: "Pizza", price: 1 },
        { categoryId, name: " ", price: 1 },
        { categoryId, name: "Pizza", price: -1 },
        { categoryId, name: "Pizza", price: 1, available: "yes" },
        { categoryId, name: "Pizza", price: 1, active: 1 },
    ];

    for (const payload of invalidPayloads) {
        const response = await request("/products", jsonRequest("POST", payload));
        assert.equal(response.status, 400);
    }

    assert.equal(repositoryCalls, 0);
});

test("aceita preço zero e retorna erro para palavra-chave vazia", async () => {
    stubMethod(ProductRepository, "create", async (product) => ({ id: productId, ...product }));
    stubMethod(ProductRepository, "searchByKeyword", async () => []);

    const created = await request("/products", jsonRequest("POST", {
        categoryId,
        name: "Água",
        price: 0,
    }));
    assert.equal(created.status, 201);

    const emptySearch = await request("/products/search?keyword=%20");
    assert.equal(emptySearch.status, 400);

    const search = await request("/products/search?keyword=pizza");
    assert.equal(search.status, 200);
});

test("lista, consulta, atualiza e remove produto", async () => {
    const product = {
        id: productId,
        categoryId,
        name: "Pizza",
        description: null,
        price: 40,
        image: null,
        available: true,
        active: true,
    };
    let updatedId = "";
    let updatedInput: unknown;
    let removedId = "";
    stubMethod(ProductRepository, "findAll", async () => [product]);
    stubMethod(ProductRepository, "findById", async () => product);
    stubMethod(ProductRepository, "update", async (id, input) => {
        updatedId = id;
        updatedInput = input;
        return { id, ...input };
    });
    stubMethod(ProductRepository, "remove", async (id) => {
        removedId = id;
        return { id };
    });

    assert.equal((await request("/products")).status, 200);
    assert.equal((await request(`/products/${productId}`)).status, 200);
    assert.equal((await request("/products/invalid-id")).status, 400);

    const updated = await request(`/products/${productId}`, jsonRequest("PUT", {
        categoryId,
        name: "  Pizza especial  ",
        price: 45,
        available: false,
        active: true,
    }));
    assert.equal(updated.status, 200);
    assert.equal(updatedId, productId);
    assert.deepEqual(updatedInput, {
        categoryId,
        name: "Pizza especial",
        description: null,
        price: 45,
        image: null,
        available: false,
        active: true,
    });

    const removed = await request(`/products/${productId}`, { method: "DELETE" });
    assert.equal(removed.status, 200);
    assert.equal(removedId, productId);
});

test("mapeia ausência de produto e conflitos de chave estrangeira", async () => {
    stubMethod(ProductRepository, "findById", async () => {
        throw new NotFoundError("Produto não encontrado.");
    });
    stubMethod(ProductRepository, "update", async () => {
        throw { code: "23503" };
    });
    stubMethod(ProductRepository, "remove", async () => {
        throw { code: "23503" };
    });

    const missing = await withoutControllerLogs(() => request(`/products/${productId}`));
    assert.equal(missing.status, 404);

    const invalidCategory = await withoutControllerLogs(() =>
        request(`/products/${productId}`, jsonRequest("PUT", {
            categoryId: "11111111-1111-4111-8111-111111111111",
            name: "Pizza",
            price: 40,
            available: true,
            active: true,
        })));
    assert.equal(invalidCategory.status, 400);

    const referenced = await withoutControllerLogs(() =>
        request(`/products/${productId}`, { method: "DELETE" }));
    assert.equal(referenced.status, 409);
});
