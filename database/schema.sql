create table categories (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    description text,
    icon text,
    display_order integer not null default 0,
    active boolean not null default true
);

create table products (
    id uuid primary key default gen_random_uuid(),
    "categoryId" uuid not null references categories(id) on delete restrict,
    name text not null,
    description text,
    price numeric(10, 2) not null check (price >= 0),
    image text,
    available boolean not null default true,
    active boolean not null default true
);

create table orders (
    id uuid primary key default gen_random_uuid(),
    customer_name text not null,
    product_id uuid not null references products(id) on delete restrict,
    quantity integer not null check (quantity > 0),
    status text not null default 'pending'
        check (status in ('pending', 'preparing', 'ready', 'delivered')),
    created_at timestamptz not null default now()
);
