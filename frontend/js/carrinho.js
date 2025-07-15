// Arquivo: frontend/js/carrinho.js (Versão Final com Suporte a Imagem, Categoria e Quantidade)

/**
 * Função global para adicionar um item ao carrinho. Esta é a ÚNICA função que deve ser usada para isso.
 * @param {object} produto - O objeto do produto. Ex: {id, nome, preco, imagem_url, categoria, [quantity]}
 */
function adicionarItemAoCarrinho(produto) {
    if (!produto || produto.id === undefined || !produto.nome || produto.preco === undefined) {
        console.error("Tentativa de adicionar produto inválido:", produto);
        return;
    }
    let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    
    // Converte o ID do produto para string para usar replace (caso já seja número)
    // Remove prefixos como 'mix_' ou 'prod_' que podem vir do HTML ou de logs antigos
    // Converte para número, garantindo que o ID salvo é sempre um inteiro puro.
    const cleanId = parseInt(String(produto.id).replace('mix_', '').replace('prod_', ''));

    // Verifica se o ID limpo é um número válido. Se não for, loga um erro e não adiciona.
    if (isNaN(cleanId)) {
        console.error("ID do produto inválido após limpeza, não adicionado ao carrinho:", produto.id);
        return;
    }

    // Procura se o item já existe no carrinho para atualizar a quantidade
    const itemExistente = carrinho.find(item => item.id === cleanId);

    if (itemExistente) {
        itemExistente.quantity = (itemExistente.quantity || 1) + 1; // Incrementa a quantidade
    } else {
        // Se o item não existe, adiciona ele com todas as propriedades
        carrinho.push({
            id: cleanId,
            nome: produto.nome,
            preco: parseFloat(produto.preco), // Garante que o preço também é um número
            // Inclui imagem_url e categoria, com fallbacks caso não venham
            imagem_url: produto.imagem_url || 'assets/images/default-product.png', 
            categoria: produto.categoria || 'Sem Categoria', 
            quantity: 1 // Adiciona a propriedade quantity para novos itens
        });
    }
    
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
    
    renderizarCarrinho(); // Atualiza a interface do dropdown imediatamente.
    // O alerta pode ser removido depois de testar se preferir uma UX mais suave
    alert(`"${produto.nome}" foi adicionado ao carrinho!`);
}

/**
 * Lê os dados do localStorage e atualiza a interface do carrinho (dropdown).
 */
function renderizarCarrinho() {
    let carrinho;
    try {
        const storedCart = localStorage.getItem('carrinho');
        carrinho = storedCart ? JSON.parse(storedCart) : [];
        if (!Array.isArray(carrinho)) {
            console.warn("Conteúdo do carrinho no localStorage não é um array. Reiniciando carrinho.");
            carrinho = [];
            localStorage.removeItem('carrinho');
        }
    } catch (e) {
        console.error("Erro ao fazer parse do carrinho do localStorage. Limpando carrinho.", e);
        carrinho = [];
        localStorage.removeItem('carrinho');
    }

    const cartItemsList = document.getElementById('cart-items-list');
    const cartCount = document.getElementById('cart-count');
    const cartTotalPrice = document.getElementById('cart-total-price');

    if (!cartItemsList || !cartCount || !cartTotalPrice) {
        // Se os elementos não existirem (ex: em cartpage.html), não tenta renderizar o dropdown
        return;
    }

    cartItemsList.innerHTML = '';
    
    let totalItemsInCart = 0;
    let precoTotalCalculado = 0;

    if (carrinho.length === 0) {
        cartItemsList.innerHTML = '<p class="cart-empty-message">Seu carrinho está vazio.</p>';
    } else {
        carrinho.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.classList.add('cart-item');
            // Usamos item.id para o dataset, que já está limpo e numérico
            itemElement.dataset.itemId = item.id; 
            itemElement.innerHTML = `
                <div class="cart-item-info">
                    <span class="item-name">${item.nome} (${item.quantity || 1})</span> 
                    <span class="item-price">R$ ${(parseFloat(item.preco) * (item.quantity || 1)).toFixed(2).replace('.', ',')}</span>
                </div>
                <button class="remove-item-btn" title="Remover item">&times;</button>
            `;
            cartItemsList.appendChild(itemElement);
            precoTotalCalculado += parseFloat(item.preco) * (item.quantity || 1);
            totalItemsInCart += (item.quantity || 1);
        });
    }
    
    cartCount.textContent = totalItemsInCart;
    cartTotalPrice.textContent = `R$ ${precoTotalCalculado.toFixed(2).replace('.', ',')}`;
}

// Ouve o evento de que a página HTML foi totalmente carregada.
document.addEventListener('DOMContentLoaded', () => {
    const cartIcon = document.getElementById('cart-icon');
    const cartDropdown = document.getElementById('cart-dropdown');
    const cartItemsList = document.getElementById('cart-items-list');

    // Listener para remover itens (fica aqui, pois gerencia o carrinho)
    if (cartItemsList) {
        cartItemsList.addEventListener('click', (event) => {
            const removeButton = event.target.closest('.remove-item-btn');

            if (removeButton) {
                event.stopPropagation();
                
                const rawItemId = removeButton.closest('.cart-item')?.dataset.itemId;
                // Garante que o ID limpo seja numérico para comparação
                const itemIdToRemove = parseInt(String(rawItemId).replace('mix_', '').replace('prod_', ''));
                
                if (isNaN(itemIdToRemove)) {
                    console.error("ID do item para remover é inválido (NaN) após limpeza:", rawItemId);
                    return;
                }

                let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
                // Filtra por ID numérico limpo e remove APENAS UMA OCORRÊNCIA para múltiplos do mesmo item
                const indexToRemove = carrinho.findIndex(item => item.id === itemIdToRemove);
                if (indexToRemove > -1) {
                    if ((carrinho[indexToRemove].quantity || 1) > 1) {
                        carrinho[indexToRemove].quantity--; // Decrementa a quantidade
                    } else {
                        carrinho.splice(indexToRemove, 1); // Remove o item se a quantidade for 1 ou menos
                    }
                }

                localStorage.setItem('carrinho', JSON.stringify(carrinho));
                renderizarCarrinho();
                // Chamada opcional para atualizar o carrinho na página de carrinho, se visível
                if (typeof renderCartItems === 'function') { // Verifica se renderCartItems existe no escopo global (cartpage.js)
                    renderCartItems();
                }
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