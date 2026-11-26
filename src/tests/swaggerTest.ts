import assert from "node:assert/strict";
import { after, before, test } from "node:test";

process.env.SUPABASE_URL ??= "http://127.0.0.1:54321";
process.env.SUPABASE_SECRET_KEY ??= "test-key";

const { default: app } = await import("../app.js");

let server: ReturnType<typeof app.listen>;
let baseUrl: string;

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

test("disponibiliza Swagger UI e a especificação OpenAPI", async () => {
    const page = await fetch(`${baseUrl}/api-docs/`);
    assert.equal(page.status, 200);
    assert.match(page.headers.get("content-type") ?? "", /text\/html/);
    assert.match(await page.text(), /swagger-ui/);

    const specification = await fetch(`${baseUrl}/api-docs/swagger-ui-init.js`);
    assert.equal(specification.status, 200);
    const body = await specification.text();
    assert.match(body, /\/categories/);
    assert.match(body, /\/products/);
    assert.match(body, /\/orders/);
});
