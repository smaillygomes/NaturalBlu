document.addEventListener('DOMContentLoaded', () => {
    // Referências aos elementos DOM
    const cartItemsContainer = document.getElementById('cart-items-container');
    const summaryItemCount = document.getElementById('summary-item-count');
    const summarySubtotal = document.getElementById('summary-subtotal');
    const summaryShipping = document.getElementById('summary-shipping');
    const summaryDiscount = document.getElementById('summary-discount');
    const summaryTotal = document.getElementById('summary-total');
    const couponInput = document.getElementById('coupon-input');
    const applyCouponBtn = document.getElementById('apply-coupon-btn');
    const continueShoppingBtn = document.getElementById('continue-shopping-btn');
    const finishPurchaseBtn = document.getElementById('finish-purchase-btn');
    const paymentOptions = document.querySelectorAll('.payment-option');

    // Funções Auxiliares
    const SHIPPING_COST = 9.90; // Custo fixo do frete
    let currentDiscount = 0; // Desconto inicial, pode ser atualizado por cupom

    // Função para renderizar os itens do carrinho
    function renderCartItems() {
        const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
        cartItemsContainer.innerHTML = ''; // Limpa os itens atuais

        if (carrinho.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart-message">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Seu carrinho está vazio. Adicione produtos!</p>
                    <a href="index.html" class="btn" style="width: auto; margin-top: 20px;">Começar Compras</a>
                </div>
            `;
        } else {
            carrinho.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.classList.add('cart-item');
                itemElement.dataset.itemId = item.id; // Garante que o ID do item está no HTML

                itemElement.innerHTML = `
                    <div class="cart-item-image">
                        <img src="${item.imagem_url || 'assets/images/default-product.png'}" alt="${item.nome}">
                    </div>
                    <div class="cart-item-details">
                        <h3 class="cart-item-title">${item.nome}</h3>
                        <div class="cart-item-category">${item.categoria || 'Geral'}</div>
                        <div class="cart-item-price">R$ ${parseFloat(item.preco).toFixed(2).replace('.', ',')}</div>
                        <div class="cart-item-actions">
                            <div class="quantity-selector">
                                <button class="qty-minus" data-item-id="${item.id}">-</button>
                                <input type="number" value="1" min="1" data-item-id="${item.id}">
                                <button class="qty-plus" data-item-id="${item.id}">+</button>
                            </div>
                            <button class="remove-item" data-item-id="${item.id}">
                                <i class="fas fa-trash"></i> Remover
                            </button>
                        </div>
                    </div>
                `;
                cartItemsContainer.appendChild(itemElement);
            });
        }
        updateSummary(); // Atualiza o resumo após renderizar os itens
    }

    // Função para atualizar o resumo do pedido
    async function updateSummary() {
        const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
        let subtotal = 0;
        let totalItems = 0;

        // Para cada item no carrinho (localStorage), busca o preço atualizado da API
        for (const cartItem of carrinho) {
            try {
                const response = await fetch(`http://localhost:3000/api/produtos/${cartItem.id}`);
                if (!response.ok) {
                    console.error(`Erro ao buscar preço para item ${cartItem.id}:`, response.statusText);
                    // Usa o preço salvo no localStorage como fallback
                    subtotal += parseFloat(cartItem.preco) * 1; // Multiplica pela quantidade (assumindo 1 por enquanto)
                } else {
                    const productData = await response.json();
                    subtotal += parseFloat(productData.preco) * 1; // Multiplica pela quantidade
                }
            } catch (error) {
                console.error(`Erro na rede ao buscar preço para item ${cartItem.id}:`, error);
                // Usa o preço salvo no localStorage como fallback
                subtotal += parseFloat(cartItem.preco) * 1; // Multiplica pela quantidade
            }
            totalItems += 1; // Assumindo quantidade 1 por item no carrinho
        }

        const shipping = totalItems > 0 ? SHIPPING_COST : 0; // Cobra frete se houver itens
        // Lógica de desconto pode ser mais complexa (ex: porcentagem, cupom)
        // Por enquanto, um desconto fixo de exemplo se houver itens
        const discount = totalItems > 0 ? currentDiscount : 0; 
        const total = subtotal + shipping - discount;

        summaryItemCount.textContent = totalItems;
        summarySubtotal.textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
        summaryShipping.textContent = `R$ ${shipping.toFixed(2).replace('.', ',')}`;
        summaryDiscount.textContent = `- R$ ${discount.toFixed(2).replace('.', ',')}`;
        summaryTotal.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    }

    // Lógica de Event Listeners
    // Delegação de eventos para quantidade e remoção
    if (cartItemsContainer) {
        cartItemsContainer.addEventListener('click', (event) => {
            const target = event.target;
            
            // Botões de quantidade
            if (target.classList.contains('qty-minus') || target.classList.contains('qty-plus')) {
                const button = target.closest('button');
                const itemId = parseInt(button.dataset.itemId);
                const input = button.parentNode.querySelector('input[type="number"]');
                let quantity = parseInt(input.value);

                if (target.classList.contains('qty-minus')) {
                    if (quantity > 1) {
                        quantity--;
                    }
                } else { // qty-plus
                    quantity++;
                }
                input.value = quantity;
                // NOTA: Para uma atualização precisa, você precisaria atualizar a quantidade
                // no localStorage também e depois chamar updateSummary().
                // Por enquanto, updateSummary() recalcula baseado no localStorage (que não tem qtde).
                // Para ter qtde funcional, o carrinho no localStorage precisaria guardar {id, nome, preco, quantidade}.
                // Se isso for um requisito, podemos ajustar.
                updateSummary(); 
            }

            // Botão de remover item
            if (target.classList.contains('remove-item') || target.closest('.remove-item')) {
                const removeButton = target.closest('.remove-item');
                const itemId = parseInt(removeButton.dataset.itemId);
                
                let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
                // Filtra o carrinho, removendo todas as ocorrências do item com esse ID
                carrinho = carrinho.filter(item => item.id !== itemId); 
                localStorage.setItem('carrinho', JSON.stringify(carrinho));
                
                renderCartItems(); // Re-renderiza os itens após a remoção
            }
        });
    }

    // Script para selecionar método de pagamento
    paymentOptions.forEach(option => {
        option.addEventListener('click', function() {
            paymentOptions.forEach(opt => {
                opt.classList.remove('selected');
            });
            this.classList.add('selected');
        });
    });

    // Script para aplicar cupom
    if (applyCouponBtn) {
        applyCouponBtn.addEventListener('click', function() {
            const coupon = couponInput.value.trim();
            if (coupon) {
                // Lógica de cupom: para este exemplo, apenas um desconto fixo
                if (coupon.toLowerCase() === 'desconto10') { // Exemplo de cupom
                    currentDiscount = 10.00; // Aplica um desconto de R$ 10,00
                    alert(`Cupom "${coupon}" aplicado com sucesso!`);
                } else {
                    currentDiscount = 0;
                    alert(`Cupom "${coupon}" inválido.`);
                }
                updateSummary(); // Recalcula o resumo com o novo desconto
            } else {
                currentDiscount = 0;
                updateSummary();
            }
        });
    }

    // Botão Continuar Comprando
    if (continueShoppingBtn) {
        continueShoppingBtn.addEventListener('click', () => {
            window.location.href = 'index.html'; // Redireciona para a homepage
        });
    }

    // Botão Finalizar Compra
    if (finishPurchaseBtn) {
        finishPurchaseBtn.addEventListener('click', () => {
            // Lógica para finalizar a compra (redirecionar para página de pagamento, etc.)
            alert('Funcionalidade "Finalizar Compra" a ser implementada!');
        });
    }

    // Ponto de partida: Renderiza os itens do carrinho e o resumo ao carregar a página
    renderCartItems(); 
});