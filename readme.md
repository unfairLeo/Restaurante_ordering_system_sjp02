# Restaurant Ordering System – API REST

API REST para um sistema de **autoatendimento de restaurante**, desenvolvida com Node.js, TypeScript, Express e Supabase/PostgreSQL.

## 1. Descrição do projeto

**Problema:** em restaurantes com autoatendimento, o cardápio precisa ser organizado e mantido de forma centralizada, para que totens, aplicativos ou painéis administrativos consultem sempre as mesmas informações. Além disso, os pedidos feitos pelos clientes precisam ser registrados e acompanhados.

**Contexto:** projeto desenvolvido na disciplina de Desenvolvimento Back-End (UniSENAI), evoluído ao longo das aulas e concluído na APS.

**Objetivo da API:** gerenciar o cardápio do restaurante e os pedidos, permitindo cadastrar, consultar, atualizar, excluir e pesquisar **categorias**, **produtos** e **pedidos**, com os dados persistidos no Supabase/PostgreSQL.

## 2. Identificação do estudante

**Leonardo Ravache**

## 3. Tecnologias utilizadas

- Node.js
- TypeScript
- Express
- Supabase 
- PostgreSQL
- Git 

## 4. Entidades e relacionamentos

### Category (categoria)

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID | Identificador único (gerado pelo banco) |
| `name` | texto | Nome da categoria |
| `description` | texto | Descrição da categoria |
| `icon` | texto | Ícone da categoria |
| `display_order` | inteiro | Ordem de exibição no cardápio |
| `active` | booleano | Indica se a categoria está ativa |

### Product (produto)

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID | Identificador único (gerado pelo banco) |
| `categoryId` | UUID (FK) | Categoria à qual o produto pertence |
| `name` | texto | Nome do produto |
| `description` | texto | Descrição do produto |
| `price` | numérico | Preço do produto |
| `image` | texto | URL/caminho da imagem |
| `available` | booleano | Indica se o produto está disponível no momento |
| `active` | booleano | Indica se o produto está ativo no cardápio |

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
├── model/           # Representação das entidades (tipos) e consultas
│   ├── category.ts
│   ├── product.ts
│   └── order.ts
├── repositories/    # Acesso e persistência dos dados no Supabase
│   ├── categoryRepository.ts
│   └── orderRepository.ts
├── routes/          # Definição dos endpoints
│   ├── categoryRoutes.ts
│   ├── productRoutes.ts
│   └── orderRoutes.ts
├── app.ts           # Configuração do Express e registro das rotas
└── server.ts        # Inicialização do servidor
database/
└── schema.sql       # Script de criação das tabelas
```

| Camada | Responsabilidade |
|---|---|
| **Model** | Descreve a estrutura de cada entidade |
| **Repository** | Executa as consultas no Supabase/PostgreSQL |
| **Controller** | Valida os dados, trata a requisição, chama o model/repository e define o código HTTP |
| **Routes** | Associa método HTTP + caminho ao método do controller |
| **Config** | Conexão com o Supabase |

## 6. Configuração e execução

**1. Clonar o repositório**

```bash
git clone https://github.com/unfairLeo/Restaurante_ordering_system_sjp02.git
cd Restaurante_ordering_system_sjp02
```

**2. Instalar as dependências**

```bash
npm install
```

**3. Configurar as variáveis de ambiente**

Copie o arquivo de exemplo e preencha com as credenciais do seu projeto Supabase:

```bash
cp .env.example .env
```

**4. Criar o banco de dados**

Execute o script da seção [8. Banco de dados](#8-banco-de-dados) no *SQL Editor* do Supabase.

**5. Iniciar a aplicação**

```bash
npm run dev
```

A API ficará disponível em `http://localhost:3000`.

Outros scripts:

| Comando | Descrição |
|---|---|
| `npm run dev` | Executa em modo desenvolvimento (recarrega ao salvar) |
| `npm run build` | Compila o TypeScript para a pasta `dist/` |
| `npm start` | Executa a versão compilada (`dist/server.js`) |

## 7. Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `SUPABASE_URL` | URL do projeto no Supabase |
| `SUPABASE_SECRET_KEY` | Chave secreta de acesso ao Supabase |

