import http from "node:http";

// PORTA DO SERVIDOR
const port = 3000;

// CRIA O SERVIDOR UTILIZANDO O METODO DE REQUISIÇÃO E RESPOSTA
const server = http.createServer((req, res) => {
  const responseData = {
    message: "API Restaurante",
    version: "1.0.0",
    xpto: "qualquer coisa",
  };

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(responseData));
});

server.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});