// Arquivo: frontend/js/mixpage.js (Versão Definitiva)

document.addEventListener('DOMContentLoaded', () => {

    // Referências aos elementos da página de Mix
    const basesGrid = document.getElementById('base-grid');
    const castanhasGrid = document.getElementById('castanhas-grid');
    const frutasGrid = document.getElementById('frutas-grid');
    const extrasGrid = document.getElementById('extras-grid');
    const visualizarResumoBtn = document.getElementById('visualizar-resumo-btn');
    const adicionarCarrinhoMixBtn = document.getElementById('adicionar-carrinho-btn');

    // Lógica para carregar os ingredientes do mix
    async function carregarIngredientes() {
        // Verifica se os contêineres dos ingredientes existem nesta página
        if (!basesGrid || !castanhasGrid || !frutasGrid || !extrasGrid) {
            return; // Se não estiver na página de mix, não faz nada.
        }

        try {
            const response = await fetch('/api/produtos-mix');
            if (!response.ok) throw new Error("A resposta da rede para produtos-mix falhou.");
            
            const ingredientes = await response.json();

            // Limpa as mensagens "Carregando..."
            basesGrid.innerHTML = '';
            castanhasGrid.innerHTML = '';
            frutasGrid.innerHTML = '';
            extrasGrid.innerHTML = '';

            ingredientes.forEach(ingrediente => {
                const categoriaPrincipal = ingrediente.categoria.split(' ')[0].toLowerCase();
                const cardHtml = `
                    <div class="ingredient-option">
                        <label>
                            <input type="checkbox" class="ingrediente" value="${ingrediente.nome}" data-price="${ingrediente.preco}" data-weight="${ingrediente.peso}">
                            <img src="${ingrediente.imagem_url}" alt="${ingrediente.nome}" class="ingredient-img">
                            <div class="ingredient-info">
                                <div class="ingredient-name">${ingrediente.nome}</div>
                                <div class="ingredient-meta"><span class="ingredient-weight">${ingrediente.peso}</span></div>
                                <div class="ingredient-price">+ R$ ${parseFloat(ingrediente.preco).toFixed(2).replace('.', ',')}</div>
                            </div>
                        </label>
                    </div>`;

                switch (categoriaPrincipal) {
                    case 'base': basesGrid.innerHTML += cardHtml; break;
                    case 'castanhas': castanhasGrid.innerHTML += cardHtml; break;
                    case 'frutas': frutasGrid.innerHTML += cardHtml; break;
                    case 'extras':
                    case 'suplementos': extrasGrid.innerHTML += cardHtml; break;
                }
            });
            // Após carregar, adiciona os listeners para limitar a seleção
            adicionarListenersAosCheckbox();
        } catch (error) {
            console.error("Erro ao carregar ingredientes do mix:", error);
            if (basesGrid) basesGrid.innerHTML = '<p style="color: red;">Erro ao carregar ingredientes.</p>';
        }
    }

    // A função para mostrar o resumo continua a mesma
    function mostrarResumo() {
        const checkboxes = document.querySelectorAll('.ingrediente:checked');
        const ingredientesSelecionados = Array.from(checkboxes).map(cb => ({ name: cb.value, price: parseFloat(cb.dataset.price) }));
        const nome = document.getElementById('nomeMix').value || "Meu Mix Personalizado";
        let total = 0;
        ingredientesSelecionados.forEach(ing => total += ing.price);
        
        document.getElementById('nomeSelecionado').textContent = nome;
        const ingredientesList = document.getElementById('ingredientesSelecionados');
        ingredientesList.innerHTML = '';
        ingredientesSelecionados.forEach(ing => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${ing.name}</strong><span style="color: #4a8f29; float: right;">+ R$ ${ing.price.toFixed(2).replace('.', ',')}</span>`;
            ingredientesList.appendChild(li);
        });
        
        document.getElementById('precoTotal').textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
        document.getElementById('resumo').style.display = 'block';
        document.getElementById('resumo').scrollIntoView({ behavior: 'smooth' });
    }

    // *** AQUI ESTÁ A CORREÇÃO PRINCIPAL ***
    // Esta função agora chama a API para SALVAR o mix e depois chama a função GLOBAL para ADICIONAR ao carrinho.
    async function salvarEMostrarMixNoCarrinho() {
        const nomeMix = document.getElementById('nomeMix').value || "Meu Mix Personalizado";
        const checkboxes = document.querySelectorAll('.ingrediente:checked');
        const ingredientesNomes = Array.from(checkboxes).map(cb => cb.value);

        if (ingredientesNomes.length === 0) {
            alert("Por favor, selecione pelo menos um ingrediente!");
            return;
        }

        const mixData = { nomeMix, ingredientes: ingredientesNomes };

        try {
            const response = await fetch('/api/mixes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mixData),
            });
            
            const result = await response.json();
            
            if (response.ok) {
                // 1. Monta o objeto do mix com os dados retornados pela API
                const mixParaAdicionar = {
                    id: `mix_${result.mixId}`,
                    nome: result.nome,
                    preco: result.preco
                };
                
                // 2. Chama a função GLOBAL do carrinho.js para adicionar o mix
                // A função já contém o alert, não precisamos de outro aqui.
                adicionarItemAoCarrinho(mixParaAdicionar);
            } else {
                alert(`Ocorreu um erro ao salvar o mix: ${result.message}`);
            }
        } catch (error) {
            console.error('Erro de conexão ao salvar o mix:', error);
            alert('Não foi possível conectar ao servidor para salvar seu mix.');
        }
    }

    // Função para validar a quantidade máxima de seleções
    function adicionarListenersAosCheckbox() {
        function getMaxSelections(category) {
            if (category.includes('base')) return 2;
            if (category.includes('Castanhas')) return 3;
            if (category.includes('Frutas')) return 2;
            return 100; // Para "Extras", sem limite prático
        }

        document.querySelectorAll('.ingrediente').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const sectionTitle = this.closest('.section').querySelector('h2').textContent;
                const maxSelections = getMaxSelections(sectionTitle);
                const checkedInCategory = this.closest('.section').querySelectorAll('.ingrediente:checked').length;

                if (checkedInCategory > maxSelections) {
                    this.checked = false;
                    alert(`Você pode selecionar no máximo ${maxSelections} itens para a categoria "${sectionTitle.split('(')[0].trim()}".`);
                }
            });
        });
    }

    // Adiciona os listeners aos botões da página
    if (visualizarResumoBtn) {
        visualizarResumoBtn.addEventListener('click', mostrarResumo);
    }
    if (adicionarCarrinhoMixBtn) {
        adicionarCarrinhoMixBtn.addEventListener('click', salvarEMostrarMixNoCarrinho);
    }
    
    // --- Ponto de Partida ---
    // Chama a função para carregar os ingredientes assim que a página estiver pronta.
    carregarIngredientes();
});