import assert from "node:assert/strict";
import { after, afterEach, before, test } from "node:test";

process.env.SUPABASE_URL ??= "http://127.0.0.1:54321";
process.env.SUPABASE_SECRET_KEY ??= "test-key";

const [
    { default: app },
    { default: OrderRepository },
    { NotFoundError },
] = await Promise.all([
    import("../app.js"),
    import("../repositories/orderRepositories.js"),
    import("../error/notFoundError.js"),
]);

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

const productId = "c9bf9e57-1685-4c89-bafb-ff5af830be8a";
const orderId = "0e7c18ad-55fd-4b44-ae77-2aa56c7d8a02";
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

test("cria pedido válido, normaliza campos e aplica status padrão", async () => {
    let received: unknown;
    stubMethod(OrderRepository, "create", async (order) => {
        received = order;
        return { id: orderId, ...order, status: order.status ?? "pending" };
    });

    const response = await request("/orders", jsonRequest("POST", {
        customer_name: "  Leonardo  ",
        product_id: productId,
        quantity: 2,
    }));

    assert.equal(response.status, 201);
    assert.deepEqual(received, {
        customer_name: "Leonardo",
        product_id: productId,
        quantity: 2,
        status: "pending",
    });
    assert.deepEqual(response.body, {
        id: orderId,
        customer_name: "Leonardo",
        product_id: productId,
        quantity: 2,
        status: "pending",
    });
});

test("rejeita cliente, produto, quantidade e status inválidos", async () => {
    let repositoryCalls = 0;
    stubMethod(OrderRepository, "create", async (order) => {
        repositoryCalls += 1;
        return order;
    });

    const invalidPayloads = [
        { customer_name: " ", product_id: productId, quantity: 1 },
        { customer_name: "Leonardo", product_id: "invalid", quantity: 1 },
        { customer_name: "Leonardo", product_id: productId, quantity: 0 },
        { customer_name: "Leonardo", product_id: productId, quantity: 1.5 },
        { customer_name: "Leonardo", product_id: productId, quantity: 1, status: "cancelled" },
    ];

    for (const payload of invalidPayloads) {
        const response = await request("/orders", jsonRequest("POST", payload));
        assert.equal(response.status, 400);
    }

    assert.equal(repositoryCalls, 0);
});

test("lista, pesquisa, consulta, atualiza e remove pedidos", async () => {
    const order = {
        id: orderId,
        customer_name: "Leonardo",
        product_id: productId,
        quantity: 2,
        status: "pending",
    };
    let updatedId = "";
    let updatedInput: unknown;
    let removedId = "";

    stubMethod(OrderRepository, "findAll", async () => [order]);
    stubMethod(OrderRepository, "searchByKeyword", async () => [order]);
    stubMethod(OrderRepository, "findById", async () => order);
    stubMethod(OrderRepository, "update", async (id, input) => {
        updatedId = id;
        updatedInput = input;
        return { id, ...input };
    });
    stubMethod(OrderRepository, "remove", async (id) => {
        removedId = id;
        return { id };
    });

    assert.equal((await request("/orders")).status, 200);
    assert.equal((await request("/orders/search?keyword=Leo")).status, 200);
    assert.equal((await request(`/orders/${orderId}`)).status, 200);
    assert.equal((await request("/orders/invalid-id")).status, 400);
    assert.equal((await request("/orders/search?keyword=%20")).status, 400);

    const updated = await request(`/orders/${orderId}`, jsonRequest("PUT", {
        customer_name: "  Maria  ",
        product_id: productId,
        quantity: 3,
        status: "preparing",
    }));
    assert.equal(updated.status, 200);
    assert.equal(updatedId, orderId);
    assert.deepEqual(updatedInput, {
        customer_name: "Maria",
        product_id: productId,
        quantity: 3,
        status: "preparing",
    });

    const removed = await request(`/orders/${orderId}`, { method: "DELETE" });
    assert.equal(removed.status, 200);
    assert.equal(removedId, orderId);
});

test("mapeia ausência e produto inexistente", async () => {
    stubMethod(OrderRepository, "findById", async () => {
        throw new NotFoundError("Pedido não encontrado.");
    });
    stubMethod(OrderRepository, "update", async () => {
        throw { code: "23503" };
    });
    stubMethod(OrderRepository, "remove", async () => {
        throw new NotFoundError("Pedido não encontrado.");
    });

    const missing = await withoutControllerLogs(() => request(`/orders/${orderId}`));
    assert.equal(missing.status, 404);
    assert.deepEqual(missing.body, { message: "Pedido não encontrado." });

    const invalidProduct = await withoutControllerLogs(() =>
        request(`/orders/${orderId}`, jsonRequest("PUT", {
            customer_name: "Leonardo",
            product_id: "11111111-1111-4111-8111-111111111111",
            quantity: 1,
            status: "pending",
        })));
    assert.equal(invalidProduct.status, 400);
    assert.deepEqual(invalidProduct.body, { message: "O produto informado não existe." });

    const removedMissing = await withoutControllerLogs(() =>
        request(`/orders/${orderId}`, { method: "DELETE" }));
    assert.equal(removedMissing.status, 404);
});
