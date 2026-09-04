import express from "express";
import Category from "./model/category.js";
import Product from "./model/product.js";

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
// Categories
// =====================
app.get("/categories", async (req, res) => {
    try {
        const categories = await Category.findAll();

        res.status(200).json(categories)
    } catch (error) {
        console.log("Erro ao buscar categorias: ", error);

        res.status(500).json({
            message: "Erro ao buscar categorias."
        });
    }
});

app.get("/categories/:id", async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        res.status(200).json(category)
    } catch (error) {
        console.log("Erro ao buscar categoria: ", error);

        res.status(404).json({
            message: "Categoria não encontrada."
        });
    }
});
// =====================
// Products
// =====================
app.get("/products", async (req, res) => {
    try {
        const products = await Product.findAll();

        res.status(200).json(products)
    } catch (error) {
        console.log("Erro ao buscar produtos: ", error);

        res.status(500).json({
            message: "Erro ao buscar produtos."
        });
    }
});

app.get("/products/:id", async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        res.status(200).json(product)
    } catch (error) {
        console.log("Erro ao buscar produto: ", error);

        res.status(404).json({
            message: "Produto não encontrado."
        });
    }
});

export default app;