import express from "express";
import type { ErrorRequestHandler } from "express";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";

const app = express();
app.use(express.json());

// =====================
// Root
// =====================
app.get("/", (req, res) => {
    res.status(200).json({
        message: "Restaurant Ordering System - API",
        version: "1.0.0",
    });
});

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