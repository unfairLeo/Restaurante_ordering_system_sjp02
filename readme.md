# Restaurant Ordering System – API REST

API REST para um sistema de **autoatendimento de restaurante**, desenvolvida com Node.js, TypeScript, Express e Supabase/PostgreSQL.

## 1. Descrição do projeto

**Problema:** em restaurantes com autoatendimento, o cardápio precisa ser organizado e mantido de forma centralizada, para que totens, aplicativos ou painéis administrativos consultem sempre as mesmas informações. Além disso, os pedidos feitos pelos clientes precisam ser registrados e acompanhados.

**Contexto:** projeto desenvolvido na disciplina de Desenvolvimento Back-End (UniSENAI), evoluído ao longo das aulas e concluído na APS.

**Objetivo da API:** gerenciar o cardápio do restaurante e os pedidos, permitindo cadastrar, consultar, atualizar, excluir e pesquisar **categorias**, **produtos** e **pedidos**, com os dados persistidos no Supabase/PostgreSQL.

## 2. Identificação do estudante

**Leonardo Ravache**

## 3. Tecnologias e requisitos

| Tecnologia | Uso |
|---|---|
| Node.js 22 ou superior | Executa a API e o Supabase JavaScript SDK |
| npm | Instala dependências e executa os scripts do projeto |
| TypeScript 7 | Tipos e compilação para JavaScript |
| Express 5 | Servidor HTTP e roteamento |
| `@supabase/supabase-js` 2 | Acesso ao banco Supabase pela API |
| PostgreSQL (Supabase) | Persistência relacional dos dados |
| `dotenv` | Carrega variáveis do arquivo `.env` |
| `tsx` | Executa TypeScript em desenvolvimento e nos testes |
| `node:test` | Testes automatizados HTTP, incluído no Node.js |
| Postman | Collection manual disponível na raiz do projeto |

O Node.js 22+ é necessário porque a versão do Supabase SDK definida no lockfile exige essa versão mínima. O projeto foi compilado e testado localmente com Node.js 24.19.0.

## 4. Entidades e relacionamentos

### Category (categoria)

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID | Identificador único (gerado pelo banco) |
| `name` | texto | Nome da categoria |
| `description` | texto anulável | Descrição da categoria |
| `icon` | texto anulável | Ícone da categoria |
| `display_order` | inteiro não negativo | Ordem de exibição no cardápio |
| `active` | booleano (padrão `true`) | Indica se a categoria está ativa |

### Product (produto)

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID | Identificador único (gerado pelo banco) |
| `categoryId` | UUID (FK) | Categoria à qual o produto pertence |
| `name` | texto | Nome do produto |
| `description` | texto anulável | Descrição do produto |
| `price` | numérico (até duas casas decimais) | Preço do produto |
| `image` | texto anulável | URL/caminho da imagem |
| `available` | booleano (padrão `true`) | Indica se o produto está disponível no momento |
| `active` | booleano (padrão `true`) | Indica se o produto está ativo no cardápio |

### Order (pedido)

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID | Identificador único (gerado pelo banco) |
| `customer_name` | texto | Nome do cliente que fez o pedido |
| `product_id` | UUID (FK) | Produto pedido |
| `quantity` | inteiro | Quantidade pedida (maior que zero) |
| `status` | texto | Situação do pedido: `pending`, `preparing`, `ready` ou `delivered` |
| `created_at` | timestamp | Data e hora de criação (gerado pelo banco) |

### Relacionamentos

```text
categories (1) ────────< (N) products
   id        ←── FK ──   categoryId

products (1) ──────────< (N) orders
   id        ←── FK ──   product_id
```

Uma categoria possui vários produtos, e cada produto pertence a uma única categoria.
Um produto pode estar em vários pedidos, e cada pedido refere-se a um único produto.

## 5. Estrutura do projeto

```text
src/
├── config/          # Configuração do cliente Supabase
│   └── supabase.ts
├── controller/      # Recebe requisições e devolve respostas HTTP
│   ├── CategoryController.ts
│   ├── ProductController.ts
│   └── OrderController.ts
├── model/           # Tipos e estruturas das entidades
│   ├── category.ts
│   ├── product.ts
│   └── order.ts
├── repositories/    # Acesso e persistência dos dados no Supabase
│   ├── categoryRepository.ts
│   ├── productRepositories.ts
│   └── orderRepositories.ts
├── error/           # Erros conhecidos da aplicação
│   ├── notFoundError.ts
│   └── validationError.ts
├── routes/          # Definição dos endpoints
│   ├── categoryRoutes.ts
│   ├── productRoutes.ts
│   └── orderRoutes.ts
├── app.ts           # Configuração do Express e registro das rotas
├── server.ts        # Inicialização do servidor
└── tests/
    ├── categoryTest.ts # Testes HTTP de categorias
    ├── productTest.ts   # Testes HTTP de produtos
    └── orderTest.ts     # Testes HTTP de pedidos
database/
└── schema.sql       # Script de criação das tabelas
restaurant-ordering-system-API.postman_collection.json
                    # Collection para testes manuais
```

