import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { config } from "dotenv";

const { error } = config({ path: ".env.test" });
if (error) {
    throw new Error(
        "Não foi possível carregar .env.test. Crie esse arquivo a partir de .env.test.example.",
        { cause: error },
    );
}

const supabaseTestUrl = process.env.SUPABASE_TEST_URL;
const supabaseTestSecretKey = process.env.SUPABASE_TEST_SECRET_KEY;

if (!supabaseTestUrl || !supabaseTestSecretKey) {
    throw new Error(
        "Defina SUPABASE_TEST_URL e SUPABASE_TEST_SECRET_KEY no arquivo .env.test.",
    );
}

process.env.SUPABASE_URL = supabaseTestUrl;
process.env.SUPABASE_SECRET_KEY = supabaseTestSecretKey;

const { default: app } = await import("../../app.js");

let server: ReturnType<typeof app.listen> | undefined;
let baseUrl: string;

before(async () => {
    server = app.listen(0, "127.0.0.1");
    await new Promise<void>((resolve, reject) => {
        server?.once("error", reject);
        server?.once("listening", resolve);
    });

    const address = server.address();
    if (!address || typeof address === "string") {
        throw new Error("Não foi possível iniciar o servidor de integração.");
    }

    baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
    if (!server) {
        return;
    }

    await new Promise<void>((resolve, reject) => {
        server?.close((closeError) => closeError ? reject(closeError) : resolve());
    });
});

for (const resource of ["categories", "products", "orders"]) {
    test(`GET /${resource} consulta o Supabase e retorna uma lista`, async () => {
        const response = await fetch(`${baseUrl}/${resource}`);
        const responseText = await response.clone().text();

        assert.equal(
            response.status,
            200,
            `GET /${resource} retornou ${response.status}: ${responseText}`,
        );
        assert.match(
            response.headers.get("content-type") ?? "",
            /application\/json/,
        );
        assert.ok(Array.isArray(await response.json()));
    });
}
