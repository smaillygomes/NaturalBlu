document.addEventListener('DOMContentLoaded', () => {
    const cartItemsContainer = document.getElementById('cart-items-container');
    const summaryItemCount = document.getElementById('summary-item-count');
    const summarySubtotal = document.getElementById('summary-subtotal');
    const summaryShipping = document.getElementById('summary-shipping');
    const summaryDiscount = document.getElementById('summary-discount');
    const summaryTotal = document.getElementById('summary-total');
    const emptyCartMessage = document.querySelector('.empty-cart-message');

    // Função para carregar itens do localStorage (assume que 'cartItems' é o nome da chave)
    function getCartItems() {
        const storedItems = localStorage.getItem('carrinho');
        return storedItems ? JSON.parse(storedItems) : [];
    }

    // Função para salvar itens no localStorage
    function saveCartItems(items) {
        localStorage.setItem('carrinho', JSON.stringify(items));
    }

    // Função para renderizar os itens do carrinho
    function renderCartItems() {
        let cartItems = getCartItems();
        cartItemsContainer.innerHTML = ''; // Limpa o conteúdo atual

        if (cartItems.length === 0) {
            emptyCartMessage.style.display = 'block'; // Mostra a mensagem de carrinho vazio
            updateCartSummary(0, 0); // Atualiza o resumo para zero
            return;
        } else {
            emptyCartMessage.style.display = 'none'; // Esconde a mensagem de carrinho vazio
        }

        let subtotal = 0;
        let totalItems = 0;

        cartItems.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            itemElement.dataset.productId = item.id; // Para facilitar a remoção

            const itemPrice = parseFloat(item.preco);
            const itemQuantity = parseInt(item.quantity || 1); // Garante que a quantidade seja um número

            subtotal += itemPrice * itemQuantity;
            totalItems += itemQuantity;

            itemElement.innerHTML = `
                <div class="cart-item-image">
                    <img src="${item.imagem_url || 'assets/images/default-product.png'}" alt="${item.nome}">
                </div>
                <div class="cart-item-details">
                    <h3 class="cart-item-title">${item.nome}</h3>
                    <p class="cart-item-category">${item.categoria || 'Produto Natural'}</p>
                    <p class="cart-item-price">R$ ${itemPrice.toFixed(2).replace('.', ',')}</p>
                    <div class="cart-item-actions">
                        <div class="quantity-selector">
                            <button class="quantity-decrease" data-id="${item.id}">-</button>
                            <input type="text" value="${itemQuantity}" data-id="${item.id}" readonly>
                            <button class="quantity-increase" data-id="${item.id}">+</button>
                        </div>
                        <button class="remove-item" data-id="${item.id}">
                            <i class="fas fa-trash-alt"></i> Remover
                        </button>
                    </div>
                </div>
            `;
            cartItemsContainer.appendChild(itemElement);
        });

        updateCartSummary(subtotal, totalItems);
    }

    // Função para atualizar o resumo do carrinho
    function updateCartSummary(subtotal, totalItems) {
        summaryItemCount.textContent = totalItems;
        summarySubtotal.textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;

        // Por enquanto, frete e desconto são fixos/zero. Você pode adicionar lógica aqui depois.
        const shipping = 0; // Pode ser dinâmico no futuro
        const discount = 0; // Pode ser dinâmico no futuro
        const total = subtotal + shipping - discount;

        summaryShipping.textContent = `R$ ${shipping.toFixed(2).replace('.', ',')}`;
        summaryDiscount.textContent = `R$ ${discount.toFixed(2).replace('.', ',')}`;
        summaryTotal.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    }

    // Função para remover item do carrinho
    function removeItemFromCart(productId) {
        let cartItems = getCartItems();
        
        const idToRemove = parseInt(productId); 

        // Filtra os itens, mantendo apenas aqueles cujo ID é diferente do ID a ser removido
        // Se houver mais de um item igual, remove apenas um por vez
        const indexToRemove = cartItems.findIndex(item => item.id === idToRemove);
        if (indexToRemove > -1) {
            if ((cartItems[indexToRemove].quantity || 1) > 1) {
                cartItems[indexToRemove].quantity--; // Decrementa a quantidade
            } else {
                cartItems.splice(indexToRemove, 1); // Remove o item se a quantidade for 1 ou menos
            }
        }
        
        saveCartItems(cartItems);
        renderCartItems(); // Renderiza novamente a página do carrinho

        // NOVIDADE: Chama a função global para atualizar o dropdown do carrinho
        if (typeof renderizarCarrinho === 'function') { // Verifica se a função existe
            renderizarCarrinho(); 
        }
    }

    // Função para atualizar a quantidade de um item no carrinho
    function updateItemQuantity(productId, change) {
        let cartItems = getCartItems();
        
        const idToUpdate = parseInt(productId);
        
        const itemIndex = cartItems.findIndex(item => item.id === idToUpdate);

        if (itemIndex > -1) {
            let newQuantity = (cartItems[itemIndex].quantity || 1) + change;
            if (newQuantity < 1) newQuantity = 1; // Quantidade mínima é 1

            cartItems[itemIndex].quantity = newQuantity;
            saveCartItems(cartItems);
            renderCartItems(); // Renderiza novamente a página do carrinho

            // NOVIDADE: Chama a função global para atualizar o dropdown do carrinho
            if (typeof renderizarCarrinho === 'function') { // Verifica se a função existe
                renderizarCarrinho();
            }
        }
    }

    // Função para atualizar a quantidade de um item no carrinho
    function updateItemQuantity(productId, change) {
        let cartItems = getCartItems();
        
        // Garante que o ID do produto é um número para a busca
        const idToUpdate = parseInt(productId);
        
        const itemIndex = cartItems.findIndex(item => item.id === idToUpdate);

        if (itemIndex > -1) {
            let newQuantity = (cartItems[itemIndex].quantity || 1) + change; // Adicionado (item.quantity || 1)
            if (newQuantity < 1) newQuantity = 1; // Quantidade mínima é 1

            cartItems[itemIndex].quantity = newQuantity;
            saveCartItems(cartItems);
            renderCartItems(); // Renderiza novamente para atualizar
        }
    }

    // Event Listeners para botões de remoção e quantidade
    cartItemsContainer.addEventListener('click', (event) => {
        const target = event.target;
        // Adicione este console.log para ver o elemento clicado
        console.log('Elemento clicado:', target); 

        const productId = target.dataset.id || target.closest('button')?.dataset.id;
        // Adicione este console.log para ver o productId capturado
        console.log('ProductId capturado:', productId);

        if (!productId) {
            console.log('Nenhum productId encontrado para a ação.'); // Adicione log
            return; // Não é um botão de ação do item
        }

        if (target.classList.contains('remove-item') || target.closest('.remove-item')) {
            console.log('Botão Remover clicado para o produto:', productId); // Adicione log
            removeItemFromCart(productId);
        } else if (target.classList.contains('quantity-decrease')) {
            console.log('Botão Decrementar clicado para o produto:', productId); // Adicione log
            updateItemQuantity(productId, -1);
        } else if (target.classList.contains('quantity-increase')) {
            console.log('Botão Aumentar clicado para o produto:', productId); // Adicione log
            updateItemQuantity(productId, 1);
        }
    });

    // Event Listener para os métodos de pagamento (apenas visual por enquanto)
    const paymentOptions = document.querySelectorAll('.payment-option');
    paymentOptions.forEach(option => {
        option.addEventListener('click', () => {
            paymentOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
        });
    });

    // Event Listener para o botão "Continuar Comprando"
    const continueShoppingBtn = document.getElementById('continue-shopping-btn');
    if (continueShoppingBtn) {
        continueShoppingBtn.addEventListener('click', () => {
            window.location.href = 'index.html'; // Redireciona para a página inicial
        });
    }

    // Chamar renderCartItems() quando a página carregar para exibir os produtos
    renderCartItems();
});