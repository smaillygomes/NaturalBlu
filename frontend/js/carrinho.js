// Arquivo: frontend/js/carrinho.js (Versão Definitiva)

/**
 * Função global para adicionar um item ao carrinho. Esta é a ÚNICA função que deve ser usada para isso.
 * @param {object} produto - O objeto do produto. Ex: {id, nome, preco}
 */
function adicionarItemAoCarrinho(produto) {
    if (!produto || !produto.id || !produto.nome || produto.preco === undefined) {
        console.error("Tentativa de adicionar produto inválido:", produto);
        return;
    }
    const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    carrinho.push(produto);
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
    
    renderizarCarrinho(); // Atualiza a interface imediatamente.
    alert(`"${produto.nome}" foi adicionado ao carrinho!`);
}

/**
 * Lê os dados do localStorage e atualiza a interface do carrinho.
 */
function renderizarCarrinho() {
    const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    const cartItemsList = document.getElementById('cart-items-list');
    const cartCount = document.getElementById('cart-count');
    const cartTotalPrice = document.getElementById('cart-total-price');

    // Se os elementos do carrinho não existirem na página atual, a função para.
    if (!cartItemsList || !cartCount || !cartTotalPrice) {
        return;
    }

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
                    <span class="item-price">R$ ${parseFloat(item.preco).toFixed(2).replace('.', ',')}</span>
                </div>
                <button class="remove-item-btn" title="Remover item">&times;</button>
            `;
            cartItemsList.appendChild(itemElement);
            precoTotalCalculado += parseFloat(item.preco);
        });
        cartTotalPrice.textContent = `R$ ${precoTotalCalculado.toFixed(2).replace('.', ',')}`;
    }
}

// Ouve o evento de que a página HTML foi totalmente carregada.
document.addEventListener('DOMContentLoaded', () => {
    const cartIcon = document.getElementById('cart-icon');
    const cartDropdown = document.getElementById('cart-dropdown');
    const cartItemsList = document.getElementById('cart-items-list');

    // Listener para remover itens (fica aqui, pois gerencia o carrinho)
    if (cartItemsList) {
        cartItemsList.addEventListener('click', (event) => {
            // Verifica se o elemento clicado é o botão de remover
            if (event.target.classList.contains('remove-item-btn')) {
                
                // AQUI ESTÁ A MÁGICA: Impede que o evento de clique "borbulhe"
                // para o resto da página e feche o painel indevidamente.
                event.stopPropagation();

                const itemId = event.target.closest('.cart-item').dataset.itemId;
                let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
                carrinho = carrinho.filter(item => item.id !== itemId);
                localStorage.setItem('carrinho', JSON.stringify(carrinho));
                renderizarCarrinho();
            }
        });
    }

    // Listener para abrir e fechar o painel do carrinho
    if (cartIcon) {
        cartIcon.addEventListener('click', (event) => {
            event.preventDefault();
            cartDropdown?.classList.toggle('show');
        });
    }
    
    document.addEventListener('click', (event) => {
        if (cartDropdown && cartIcon) {
            const isClickInsideCart = cartDropdown.contains(event.target);
            const isClickOnIcon = cartIcon.contains(event.target);
            if (cartDropdown.classList.contains('show') && !isClickInsideCart && !isClickOnIcon) {
                cartDropdown.classList.remove('show');
            }
        }
    });

    // Ponto de partida: renderiza o carrinho assim que qualquer página carregar.
    renderizarCarrinho();
});