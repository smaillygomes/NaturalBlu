// Arquivo: homepage-scripts.js

document.addEventListener('DOMContentLoaded', () => {

    const cartIcon = document.getElementById('cart-icon');
    const cartDropdown = document.getElementById('cart-dropdown');
    const cartItemsList = document.getElementById('cart-items-list');
    const cartCount = document.getElementById('cart-count');
    const cartTotalPrice = document.getElementById('cart-total-price');

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

    cartIcon.addEventListener('click', (event) => {
        event.preventDefault();
        cartDropdown.classList.toggle('show');
    });

    cartItemsList.addEventListener('click', (event) => {
        if (event.target.classList.contains('remove-item-btn')) {
            const itemId = event.target.closest('.cart-item').dataset.itemId;
            let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
            carrinho = carrinho.filter(item => item.id !== itemId);
            localStorage.setItem('carrinho', JSON.stringify(carrinho));
            renderizarCarrinho();
        }
    });

    document.addEventListener('click', (event) => {
        // Verifica se o carrinho está visível E se o clique NÃO foi dentro do painel do carrinho
        // E também se o clique NÃO foi no próprio ícone do carrinho (para evitar que ele feche e abra ao mesmo tempo)
        const isClickInsideCart = cartDropdown.contains(event.target);
        const isClickOnIcon = cartIcon.contains(event.target);

        if (cartDropdown.classList.contains('show') && !isClickInsideCart && !isClickOnIcon) {
            cartDropdown.classList.remove('show');
        }
    });
    // --- FIM DA NOVA LÓGICA ---

    renderizarCarrinho();
});