    -- Dados demonstrativos. Os nomes e preços são fictícios; revise antes de usar em produção.
    -- IDs fixos e ON CONFLICT tornam este script seguro para executar novamente.

    insert into categories (id, name, description, icon, display_order, active)
    values
        ('a1000000-0000-4000-8000-000000000001', 'Marmitas tradicionais', 'Pratos clássicos para o dia a dia.', null, 1, true),
        ('a1000000-0000-4000-8000-000000000002', 'Marmitas leves', 'Opções leves e equilibradas.', null, 2, true),
        ('a1000000-0000-4000-8000-000000000003', 'Bebidas', 'Bebidas para acompanhar sua refeição.', null, 3, true)
    on conflict (id) do nothing;

    insert into products (
        id,
        "categoryId",
        name,
        description,
        price,
        image,
        available,
        active
    )
    values
        (
            'b1000000-0000-4000-8000-000000000001',
            'a1000000-0000-4000-8000-000000000001',
            'Marmita de frango grelhado',
            'Frango grelhado, arroz, feijão e salada.',
            24.90,
            'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Liat_Portal_for_Foodie_Disorder_-_Grilled_chicken_with_rice_and_vegetables.jpg/960px-Liat_Portal_for_Foodie_Disorder_-_Grilled_chicken_with_rice_and_vegetables.jpg',
            true,
            true
        ),
        (
            'b1000000-0000-4000-8000-000000000002',
            'a1000000-0000-4000-8000-000000000001',
            'Marmita de carne de panela',
            'Carne de panela com arroz, feijão e legumes.',
            28.90,
            'https://images.pexels.com/photos/3981486/pexels-photo-3981486.jpeg?auto=compress&cs=tinysrgb&w=900',
            true,
            true
        ),
        (
            'b1000000-0000-4000-8000-000000000003',
            'a1000000-0000-4000-8000-000000000001',
            'Marmita de bife acebolado',
            'Bife acebolado servido com arroz e feijão.',
            27.90,
            'https://images.pexels.com/photos/36669799/pexels-photo-36669799.jpeg?auto=compress&cs=tinysrgb&w=900',
            true,
            true
        ),
        (
            'b1000000-0000-4000-8000-000000000004',
            'a1000000-0000-4000-8000-000000000002',
            'Frango leve com legumes',
            'Frango grelhado com legumes e arroz integral.',
            22.90,
            'https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Liat_Portal_for_Foodie_Disorder_-_Homemade_chicken_thighs_with_vegetables_and_rice.jpg/960px-Liat_Portal_for_Foodie_Disorder_-_Homemade_chicken_thighs_with_vegetables_and_rice.jpg',
            true,
            true
        ),
        (
            'b1000000-0000-4000-8000-000000000005',
            'a1000000-0000-4000-8000-000000000002',
            'Marmita vegetariana',
            'Legumes, arroz integral e feijão.',
            21.90,
            'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Liat_Portal_for_Foodie_Disorder_-_Sen_Asfor_Style_Rice_with_Vegetables_and_Avocado.jpg/960px-Liat_Portal_for_Foodie_Disorder_-_Sen_Asfor_Style_Rice_with_Vegetables_and_Avocado.jpg',
            true,
            true
        ),
        (
            'b1000000-0000-4000-8000-000000000006',
            'a1000000-0000-4000-8000-000000000003',
            'Suco natural de laranja',
            'Suco de laranja, copo de 300 ml.',
            8.00,
            'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Orange_Juice_%2813638538444%29.jpg/960px-Orange_Juice_%2813638538444%29.jpg',
            true,
            true
        )
    on conflict (id) do update
    set image = excluded.image;
