import express from "express";
import type { ErrorRequestHandler } from "express";
import { fileURLToPath } from "node:url";
import swaggerUi from "swagger-ui-express";
import { openApiSpec } from "./openapi.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";

const app = express();
const staticDirectory = fileURLToPath(new URL("../static/", import.meta.url));

app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

// =====================
// Categories(CATEGORIAS)
// =====================
app.use("/categories", categoryRoutes);

// =====================
// Products(PRODUTOS)
// =====================
app.use("/products", productRoutes);

// =====================
// Orders(PEDIDOS)
// =====================
app.use("/orders", orderRoutes);

app.use(express.static(staticDirectory));

app.use((_req, res) => {
    res.status(404).json({
        message: "Rota não encontrada.",
    });
});

const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
    if (res.headersSent) {
        next(error);
        return;
    }

    if (typeof error === "object"
        && error !== null
        && "type" in error
        && error.type === "entity.parse.failed") {
        res.status(400).json({
            message: "JSON inválido no corpo da requisição.",
        });
        return;
    }

    console.error("Erro não tratado na aplicação: ", error);
    res.status(500).json({
        message: "Erro interno no servidor.",
    });
};

app.use(errorHandler);

export default app;