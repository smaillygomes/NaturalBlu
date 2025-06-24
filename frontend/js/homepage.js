// Arquivo: frontend/js/homepage.js (Com a formatação de categoria)

document.addEventListener('DOMContentLoaded', () => {

    // --- Referências aos Elementos do DOM (continua igual) ---
    const cartIcon = document.getElementById('cart-icon');
    const cartDropdown = document.getElementById('cart-dropdown');
    const cartItemsList = document.getElementById('cart-items-list');
    const cartCount = document.getElementById('cart-count');
    const cartTotalPrice = document.getElementById('cart-total-price');
    const productsGrid = document.getElementById('products-grid-container');
    const categoryLinks = document.querySelectorAll('.category-filter-link');
    const allProductsLink = document.getElementById('show-all-products');

    // ==========================================================
    // ===== 1. NOVA FUNÇÃO PARA FORMATAR O TEXTO DAS CATEGORIAS =====
    // ==========================================================
    /**
     * Recebe uma string como "chas veganos organicos" e a transforma em "Chás, Veganos, Orgânicos"
     * @param {string} categoryString A string de categorias vinda do banco.
     * @returns {string} A string formatada para exibição.
     */
    function formatarCategorias(categoryString) {
        if (!categoryString) return ''; // Retorna vazio se não houver categoria

        const categorias = categoryString.split(' '); // Separa a string em um array: ['chas', 'veganos']
        
        const categoriasFormatadas = categorias.map(cat => {
            // Para cada item, coloca a primeira letra em maiúsculo e junta com o resto
            return cat.charAt(0).toUpperCase() + cat.slice(1);
        });

        return categoriasFormatadas.join(', '); // Junta tudo com vírgula e espaço: "Chás, Veganos"
    }


    // --- LÓGICA PARA CARREGAR PRODUTOS (com a alteração) ---
    async function carregarProdutos() {
        productsGrid.innerHTML = '<p>Carregando produtos...</p>';
        try {
            const response = await fetch('/api/produtos');
            if (!response.ok) {
                throw new Error('Resposta da rede não foi OK');
            }
            const produtos = await response.json();
            productsGrid.innerHTML = '';

            if (produtos.length === 0) {
                productsGrid.innerHTML = '<p>Nenhum produto encontrado no momento.</p>';
                return;
            }

            produtos.forEach(produto => {
                const card = document.createElement('div');
                card.className = 'product-card';
                card.dataset.productId = `prod_${produto.id}`;
                card.dataset.productName = produto.nome;
                card.dataset.productPrice = produto.preco;
                // O data-category continua com os dados crus, para o filtro funcionar
                card.dataset.category = produto.categoria; 

                // ===== 2. AQUI USAMOS A NOVA FUNÇÃO =====
                const categoriaExibicao = formatarCategorias(produto.categoria);

                card.innerHTML = `
                    <div class="product-image"><img src="${produto.imagem_url}" alt="${produto.nome}"></div>
                    <div class="product-info">
                        <span class="product-category">${categoriaExibicao}</span>
                        <h3 class="product-title">${produto.nome}</h3>
                        <p class="product-description">${produto.peso}</p>
                        <div class="product-price">
                            <div><span class="price">R$ ${parseFloat(produto.preco).toFixed(2).replace('.', ',')}</span></div>
                            <div class="product-actions"><button class="add-to-cart-btn"><i class="fas fa-shopping-cart"></i></button></div>
                        </div>
                    </div>
                `;
                productsGrid.appendChild(card);
            });

        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            productsGrid.innerHTML = '<p style="color: red;">Erro ao carregar produtos. Tente recarregar a página.</p>';
        }
    }


    // --- O RESTANTE DO CÓDIGO CONTINUA EXATAMENTE IGUAL ---

    function renderizarCarrinho() {
        const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
        cartItemsList.innerHTML = ''; 
        cartCount.textContent = carrinho.length;

        if (carrinho.length === 0) {
            cartItemsList.innerHTML = '<p class="cart-empty-message">Seu carrinho está vazio.</p>';
            cartTotalPrice.textContent = 'R$ 0,00';
        } else {
            let precoTotalCalculado = 0;
            carrinho.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.classList.add('cart-item');
                itemElement.dataset.itemId = item.id; 
                itemElement.innerHTML = `
                    <div class="cart-item-info">
                        <span class="item-name">${item.nome}</span>
                        <span class="item-price">R$ ${item.preco.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <button class="remove-item-btn" title="Remover item">&times;</button>
                `;
                cartItemsList.appendChild(itemElement);
                precoTotalCalculado += item.preco;
            });
            cartTotalPrice.textContent = `R$ ${precoTotalCalculado.toFixed(2).replace('.', ',')}`;
        }
    }

    if(productsGrid) {
        productsGrid.addEventListener('click', (event) => {
            const button = event.target.closest('.add-to-cart-btn');
            if (button) {
                const card = button.closest('.product-card');
                const produtoParaAdicionar = {
                    id: card.dataset.productId,
                    nome: card.dataset.productName,
                    preco: parseFloat(card.dataset.productPrice),
                    tipo: 'Produto'
                };
                
                const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
                carrinho.push(produtoParaAdicionar);
                localStorage.setItem('carrinho', JSON.stringify(carrinho));
                
                renderizarCarrinho();
                alert(`"${produtoParaAdicionar.nome}" foi adicionado ao carrinho!`);
            }
        });
    }

    cartItemsList.addEventListener('click', (event) => {
        if (event.target.classList.contains('remove-item-btn')) {
            const itemId = event.target.closest('.cart-item').dataset.itemId;
            let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
            carrinho = carrinho.filter(item => item.id !== itemId);
            localStorage.setItem('carrinho', JSON.stringify(carrinho));
            renderizarCarrinho();
        }
    });

    cartIcon.addEventListener('click', (event) => {
        event.preventDefault();
        cartDropdown.classList.toggle('show');
    });

    document.addEventListener('click', (event) => {
        const isClickInsideCart = cartDropdown.contains(event.target);
        const isClickOnIcon = cartIcon.contains(event.target);
        if (cartDropdown.classList.contains('show') && !isClickInsideCart && !isClickOnIcon) {
            cartDropdown.classList.remove('show');
        }
    });

    function filterProducts(category) {
        const allProductCards = document.querySelectorAll('.product-card');
        allProductCards.forEach(card => {
            if (category === 'all' || card.dataset.category.includes(category)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    categoryLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            filterProducts(event.target.dataset.category);
        });
    });

    if (allProductsLink) {
        allProductsLink.addEventListener('click', (event) => {
            event.preventDefault();
            filterProducts('all');
        });
    }

    async function inicializarPagina() {
        await carregarProdutos();
        renderizarCarrinho();
    }

    inicializarPagina();
});