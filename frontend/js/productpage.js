// Função para obter o parâmetro 'id' da URL
function getProductIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// Função para carregar e exibir os detalhes do produto
async function loadProductDetails() {
    const productId = getProductIdFromUrl();
    const productContainer = document.querySelector('.product-container');
    const loadingMessage = document.getElementById('loading-message');

    // Se não houver ID na URL, mostra uma mensagem de erro e esconde o container do produto
    if (!productId) {
        if (loadingMessage) loadingMessage.style.display = 'none';
        if (productContainer) productContainer.style.display = 'none';
        document.querySelector('.product-page .container').innerHTML = '<div style="text-align: center; padding: 50px 0;"><h1>Produto não especificado.</h1><p>Por favor, selecione um produto para visualizar os detalhes.</p><a href="index.html" class="btn" style="margin-top: 20px;">Voltar para a Home</a></div>';
        return;
    }

    // Exibir mensagem de carregamento e esconder o container do produto inicialmente
    if (loadingMessage) loadingMessage.style.display = 'block';
    if (productContainer) productContainer.style.display = 'none';

    try {
        // Faz a requisição para a sua API buscando o produto pelo ID
        const response = await fetch(`http://localhost:3000/api/produtos/${productId}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Produto não encontrado em nosso catálogo.');
            }
            throw new Error(`Erro ao carregar produto: ${response.statusText}`);
        }

        const product = await response.json(); // Converte a resposta para JSON
        
        // Esconder mensagem de carregamento e mostrar o container do produto
        if (loadingMessage) loadingMessage.style.display = 'none';
        if (productContainer) productContainer.style.display = 'flex'; // Usar 'flex' para reativar o layout original

        // --- Preencher os elementos da página com os dados do produto ---

        // Título da Página (na aba do navegador)
        document.title = `${product.nome} | NaturalBlu`; 
        
        // Preencher Imagem Principal (no .main-gallery .main-image img)
        const mainImageElement = document.querySelector('.product-gallery .main-image img');
        if (mainImageElement) {
            mainImageElement.src = product.imagem_url || 'assets/images/default-product.png';
            mainImageElement.alt = product.nome;
        }
        
        // Preencher Miniaturas (usando apenas a imagem principal como miniatura por enquanto)
        const thumbnailsContainer = document.querySelector('.product-gallery .thumbnails');
        if (thumbnailsContainer) {
            thumbnailsContainer.innerHTML = ''; // Limpa miniaturas estáticas

            const mainThumbnail = document.createElement('div');
            mainThumbnail.classList.add('thumbnail');
            mainThumbnail.innerHTML = `<img src="${product.imagem_url || 'assets/images/default-product.png'}" alt="${product.nome}">`;
            thumbnailsContainer.appendChild(mainThumbnail);

            // Lógica para alternar a imagem principal ao clicar nas miniaturas (se houver mais de uma)
            mainThumbnail.addEventListener('click', () => {
                mainImageElement.src = product.imagem_url || 'assets/images/default-product.png';
            });
        }
        
        // Preencher Detalhes do Produto
        const productCategoryElement = document.querySelector('.product-details .product-category');
        if (productCategoryElement) productCategoryElement.textContent = product.categoria;

        const productTitleElement = document.querySelector('.product-details .product-title');
        if (productTitleElement) productTitleElement.textContent = product.nome;

        const productPriceElement = document.querySelector('.product-details .product-price');
        if (productPriceElement) productPriceElement.textContent = `R$ ${parseFloat(product.preco).toFixed(2).replace('.', ',')}`;

        const productDescriptionElement = document.querySelector('.product-details .product-description p');
        // CORRIGIDO: Usando 'product.descricao' (nome da coluna no DB)
        if (productDescriptionElement) productDescriptionElement.textContent = product.descricao || product.peso || 'Descrição não disponível.'; 
        
        // --- Preencher Benefícios Dinamicamente ---
        const productFeaturesList = document.querySelector('.product-features ul');
        if (productFeaturesList && product.beneficios) {
            productFeaturesList.innerHTML = ''; // Limpa os benefícios estáticos existentes

            let beneficiosArray = [];
            // Tenta fazer o parse se 'beneficios' for uma string JSON, senão usa como está
            try {
                beneficiosArray = JSON.parse(product.beneficios);
            } catch (e) {
                // Se não for JSON, assume que é uma string simples (ou um array já)
                beneficiosArray = Array.isArray(product.beneficios) ? product.beneficios : [product.beneficios];
            }
            
            if (beneficiosArray && Array.isArray(beneficiosArray)) {
                beneficiosArray.forEach(benefit => {
                    const li = document.createElement('li');
                    li.textContent = benefit;
                    productFeaturesList.appendChild(li);
                });
            } else {
                productFeaturesList.innerHTML = '<li>Nenhum benefício listado.</li>';
            }
        } else if (productFeaturesList) { // Se não tiver a propriedade 'beneficios'
            productFeaturesList.innerHTML = '<li>Nenhum benefício listado.</li>';
        }
        // --- FIM Preencher Benefícios ---

        // Atualizar Meta Dados
        const metaProductId = document.getElementById('meta-product-id');
        if (metaProductId) metaProductId.textContent = product.id;

        const metaProductCategory = document.getElementById('meta-product-category');
        if (metaProductCategory) metaProductCategory.textContent = product.categoria;
        
        const metaProductTags = document.getElementById('meta-product-tags');
        if (metaProductTags) metaProductTags.textContent = product.tags || 'natural, saudável'; // Se tiver tags no DB

        // Conectar o botão 'Adicionar ao Carrinho' desta página
        const addToCartBtn = document.querySelector('.product-actions .add-to-cart-page-btn'); 
        if (addToCartBtn) {
            addToCartBtn.onclick = () => {
                adicionarItemAoCarrinho({
                    id: product.id,
                    nome: product.nome,
                    preco: parseFloat(product.preco)
                });
            };
        }

        // Preencher conteúdo da aba "Descrição"
        const dynamicDescriptionContent = document.getElementById('dynamic-description-content');
        if (dynamicDescriptionContent) {
            // CORRIGIDO: Usando 'product.descricao' (nome da coluna no DB)
            dynamicDescriptionContent.innerHTML = product.descricao || product.peso || 'Descrição detalhada não disponível.';
        }

        // Preencher conteúdo da aba "Ingredientes"
        const dynamicIngredientsContent = document.getElementById('dynamic-ingredients-content');
        if (dynamicIngredientsContent) {
            // CORRIGIDO: Usando 'product.ingredientes_detalhados' (nome da coluna no DB)
            dynamicIngredientsContent.innerHTML = product.ingredientes_detalhados || 'Informações de ingredientes não disponíveis para este produto.';
            
            // CORRIGIDO: Usando 'product.alergens' (nome da coluna no DB)
            if (product.alergens) { 
                dynamicIngredientsContent.innerHTML += `<p><strong>Alérgenos:</strong> ${product.alergens}</p>`;
            }
            // CORRIGIDO: Usando 'product.opcao_vegana_info' (nome da coluna no DB)
            if (product.opcao_vegana_info) { 
                dynamicIngredientsContent.innerHTML += `<p><strong>Opção vegana:</strong> ${product.opcao_vegana_info}</p>`;
            }
        }
        // Nota: As abas "Avaliações" e "Entrega" ainda são estáticas no HTML.

    } catch (error) {
        console.error('Erro ao carregar os detalhes do produto:', error);
        if (loadingMessage) loadingMessage.style.display = 'none';
        if (productContainer) productContainer.style.display = 'none';
        document.querySelector('.product-page .container').innerHTML = `<div style="text-align: center; padding: 50px 0;"><h1>Erro ao carregar o produto.</h1><p>${error.message}</p><a href="index.html" class="btn" style="margin-top: 20px;">Voltar para a Home</a></div>`;
    }
}

// --- Scripts Estáticos da Página (manter) ---

// Script para as abas
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        const tabId = btn.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
    });
});

// Script para o seletor de quantidade
const qtyMinusBtn = document.querySelector('.qty-minus');
const qtyPlusBtn = document.querySelector('.qty-plus');
const quantityInput = document.getElementById('quantity');

if (qtyMinusBtn) {
    qtyMinusBtn.addEventListener('click', () => {
        if (quantityInput.value > 500) quantityInput.value = parseInt(quantityInput.value) - 100;
    });
}
if (qtyPlusBtn) {
    qtyPlusBtn.addEventListener('click', () => {
        quantityInput.value = parseInt(quantityInput.value) + 100;
    });
}

// Script para as estrelas de avaliação (assumindo que o HTML delas será estático ou gerado depois)
document.querySelectorAll('.rating-stars i').forEach(star => {
    star.addEventListener('click', () => {
        const rating = parseInt(star.getAttribute('data-rating'));
        const stars = document.querySelectorAll('.rating-stars i');
        stars.forEach((s, index) => {
            if (index < rating) {
                s.classList.remove('far');
                s.classList.add('fas');
            } else {
                s.classList.remove('fas');
                s.classList.add('far');
            }
        });
    });
});

// Script para as miniaturas da galeria (Agora interage com a imagem principal dinâmica)
document.querySelectorAll('.product-gallery .thumbnails .thumbnail img').forEach(thumb => {
    thumb.addEventListener('click', () => {
        const mainImageGallery = document.querySelector('.product-gallery .main-image img');
        if (mainImageGallery) {
            mainImageGallery.src = thumb.src;
        }
    });
});

// Ponto de partida: Chama a função para carregar os detalhes do produto quando a página for totalmente carregada
document.addEventListener('DOMContentLoaded', loadProductDetails);