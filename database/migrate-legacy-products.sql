    -- Aligns an existing products table with the column names expected by this API.
    -- Renaming preserves existing rows and the category foreign key.
    begin;

    do $$
    begin
        if exists (
            select 1
            from information_schema.columns
            where table_schema = 'public'
            and table_name = 'products'
            and column_name = 'category_id'
        ) and exists (
            select 1
            from information_schema.columns
            where table_schema = 'public'
            and table_name = 'products'
            and column_name = 'categoryId'
        ) then
            raise exception 'products has both category_id and categoryId; resolve the duplicate columns before migrating.';
        elsif exists (
            select 1
            from information_schema.columns
            where table_schema = 'public'
            and table_name = 'products'
            and column_name = 'category_id'
        ) then
            alter table public.products rename column category_id to "categoryId";
        elsif not exists (
            select 1
            from information_schema.columns
            where table_schema = 'public'
            and table_name = 'products'
            and column_name = 'categoryId'
        ) then
            raise exception 'products has neither category_id nor categoryId.';
        end if;

        if exists (
            select 1
            from information_schema.columns
            where table_schema = 'public'
            and table_name = 'products'
            and column_name = 'title'
        ) and exists (
            select 1
            from information_schema.columns
            where table_schema = 'public'
            and table_name = 'products'
            and column_name = 'name'
        ) then
            raise exception 'products has both title and name; resolve the duplicate columns before migrating.';
        elsif exists (
            select 1
            from information_schema.columns
            where table_schema = 'public'
            and table_name = 'products'
            and column_name = 'title'
        ) then
            alter table public.products rename column title to name;
        elsif not exists (
            select 1
            from information_schema.columns
            where table_schema = 'public'
            and table_name = 'products'
            and column_name = 'name'
        ) then
            raise exception 'products has neither title nor name.';
        end if;
    end
    $$;

    commit;