`src/server_copia.ts` é uma cópia antiga e não é usada pelos scripts; o ponto de entrada ativo é `src/server.ts`.

| Camada | Responsabilidade |
|---|---|
| **Model** | Descreve os tipos e estruturas de cada entidade |
| **Repository** | Executa as consultas no Supabase/PostgreSQL e converte erros de ausência em `NotFoundError` |
| **Controller** | Valida os dados inline, chama o repositório e define a resposta HTTP |
| **Routes** | Associa método HTTP + caminho ao método do controller |
| **Config** | Conexão com o Supabase |
| **Error** | `NotFoundError` é usado; `ValidationError` está no projeto, mas as validações atuais são feitas inline nos controllers |

## 6. Configuração e execução

### Pré-requisitos

- Node.js 22 ou superior e npm.
- Um projeto Supabase com acesso ao SQL Editor.
- Git para clonar o repositório.

Confira as versões instaladas:

```bash
node --version
npm --version
```

### Instalação

```bash
git clone https://github.com/unfairLeo/Restaurante_ordering_system_sjp02.git
cd Restaurante_ordering_system_sjp02
npm ci
```

`npm ci` instala as versões registradas em `package-lock.json`. Use `npm install` apenas quando precisar alterar dependências.

### Configurar o Supabase

Copie `.env.example` para `.env` na raiz do projeto e preencha os valores com as credenciais do Supabase.

PowerShell:

```powershell
Copy-Item .env.example .env
```

macOS/Linux:

```bash
cp .env.example .env
```

No SQL Editor do Supabase, execute [`database/schema.sql`](./database/schema.sql) uma vez em um banco novo. O script cria as três tabelas; ele não insere dados de exemplo.

### Executar em desenvolvimento

```bash
npm run dev
```

A API ficará disponível em `http://localhost:3000`. O servidor usa a porta `3000`, definida em `src/server.ts`.

### Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm ci` | Instala as dependências travadas no lockfile |
| `npm run dev` | Executa em desenvolvimento e reinicia ao salvar |
| `npm test` | Executa os testes HTTP automatizados das três entidades |
| `npm run build` | Compila os arquivos de `src/` para `dist/` |
| `npm start` | Executa `dist/server.js`; rode `npm run build` antes |

`npm test` não precisa de credenciais reais nem altera o banco: os testes simulam os repositórios de categorias, produtos e pedidos. Para validar persistência, configure o Supabase e execute a collection do Postman.

## 7. Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `SUPABASE_URL` | URL do projeto no Supabase |
| `SUPABASE_SECRET_KEY` | Chave secreta do Supabase para uso exclusivo no servidor |

Exemplo (`.env.example`):

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SECRET_KEY=sua-chave-secreta
```

O código também aceita `SUPABASE_SERVICE_ROLE_KEY` como alternativa à chave secreta e nomes antigos em minúsculas (`supabaseUrl` e `supabaseSecretKey`). Prefira os nomes em maiúsculas do exemplo.

> `.env` está no `.gitignore`. **Nunca** envie a chave secreta/service-role para o Git nem para uma aplicação frontend: ela concede acesso privilegiado ao banco. O cliente Supabase é inicializado ao importar a aplicação; sem as variáveis exigidas, o servidor não inicia.

## 8. Banco de dados

O schema SQL está em [`database/schema.sql`](./database/schema.sql). Execute-o pelo SQL Editor do Supabase em um banco novo.

- Os identificadores são **UUID**, gerados automaticamente pelo banco.
- `products."categoryId"` é **chave estrangeira** para `categories.id`.
- `orders.product_id` é **chave estrangeira** para `products.id`.
- Com `on delete restrict`, não é possível excluir uma categoria que ainda possua produtos, nem um produto que ainda possua pedidos.
- O nome `"categoryId"` é sensível a maiúsculas/minúsculas no PostgreSQL e precisa permanecer entre aspas no schema.
- O preço é armazenado como `numeric(10, 2)`; quantidades de pedidos devem ser inteiros maiores que zero.
- Não há carga inicial (seed): crie primeiro uma categoria, depois um produto ligado a ela e, por fim, um pedido ligado ao produto.

## 9. Documentação dos endpoints

### Raiz

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/` | Retorna o nome e a versão da API |

### Categorias

| Método | Endpoint | Descrição | Dados da requisição |
|---|---|---|---|
| GET | `/categories` | Lista todas as categorias | – |
| GET | `/categories/:id` | Consulta uma categoria pelo ID | `id` na URL |
| GET | `/categories/search?keyword=` | Pesquisa por palavra-chave (nome ou descrição) | `keyword` na query string |
| POST | `/categories` | Cadastra uma categoria | `name` e `display_order` obrigatórios; `description`, `icon` e `active` opcionais |
| PUT | `/categories/:id` | Atualiza uma categoria | `id` na URL + `name`, `display_order` e `active`; descrição/ícone opcionais |
| DELETE | `/categories/:id` | Remove uma categoria | `id` na URL |

### Produtos