Exemplo (`.env.example`):

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SECRET_KEY=sua_chave_secreta
```

> O arquivo `.env` contém credenciais reais e está no `.gitignore`. **Nunca** envie esse arquivo ao repositório.

## 8. Banco de dados

Tabelas utilizadas: `categories`, `products` e `orders`. Script para reproduzir a estrutura no Supabase/PostgreSQL (também disponível em `database/schema.sql`):

```sql
create table categories (
    id            uuid primary key default gen_random_uuid(),
    name          text not null,
    description   text,
    icon          text,
    display_order integer not null default 0,
    active        boolean not null default true
);

create table products (
    id            uuid primary key default gen_random_uuid(),
    "categoryId"  uuid not null references categories(id) on delete restrict,
    name          text not null,
    description   text,
    price         numeric(10, 2) not null check (price >= 0),
    image         text,
    available     boolean not null default true,
    active        boolean not null default true
);

create table orders (
    id            uuid primary key default gen_random_uuid(),
    customer_name text not null,
    product_id    uuid not null references products(id) on delete restrict,
    quantity      integer not null check (quantity > 0),
    status        text not null default 'pending'
                  check (status in ('pending', 'preparing', 'ready', 'delivered')),
    created_at    timestamptz not null default now()
);
```

- Os identificadores são **UUID**, gerados automaticamente pelo banco.
- `products."categoryId"` é **chave estrangeira** para `categories.id`.
- `orders.product_id` é **chave estrangeira** para `products.id`.
- Com `on delete restrict`, não é possível excluir uma categoria que ainda possua produtos, nem um produto que ainda possua pedidos.

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
| POST | `/categories` | Cadastra uma categoria | JSON: `name`, `description`, `icon`, `display_order`, `active` |
| PUT | `/categories/:id` | Atualiza uma categoria | `id` na URL + JSON com os campos |
| DELETE | `/categories/:id` | Remove uma categoria | `id` na URL |

### Produtos

| Método | Endpoint | Descrição | Dados da requisição |
|---|---|---|---|
| GET | `/products` | Lista todos os produtos | – |
| GET | `/products/:id` | Consulta um produto pelo ID | `id` na URL |
| GET | `/products/search?keyword=` | Pesquisa por palavra-chave | `keyword` na query string |
| POST | `/products` | Cadastra um produto | JSON: `categoryId`, `name`, `description`, `price`, `image`, `available`, `active` |
| PUT | `/products/:id` | Atualiza um produto | `id` na URL + JSON com os campos |
| DELETE | `/products/:id` | Remove um produto | `id` na URL |

### Pedidos

| Método | Endpoint | Descrição | Dados da requisição |
|---|---|---|---|
| GET | `/orders` | Lista todos os pedidos | – |
| GET | `/orders/:id` | Consulta um pedido pelo ID | `id` na URL |
| GET | `/orders/search?keyword=` | Pesquisa pedidos pelo nome do cliente | `keyword` na query string |
| POST | `/orders` | Cadastra um pedido | JSON: `customer_name`, `product_id`, `quantity`, `status` (opcional, padrão `pending`) |
| PUT | `/orders/:id` | Atualiza um pedido | `id` na URL + JSON com os campos |
| DELETE | `/orders/:id` | Remove um pedido | `id` na URL |

### Códigos de resposta HTTP

| Código | Quando ocorre |
|---|---|
| `200 OK` | Consulta, atualização ou exclusão realizada |
| `201 Created` | Registro criado com sucesso |
| `400 Bad Request` | Palavra-chave de pesquisa não informada ou dados inválidos no pedido (ex.: `quantity` menor ou igual a zero, `status` inexistente) |
| `404 Not Found` | Registro não encontrado |
| `500 Internal Server Error` | Erro ao acessar o banco de dados |

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

## Testes da API

Os endpoints foram testados com uma ferramenta de requisições HTTP (Postman / Insomnia / Thunder Client), verificando as operações GET, GET por ID, POST, PUT, DELETE e a pesquisa por palavra-chave, e conferindo a persistência dos dados no Supabase.