// Arquivo: frontend/js/carrinho.js (Versão Definitiva - Correção Final de ID e Limpeza)

/**
 * Função global para adicionar um item ao carrinho. Esta é a ÚNICA função que deve ser usada para isso.
 * @param {object} produto - O objeto do produto. Ex: {id, nome, preco}
 */
function adicionarItemAoCarrinho(produto) {
    if (!produto || produto.id === undefined || !produto.nome || produto.preco === undefined) {
        console.error("Tentativa de adicionar produto inválido:", produto);
        return;
    }
    const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    
    // CORREÇÃO AQUI (já estava, mas crucial):
    // 1. Converte o ID do produto para string para usar replace (caso já seja número)
    // 2. Remove prefixos como 'mix_' ou 'prod_' que podem vir do HTML ou de logs antigos
    // 3. Converte para número, garantindo que o ID salvo é sempre um inteiro puro.
    const cleanId = parseInt(String(produto.id).replace('mix_', '').replace('prod_', ''));

    // Verifica se o ID limpo é um número válido. Se não for, loga um erro e não adiciona.
    if (isNaN(cleanId)) {
        console.error("ID do produto inválido após limpeza, não adicionado ao carrinho:", produto.id);
        return;
    }

    carrinho.push({
        id: cleanId, // <<<--- ID limpo e numérico salvo aqui
        nome: produto.nome,
        preco: parseFloat(produto.preco) // Garante que o preço também é um número
    });
    
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
    
    renderizarCarrinho(); // Atualiza a interface imediatamente.
    alert(`"${produto.nome}" foi adicionado ao carrinho!`);
}

/**
 * Lê os dados do localStorage e atualiza a interface do carrinho.
 */
function renderizarCarrinho() {
    // CORREÇÃO CRÍTICA AQUI (para o erro "[object Object] is not valid JSON"):
    // Adiciona um bloco try-catch ao JSON.parse para lidar com dados corrompidos.
    let carrinho;
    try {
        const storedCart = localStorage.getItem('carrinho');
        carrinho = storedCart ? JSON.parse(storedCart) : [];
        // Se, por algum motivo, o carrinho parseado não for um array, reinicia.
        if (!Array.isArray(carrinho)) {
            console.warn("Conteúdo do carrinho no localStorage não é um array. Reiniciando carrinho.");
            carrinho = [];
            localStorage.removeItem('carrinho'); // Limpa o localStorage para evitar futuros erros
        }
    } catch (e) {
        console.error("Erro ao fazer parse do carrinho do localStorage. Limpando carrinho.", e);
        carrinho = []; // Se houver erro de parse, inicia um carrinho vazio
        localStorage.removeItem('carrinho'); // Limpa o localStorage para evitar futuros erros
    }

    const cartItemsList = document.getElementById('cart-items-list');
    const cartCount = document.getElementById('cart-count');
    const cartTotalPrice = document.getElementById('cart-total-price');

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
            // item.id já será número (pela correção em adicionarItemAoCarrinho)
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
            const removeButton = event.target.closest('.remove-item-btn');

            if (removeButton) { // Se um botão de remoção foi clicado
                event.stopPropagation(); // Impede o fechamento do carrinho
                
                // CORREÇÃO AQUI: Limpa o ID do dataset ANTES de converter para número
                // Isso garante que mesmo IDs antigos com prefixo (salvos antes da correção) sejam removíveis.
                const rawItemId = removeButton.closest('.cart-item').dataset.itemId;
                const itemId = parseInt(String(rawItemId).replace('mix_', '').replace('prod_', '')); // <<< APLICA A LIMPEZA AQUI TAMBÉM
                
                if (isNaN(itemId)) { // Verifica se o ID é um número válido após a limpeza
                    console.error("ID do item para remover é inválido (NaN) após limpeza:", rawItemId); // Loga o ID original
                    return;
                }

                let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
                // Filtra por ID numérico limpo
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