| Método | Endpoint | Descrição | Dados da requisição |
|---|---|---|---|
| GET | `/products` | Lista todos os produtos | – |
| GET | `/products/:id` | Consulta um produto pelo ID | `id` na URL |
| GET | `/products/search?keyword=` | Pesquisa por palavra-chave | `keyword` na query string |
| POST | `/products` | Cadastra um produto | JSON: `categoryId`, `name`, `price`; `description` e `image` são opcionais, assim como `available` e `active` (padrão `true`) |
| PUT | `/products/:id` | Atualiza um produto | `id` na URL + `categoryId`, `name`, `price`, `available` e `active`; descrição/imagem opcionais |
| DELETE | `/products/:id` | Remove um produto | `id` na URL |

### Pedidos

| Método | Endpoint | Descrição | Dados da requisição |
|---|---|---|---|
| GET | `/orders` | Lista todos os pedidos | – |
| GET | `/orders/:id` | Consulta um pedido pelo ID | `id` na URL |
| GET | `/orders/search?keyword=` | Pesquisa pedidos pelo nome do cliente | `keyword` na query string |
| POST | `/orders` | Cadastra um pedido | JSON: `customer_name`, `product_id`, `quantity`, `status` (opcional, padrão `pending`) |
| PUT | `/orders/:id` | Atualiza um pedido | `id` na URL + `customer_name`, `product_id` e `quantity`; `status` opcional (padrão `pending`) |
| DELETE | `/orders/:id` | Remove um pedido | `id` na URL |

### Códigos de resposta HTTP

| Código | Quando ocorre |
|---|---|
| `200 OK` | Consulta, atualização ou exclusão realizada |
| `201 Created` | Registro criado com sucesso |
| `400 Bad Request` | JSON, palavra-chave, UUID ou dados inválidos; categoria/produto relacionado inexistente |
| `404 Not Found` | Rota ou registro solicitado não encontrado |
| `409 Conflict` | Exclusão impedida por registros relacionados |
| `500 Internal Server Error` | Erro inesperado da aplicação ou do banco de dados |

## 10. Exemplos de requisições

### Criar categoria – `POST /categories`

```json
{
  "name": "Pizzas",
  "description": "Pizzas tradicionais e especiais",
  "icon": "🍕",
  "display_order": 1,
  "active": true
}
```

### Atualizar categoria – `PUT /categories/:id`

```json
{
  "name": "Pizzas",
  "description": "Pizzas tradicionais, especiais e doces",
  "icon": "🍕",
  "display_order": 1,
  "active": true
}
```

### Criar produto – `POST /products`

```json
{
  "categoryId": "UUID-DA-CATEGORIA",
  "name": "Pizza Margherita",
  "description": "Molho de tomate, mussarela e manjericão",
  "price": 42.9,
  "image": "https://exemplo.com/margherita.jpg",
  "available": true,
  "active": true
}
```

### Atualizar produto – `PUT /products/:id`

```json
{
  "categoryId": "UUID-DA-CATEGORIA",
  "name": "Pizza Margherita",
  "description": "Molho de tomate, mussarela de búfala e manjericão",
  "price": 46.9,
  "image": "https://exemplo.com/margherita.jpg",
  "available": true,
  "active": true
}
```

### Criar pedido – `POST /orders`

```json
{
  "customer_name": "Ana",
  "product_id": "UUID-DO-PRODUTO",
  "quantity": 2
}
```

### Atualizar pedido – `PUT /orders/:id`

```json
{
  "customer_name": "Ana",
  "product_id": "UUID-DO-PRODUTO",
  "quantity": 2,
  "status": "preparing"
}
```

### Pesquisa por palavra-chave

```http
GET http://localhost:3000/categories/search?keyword=pizza
GET http://localhost:3000/products/search?keyword=margherita
GET http://localhost:3000/orders/search?keyword=ana
```

Substitua `UUID-DA-CATEGORIA` e `UUID-DO-PRODUTO` por UUIDs existentes no Supabase. Os exemplos de payload não criam automaticamente os registros relacionados.

## 11. Postman e validação

Importe [`restaurant-ordering-system-API.postman_collection.json`](./restaurant-ordering-system-API.postman_collection.json) no Postman. A collection usa `http://localhost:3000` como `baseUrl`; configure também `categoryId`, `productId` e `orderId` com UUIDs existentes antes de testar endpoints dependentes desses registros.

Execute os testes automatizados e a compilação:

```bash
npm test
npm run build
```

Os testes HTTP em `src/tests/` usam os repositórios simulados para validar as rotas, payloads, validações e respostas de categorias, produtos e pedidos sem escrever no banco. Eles não comprovam a conexão real com o Supabase. A validação de persistência requer credenciais válidas, schema aplicado e execução manual da collection.

## 12. Limitações conhecidas

- A API não implementa autenticação, autorização nem middleware CORS. Não a exponha publicamente sem controles adequados.
- A chave secreta do Supabase é carregada no servidor; proteja as rotas e mantenha essa chave fora do cliente.
- Um pedido representa um único produto e uma quantidade; não há carrinho nem múltiplos itens por pedido.
- Não há migrations, seed automático ou testes de integração contra uma instância real do Supabase.
