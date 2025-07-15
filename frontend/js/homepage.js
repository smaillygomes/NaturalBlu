// Arquivo: frontend/js/homepage.js (Versão Final com Carrinho Inteligente + Categorias Funcionais + Redirecionamento de Produto)

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. REFERÊNCIAS AOS ELEMENTOS DO DOM ---
    const productsGrid = document.getElementById('products-grid-container');
    const categoryLinks = document.querySelectorAll('.category-filter-link');
    const allProductsLink = document.getElementById('show-all-products');

    // --- 2. FUNÇÕES AUXILIARES ---
    function formatarCategorias(categoryString) {
        if (!categoryString) return '';
        return categoryString.split(' ')
            .map(cat => cat.charAt(0).toUpperCase() + cat.slice(1))
            .join(', ');
    }

    // --- 3. CARREGAMENTO DE PRODUTOS ---
    async function carregarProdutos() {
        if (!productsGrid) return;

        productsGrid.innerHTML = '<p>Carregando produtos...</p>';
        try {
            const response = await fetch('http://localhost:3000/api/produtos'); // Assumindo que o servidor está em localhost:3000
            if (!response.ok) throw new Error('A resposta da rede falhou.');

            const produtos = await response.json();
            productsGrid.innerHTML = ''; // Limpa a mensagem de carregamento

            if (produtos.length === 0) {
                productsGrid.innerHTML = '<p>Nenhum produto encontrado.</p>';
                return;
            }

            produtos.forEach(produto => {
                const card = document.createElement('div');
                card.className = 'product-card';
                // ATENÇÃO: Alterado para salvar apenas o ID numérico, sem o "prod_"
                card.dataset.productId = produto.id; 
                card.dataset.productName = produto.nome;
                card.dataset.productPrice = produto.preco;
                card.dataset.category = produto.categoria; // Usado para filtro de categoria

                card.innerHTML = `
                    <div class="product-image"><img src="${produto.imagem_url || 'assets/images/default-product.png'}" alt="${produto.nome}"></div>
                    <div class="product-info">
                        <span class="product-category">${formatarCategorias(produto.categoria)}</span>
                        <h3 class="product-title">${produto.nome}</h3>
                        <p class="product-description">${produto.peso}</p>
                        <div class="product-price">
                            <div><span class="price">R$ ${parseFloat(produto.preco).toFixed(2).replace('.', ',')}</span></div>
                            <div class="product-actions">
                                <button class="add-to-cart-btn"
                                        data-product-id="${produto.id}"
                                        data-product-name="${produto.nome}"
                                        data-product-price="${produto.preco}"
                                        data-product-image-url="${produto.imagem_url || 'assets/images/default-product.png'}"  data-product-category="${produto.categoria || ''}"> <i class="fas fa-shopping-cart"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;

                // NOVO: Adiciona um EventListener para o clique no card INTEIRO
                card.addEventListener('click', (event) => {
                    // Verifica se o clique NÃO veio do botão "Adicionar ao Carrinho"
                    // (ou de qualquer outro elemento que você não queira que redirecione a página)
                    if (!event.target.closest('.add-to-cart-btn')) {
                        const productId = card.dataset.productId; // Pega o ID do produto
                        if (productId) {
                            window.location.href = `productpage.html?id=${productId}`; // Redireciona com o ID
                        }
                    }
                });

                productsGrid.appendChild(card);
            });
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            productsGrid.innerHTML = '<p style="color: red;">Ocorreu um erro ao carregar os produtos.</p>';
        }
    }

    // --- 4. LÓGICA DE ADICIONAR AO CARRINHO (AJUSTADA PARA USAR O NOVO BOTÃO) ---
    if (productsGrid) {
        productsGrid.addEventListener('click', (event) => {
            const button = event.target.closest('.add-to-cart-btn');
            if (button) {
                const produtoParaAdicionar = {
                    id: button.dataset.productId,
                    nome: button.dataset.productName,
                    preco: parseFloat(button.dataset.productPrice),
                    imagem_url: button.dataset.productImageUrl, // ADICIONE ESTA LINHA
                    categoria: button.dataset.productCategory   // ADICIONE ESTA LINHA (se quiser a categoria)
                };
                adicionarItemAoCarrinho(produtoParaAdicionar);
            }
        });
    }

    // --- 5. LÓGICA DE FILTRO DE CATEGORIAS ---
    function filterProducts(category) {
        document.querySelectorAll('.product-card').forEach(card => {
            // Mostra o card se a categoria for 'all' OU se a categoria do card incluir o filtro
            if (category === 'all' || (card.dataset.category && card.dataset.category.includes(category))) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // Adiciona o evento de clique a cada link de categoria
    categoryLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault(); // Impede o link de recarregar a página
            const category = event.target.dataset.category;
            filterProducts(category);
        });
    });

    // Adiciona o evento de clique ao link "Home" ou "Mostrar Todos"
    if (allProductsLink) {
        allProductsLink.addEventListener('click', (event) => {
            event.preventDefault();
            filterProducts('all'); // 'all' é a palavra-chave para mostrar todos
        });
    }

    // --- PONTO DE PARTIDA ---
    carregarProdutos(); // Carrega os produtos quando a página for carregada
});

// A função 'adicionarItemAoCarrinho' é esperada do carrinho.js e deve ser global.
// Pelo seu HTML, 'carrinho.js' está sendo carregado antes de 'homepage.js', o que é o correto.