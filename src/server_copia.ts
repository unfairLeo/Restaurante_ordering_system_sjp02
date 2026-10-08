import http from "node:http";

const port = 3000;

const routes = {
    "/": {
        message: "Restaurant Ordering System - API",
        version: "1.0.0",
    },
    "/categories": {
        message: "Lista de Categorias"
    },
    "/products": {
        message: "Lista de Produtos."
    }
}

const server = http.createServer((req, res) => {

    const response = routes[req.url as keyof typeof routes];

    if (!response) {
        res.writeHead(404, {
            "content-type": "application/json",
        });

        return res.end(
            JSON.stringify({
                message: "Route not found",
            })
        );
    }

    res.writeHead(200, {
        "content-type": "application/json",
    });

    res.end(JSON.stringify(response));
});

server.listen(port, () => {
    console.log(`Servidor executando em http://localhost:${port}`)
})