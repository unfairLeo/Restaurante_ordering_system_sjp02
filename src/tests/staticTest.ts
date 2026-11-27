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

test("serve o hero, o cardápio e seus arquivos estáticos", async () => {
    const page = await fetch(baseUrl);
    assert.equal(page.status, 200);
    assert.match(page.headers.get("content-type") ?? "", /text\/html/);

    const html = await page.text();
    assert.match(html, /id="scene"/);
    assert.match(html, /id="cardapio"/);
    assert.match(html, /id="orderForm"/);
    assert.match(html, /class="btn btn-outline skip-animation" href="#cardapio"/);
    assert.doesNotMatch(html, /id="dots"/);
    assert.match(html, /href="\.\/menu\.css"/);
    assert.match(html, /src="\.\/menu\.js"/);

    const [script, stylesheet] = await Promise.all([
        fetch(`${baseUrl}/menu.js`),
        fetch(`${baseUrl}/menu.css`),
    ]);
    assert.equal(script.status, 200);
    assert.equal(stylesheet.status, 200);
});
