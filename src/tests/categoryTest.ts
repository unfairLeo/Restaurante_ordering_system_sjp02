import assert from "node:assert/strict";
import { after, afterEach, before, test } from "node:test";
import type { Category } from "../model/category.js";

process.env.SUPABASE_URL ??= "http://127.0.0.1:54321";
process.env.SUPABASE_SECRET_KEY ??= "test-key";

const [
    { default: app },
    { default: CategoryRepository },
    { NotFoundError },
] = await Promise.all([
    import("../app.js"),
    import("../repositories/categoryRepository.js"),
    import("../error/notFoundError.js"),
]);

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

const categoryId = "bdf4183d-79a0-4f6f-8ead-03400eb6ed60";
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

test("cria categoria válida, normaliza campos e aplica o padrão ativo", async () => {
    let received: unknown;
    stubMethod(CategoryRepository, "create", async (category) => {
        received = category;
        return { id: categoryId, ...category, active: category.active ?? true };
    });

    const response = await request("/categories", jsonRequest("POST", {
        name: "  Pizzas  ",
        display_order: 1,
        description: "Categoria de pizzas",
        icon: "pizza",
    }));

    assert.equal(response.status, 201);
    assert.deepEqual(received, {
        name: "Pizzas",
        display_order: 1,
        description: "Categoria de pizzas",
        icon: "pizza",
    });
    assert.deepEqual(response.body, {
        id: categoryId,
        name: "Pizzas",
        display_order: 1,
        description: "Categoria de pizzas",
        icon: "pizza",
        active: true,
    });
});

test("rejeita nome ausente, vazio ou composto apenas por espaços", async () => {
    let repositoryCalls = 0;
    stubMethod(CategoryRepository, "create", async (category) => {
        repositoryCalls += 1;
        return category;
    });

    for (const body of [
        { display_order: 1 },
        { name: "", display_order: 1 },
        { name: "     ", display_order: 1 },
    ]) {
        const response = await request("/categories", jsonRequest("POST", body));
        assert.equal(response.status, 400);
        assert.deepEqual(response.body, { message: "name é obrigatório." });
    }

    assert.equal(repositoryCalls, 0);
});

test("rejeita ordem negativa ou decimal e aceita zero", async () => {
    let repositoryCalls = 0;
    stubMethod(CategoryRepository, "create", async (category) => {
        repositoryCalls += 1;
        return category;
    });

    for (const display_order of [-1, 1.5]) {
        const response = await request("/categories", jsonRequest("POST", {
            name: "Pizzas",
            display_order,
        }));
        assert.equal(response.status, 400);
        assert.deepEqual(response.body, {
            message: "display_order deve ser um número inteiro maior ou igual a zero.",
        });
    }

    const zeroOrder = await request("/categories", jsonRequest("POST", {
        name: "Pizzas",
        display_order: 0,
    }));
    assert.equal(zeroOrder.status, 201);
    assert.equal(repositoryCalls, 1);
});

test("atualiza nome, ordem, descrição, ícone e estado ativo", async () => {
    let stored: Category = {
        id: categoryId,
        name: "Pizzas",
        display_order: 1,
        description: "Categoria de pizzas",
        icon: "pizza",
        active: true,
    };
    stubMethod(CategoryRepository, "update", async (id, category) => {
        stored = { id, ...category };
        return stored;
    });

    const response = await request(`/categories/${categoryId}`, jsonRequest("PUT", {
        name: "  Bebidas  ",
        display_order: 5,
        description: "Bebidas geladas",
        icon: "drink",
        active: false,
    }));

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, {
        id: categoryId,
        name: "Bebidas",
        display_order: 5,
        description: "Bebidas geladas",
        icon: "drink",
        active: false,
    });
    assert.equal(stored.active, false);

    const reactivated = await request(`/categories/${categoryId}`, jsonRequest("PUT", {
        name: "Bebidas",
        display_order: 5,
        description: "Bebidas geladas",
        icon: "drink",
        active: true,
    }));
    assert.equal(reactivated.status, 200);
    assert.equal(stored.active, true);
});

test("não altera a categoria quando os dados de atualização são inválidos", async () => {
    let repositoryCalls = 0;
    stubMethod(CategoryRepository, "update", async (_id, category) => {
        repositoryCalls += 1;
        return category;
    });

    const response = await request(`/categories/${categoryId}`, jsonRequest("PUT", {
        name: " ",
        display_order: 1,
        active: true,
    }));

    assert.equal(response.status, 400);
    assert.equal(repositoryCalls, 0);
});

test("consulta por ID e retorna 404 quando a categoria não existe", async () => {
    stubMethod(CategoryRepository, "findById", async () => {
        throw new NotFoundError("Categoria não encontrada.");
    });

    const response = await withoutControllerLogs(() =>
        request(`/categories/${categoryId}`));
    assert.equal(response.status, 404);
    assert.deepEqual(response.body, { message: "Categoria não encontrada." });
});

test("rejeita ID inválido e conflito ao excluir categoria relacionada", async () => {
    stubMethod(CategoryRepository, "remove", async () => {
        throw { code: "23503" };
    });

    const invalidId = await request("/categories/invalid-id", { method: "DELETE" });
    assert.equal(invalidId.status, 400);

    const conflict = await withoutControllerLogs(() =>
        request(`/categories/${categoryId}`, { method: "DELETE" }));
    assert.equal(conflict.status, 409);
});