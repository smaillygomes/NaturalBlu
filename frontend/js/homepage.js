// Arquivo: frontend/js/homepage.js (VERSÃO COMPLETA E CORRIGIDA)

document.addEventListener('DOMContentLoaded', () => {

    // --- Referências aos Elementos do DOM ---
    const cartIcon = document.getElementById('cart-icon');
    const cartDropdown = document.getElementById('cart-dropdown');
    const cartItemsList = document.getElementById('cart-items-list');
    const cartCount = document.getElementById('cart-count');
    const cartTotalPrice = document.getElementById('cart-total-price');
    const productsGrid = document.querySelector('.products-grid');
    const categoryLinks = document.querySelectorAll('.category-filter-link');
    const allProductsLink = document.getElementById('show-all-products');
    const allProductCards = document.querySelectorAll('.product-card');

    // ===================================
    // --- LÓGICA DO CARRINHO DE COMPRAS ---
    // ===================================

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

    // Adiciona produto ao carrinho
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

    // Remove item do carrinho
    cartItemsList.addEventListener('click', (event) => {
        if (event.target.classList.contains('remove-item-btn')) {
            const itemId = event.target.closest('.cart-item').dataset.itemId;
            let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
            carrinho = carrinho.filter(item => item.id !== itemId);
            localStorage.setItem('carrinho', JSON.stringify(carrinho));
            renderizarCarrinho();
        }
    });

    // ===========================================
    // --- LÓGICA DO FILTRO E CONTROLE DE MENU ---
    // ===========================================

    // Mostra/esconde o dropdown do carrinho
    cartIcon.addEventListener('click', (event) => {
        event.preventDefault();
        cartDropdown.classList.toggle('show');
    });

    // Fecha o dropdown se clicar fora
    document.addEventListener('click', (event) => {
        const isClickInsideCart = cartDropdown.contains(event.target);
        const isClickOnIcon = cartIcon.contains(event.target);
        if (cartDropdown.classList.contains('show') && !isClickInsideCart && !isClickOnIcon) {
            cartDropdown.classList.remove('show');
        }
    });

    // Filtra produtos por categoria
    function filterProducts(category) {
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
            const selectedCategory = event.target.dataset.category;
            filterProducts(selectedCategory);
        });
    });

    if (allProductsLink) {
        allProductsLink.addEventListener('click', (event) => {
            event.preventDefault();
            filterProducts('all');
        });
    }

    // --- PONTO DE PARTIDA ---
    // Renderiza o carrinho ao carregar a página
    renderizarCarrinho(); 
});