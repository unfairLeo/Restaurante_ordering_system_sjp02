const categoryFilters = document.getElementById("categoryFilters");
const productsGrid = document.getElementById("productsGrid");
const menuStatus = document.getElementById("menuStatus");
const productSearch = document.getElementById("productSearch");
const orderDialog = document.getElementById("orderDialog");
const orderForm = document.getElementById("orderForm");
const selectedProductLabel = document.getElementById("selectedProduct");
const orderFeedback = document.getElementById("orderFeedback");
const submitOrder = document.getElementById("submitOrder");

let categories = [];
let products = [];
let selectedCategoryId = "all";
let selectedProduct = null;

const currency = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
});

const imageCredits = [
    {
        marker: "Grilled_chicken_with_rice_and_vegetables.jpg",
        artist: "HaJunkiyada",
        source: "https://commons.wikimedia.org/wiki/File:Liat_Portal_for_Foodie_Disorder_-_Grilled_chicken_with_rice_and_vegetables.jpg",
        license: "CC BY-SA 4.0",
        licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    },
    {
        marker: "COOKED_RICE_BEEF_STEW_BEANS_AND_VEGETABLES.jpg",
        artist: "Hussein.gd",
        source: "https://commons.wikimedia.org/wiki/File:COOKED_RICE_BEEF_STEW_BEANS_AND_VEGETABLES.jpg",
        license: "CC BY-SA 4.0",
        licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    },
    {
        marker: "Steak_and_onions.jpg",
        artist: "E4024",
        source: "https://commons.wikimedia.org/wiki/File:Steak_and_onions.jpg",
        license: "CC BY-SA 4.0",
        licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    },
    {
        marker: "Homemade_chicken_thighs_with_vegetables_and_rice.jpg",
        artist: "HaJunkiyada",
        source: "https://commons.wikimedia.org/wiki/File:Liat_Portal_for_Foodie_Disorder_-_Homemade_chicken_thighs_with_vegetables_and_rice.jpg",
        license: "CC BY-SA 4.0",
        licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    },
    {
        marker: "Sen_Asfor_Style_Rice_with_Vegetables_and_Avocado.jpg",
        artist: "HaJunkiyada",
        source: "https://commons.wikimedia.org/wiki/File:Liat_Portal_for_Foodie_Disorder_-_Sen_Asfor_Style_Rice_with_Vegetables_and_Avocado.jpg",
        license: "CC BY-SA 4.0",
        licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    },
    {
        marker: "Orange_Juice_%2813638538444%29.jpg",
        artist: "Yuri Samoilov",
        source: "https://commons.wikimedia.org/wiki/File:Orange_Juice_(13638538444).jpg",
        license: "CC BY 2.0",
        licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
    },
];

function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
}

function normalizeText(value) {
    return String(value ?? "").trim().toLocaleLowerCase("pt-BR");
}

async function requestJson(path, options = {}) {
    const response = await fetch(path, {
        ...options,
        headers: {
            ...(options.body ? { "content-type": "application/json" } : {}),
            ...options.headers,
        },
    });

    let payload = null;
    try {
        payload = await response.json();
    } catch {
        payload = null;
    }

    if (!response.ok) {
        throw new Error(payload?.message || "Não foi possível concluir a solicitação.");
    }

    return payload;
}

function setMenuStatus(message, state = "info") {
    menuStatus.textContent = message;
    menuStatus.dataset.state = state;
}

function renderCategoryFilters() {
    categoryFilters.replaceChildren();

    const options = [
        { id: "all", name: "Todos" },
        ...categories.map((category) => ({ id: category.id, name: category.name })),
    ];

    for (const option of options) {
        const button = createElement("button", "category-filter", option.name);
        button.type = "button";
        button.setAttribute("aria-pressed", String(selectedCategoryId === option.id));
        button.addEventListener("click", () => {
            selectedCategoryId = option.id;
            renderCategoryFilters();
            renderProducts();
        });
        categoryFilters.append(button);
    }
}

