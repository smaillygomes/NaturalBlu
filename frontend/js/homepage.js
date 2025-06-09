document.addEventListener('DOMContentLoaded', () => {

    // --- Referências aos elementos do DOM ---
    const cartIcon = document.getElementById('cart-icon');
    const cartDropdown = document.getElementById('cart-dropdown');
    const cartItemsList = document.getElementById('cart-items-list');
    const cartCount = document.getElementById('cart-count');
    const cartTotalPrice = document.getElementById('cart-total-price');
    const productsGrid = document.querySelector('.products-grid'); // <- Pegamos a grade de produtos

    /**
     * Função principal que lê o LocalStorage e desenha o carrinho na tela.
     */
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

    // --- Lógica de Eventos ---

    // Evento para abrir/fechar o carrinho
    cartIcon.addEventListener('click', (event) => {
        event.preventDefault();
        cartDropdown.classList.toggle('show');
    });

    // Evento para fechar o carrinho ao clicar fora
    document.addEventListener('click', (event) => {
        const isClickInsideCart = cartDropdown.contains(event.target);
        const isClickOnIcon = cartIcon.contains(event.target);
        if (cartDropdown.classList.contains('show') && !isClickInsideCart && !isClickOnIcon) {
            cartDropdown.classList.remove('show');
        }
    });

    // Evento para remover itens do carrinho (delegação de evento)
    cartItemsList.addEventListener('click', (event) => {
        if (event.target.classList.contains('remove-item-btn')) {
            const itemId = event.target.closest('.cart-item').dataset.itemId;
            let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
            carrinho = carrinho.filter(item => item.id !== itemId);
            localStorage.setItem('carrinho', JSON.stringify(carrinho));
            renderizarCarrinho();
        }
    });

    // ===== NOVA LÓGICA PARA ADICIONAR PRODUTOS AO CARRINHO =====
    if(productsGrid) { // Garante que a grade de produtos existe na página
        productsGrid.addEventListener('click', (event) => {
            // Verifica se o clique foi em um botão 'adicionar ao carrinho' ou em seu ícone
            const button = event.target.closest('.add-to-cart-btn');
            if (button) {
                // Pega o card do produto pai do botão que foi clicado
                const card = button.closest('.product-card');
                
                // Extrai as informações dos atributos data-* que colocamos no HTML
                const produtoParaAdicionar = {
                    id: card.dataset.productId,
                    nome: card.dataset.productName,
                    preco: parseFloat(card.dataset.productPrice),
                    tipo: 'Produto' // Para diferenciar de um 'Mix Personalizado'
                };
                
                // Pega o carrinho atual, adiciona o novo item e salva de volta
                const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
                carrinho.push(produtoParaAdicionar);
                localStorage.setItem('carrinho', JSON.stringify(carrinho));
                
                // Re-renderiza o carrinho para mostrar o item novo instantaneamente
                renderizarCarrinho();

                // (Opcional) Mostra uma pequena confirmação visual
                alert(`"${produtoParaAdicionar.nome}" foi adicionado ao carrinho!`);
            }
        });
    }
    // ==========================================================

    // --- PONTO DE PARTIDA ---
    // Renderiza o carrinho pela primeira vez quando a página carrega.
    renderizarCarrinho(); 
});