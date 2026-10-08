import express from "express";
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

export default app;