function createProductCard(product) {
    const card = createElement("article", "product-card");
    const art = createElement("div", "product-art");

    if (product.image) {
        const image = createElement("img");
        image.src = product.image;
        image.alt = product.name;
        image.loading = "lazy";
        image.addEventListener("error", () => {
            image.remove();
            art.querySelector(".product-image-credit")?.remove();
            art.textContent = "🍱";
        }, { once: true });
        art.append(image);

        const creditInfo = imageCredits.find(({ marker }) => product.image.includes(marker));
        if (creditInfo) {
            const credit = createElement("span", "product-image-credit");
            const sourceLink = createElement("a", "", `Foto: ${creditInfo.artist}`);
            sourceLink.href = creditInfo.source;
            sourceLink.target = "_blank";
            sourceLink.rel = "noopener noreferrer";
            const licenseLink = createElement("a", "", creditInfo.license);
            licenseLink.href = creditInfo.licenseUrl;
            licenseLink.target = "_blank";
            licenseLink.rel = "noopener noreferrer";
            credit.append(sourceLink, document.createTextNode(" · "), licenseLink);
            art.append(credit);
        }
    } else {
        art.textContent = "🍱";
    }

    const content = createElement("div", "product-content");
    content.append(createElement("h3", "", product.name));
    content.append(createElement(
        "p",
        "product-description",
        product.description || "Uma refeição preparada com cuidado.",
    ));

    const footer = createElement("div", "product-footer");
    footer.append(createElement("span", "product-price", currency.format(Number(product.price))));

    const orderButton = createElement("button", "btn btn-primary", "Pedir");
    orderButton.type = "button";
    orderButton.addEventListener("click", () => openOrderDialog(product));
    footer.append(orderButton);
    content.append(footer);
    card.append(art, content);
    return card;
}

function renderProducts() {
    productsGrid.replaceChildren();
    const query = normalizeText(productSearch.value);
    const visibleProducts = products.filter((product) => {
        const categoryMatches = selectedCategoryId === "all"
            || product.categoryId === selectedCategoryId;
        const searchMatches = !query
            || normalizeText(product.name).includes(query)
            || normalizeText(product.description).includes(query);
        return categoryMatches && searchMatches;
    });

    if (visibleProducts.length === 0) {
        productsGrid.append(createElement(
            "p",
            "empty-menu",
            "Nenhuma refeição encontrada. Tente outra categoria ou busca.",
        ));
        return;
    }

    for (const product of visibleProducts) {
        productsGrid.append(createProductCard(product));
    }
}

function openOrderDialog(product) {
    selectedProduct = product;
    selectedProductLabel.textContent = `${product.name} · ${currency.format(Number(product.price))}`;
    orderFeedback.hidden = true;
    orderFeedback.textContent = "";
    orderFeedback.removeAttribute("data-state");
    orderForm.hidden = false;
    orderForm.reset();
    orderDialog.showModal();
    document.getElementById("customerName").focus();
}

function showOrderFeedback(message, state) {
    orderFeedback.textContent = message;
    orderFeedback.dataset.state = state;
    orderFeedback.hidden = false;
}

async function loadMenu() {
    if (window.location.protocol === "file:") {
        renderCategoryFilters();
        setMenuStatus("Abra http://localhost:3000 para carregar o cardápio e fazer pedidos.", "error");
        return;
    }

    setMenuStatus("Carregando cardápio...");
    try {
        const [categoryData, productData] = await Promise.all([
            requestJson("/categories"),
            requestJson("/products"),
        ]);

        categories = (Array.isArray(categoryData) ? categoryData : [])
            .filter((category) => category.active !== false)
            .sort((a, b) => a.display_order - b.display_order);
        const activeCategoryIds = new Set(categories.map((category) => category.id));
        products = (Array.isArray(productData) ? productData : [])
            .filter((product) => product.active !== false
                && product.available !== false
                && activeCategoryIds.has(product.categoryId));

        renderCategoryFilters();
        renderProducts();
        setMenuStatus(products.length
            ? products.length === 1
                ? "1 refeição disponível"
                : `${products.length} refeições disponíveis`
            : "Ainda não há refeições disponíveis no cardápio.");
    } catch (error) {
        renderCategoryFilters();
        productsGrid.replaceChildren();
        setMenuStatus(
            `${error.message} Verifique se a API e o Supabase estão configurados.`,
            "error",
        );
    }
}

productSearch.addEventListener("input", renderProducts);

document.getElementById("closeOrderDialog").addEventListener("click", () => {
    orderDialog.close();
});

orderDialog.addEventListener("click", (event) => {
    if (event.target === orderDialog) orderDialog.close();
});

orderForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!selectedProduct) return;

    const formData = new FormData(orderForm);
    const customerName = String(formData.get("customer_name") ?? "").trim();
    const quantity = Number(formData.get("quantity"));
    if (!customerName || !Number.isInteger(quantity) || quantity < 1) return;

    submitOrder.disabled = true;
    submitOrder.textContent = "Enviando...";
    try {
        const order = await requestJson("/orders", {
            method: "POST",
            body: JSON.stringify({
                customer_name: customerName,
                product_id: selectedProduct.id,
                quantity,
            }),
        });
        const orderNumber = order?.id ? ` Código do pedido: ${order.id}.` : "";
        showOrderFeedback(`Pedido registrado com sucesso!${orderNumber}`, "success");
        orderForm.hidden = true;
    } catch (error) {
        showOrderFeedback(error.message, "error");
    } finally {
        submitOrder.disabled = false;
        submitOrder.textContent = "Confirmar pedido";
    }
});

orderDialog.addEventListener("close", () => {
    orderForm.reset();
    orderForm.hidden = false;
    selectedProduct = null;
});

loadMenu();
