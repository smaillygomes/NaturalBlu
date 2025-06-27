// Arquivo: frontend/js/mixpage.js (Versão final para carregamento dinâmico)

document.addEventListener('DOMContentLoaded', () => {

    // --- Referências aos Contêineres ---
    const basesGrid = document.getElementById('base-grid');
    const castanhasGrid = document.getElementById('castanhas-grid');
    const frutasGrid = document.getElementById('frutas-grid');
    const extrasGrid = document.getElementById('extras-grid');

    // --- Lógica de Carregamento Dinâmico ---
    async function carregarIngredientes() {
        try {
            const response = await fetch('/api/produtos-mix');
            const ingredientes = await response.json();

            // Limpa as mensagens "Carregando..."
            if(basesGrid) basesGrid.innerHTML = '';
            if(castanhasGrid) castanhasGrid.innerHTML = '';
            if(frutasGrid) frutasGrid.innerHTML = '';
            if(extrasGrid) extrasGrid.innerHTML = '';

            ingredientes.forEach(ingrediente => {
                const categoriaPrincipal = ingrediente.categoria.split(' ')[0];
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
                    case 'base':
                        basesGrid.innerHTML += cardHtml;
                        break;
                    case 'castanhas':
                        castanhasGrid.innerHTML += cardHtml;
                        break;
                    case 'frutas':
                        frutasGrid.innerHTML += cardHtml;
                        break;
                    case 'extras':
                    case 'suplementos':
                        extrasGrid.innerHTML += cardHtml;
                        break;
                }
            });
            adicionarListenersAosCheckbox();

        } catch (error) {
            console.error("Erro ao carregar ingredientes:", error);
        }
    }

    // --- Funções do Carrinho e Resumo ---
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

    async function adicionarAoCarrinho() {
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
                const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
                carrinho.push({ id: `mix_${result.mixId}`, nome: result.nome, preco: result.preco, tipo: 'Mix Personalizado' });
                localStorage.setItem('carrinho', JSON.stringify(carrinho));
                alert(`Seu mix "${result.nome}" foi criado e adicionado ao carrinho!`);
                window.location.href = 'index.html';
            } else {
                alert(`Ocorreu um erro: ${result.message}`);
            }
        } catch (error) {
            console.error('Erro de conexão ao salvar o mix:', error);
            alert('Não foi possível conectar ao servidor.');
        }
    }

    function getMaxSelections(category) {
        if (category.includes('base')) return 2;
        if (category.includes('Castanhas')) return 3;
        if (category.includes('Frutas')) return 2;
        return 100;
    }

    function adicionarListenersAosCheckbox() {
        document.querySelectorAll('.ingrediente').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const sectionTitle = this.closest('.section').querySelector('h2').textContent;
                const maxSelections = getMaxSelections(sectionTitle);
                const checkedInCategory = this.closest('.section').querySelectorAll('.ingrediente:checked').length;
                if (checkedInCategory > maxSelections) {
                    this.checked = false;
                    alert(`Você pode selecionar no máximo ${maxSelections} itens na categoria "${sectionTitle.split('(')[0].trim()}".`);
                }
            });
        });
    }

    // Adiciona os listeners aos botões usando seus IDs
    document.getElementById('visualizar-resumo-btn').addEventListener('click', mostrarResumo);
    document.getElementById('adicionar-carrinho-btn').addEventListener('click', adicionarAoCarrinho);
    document.getElementById('imprimir-btn').addEventListener('click', () => window.print());
    document.getElementById('compartilhar-btn').addEventListener('click', () => {
        alert('Funcionalidade de compartilhar ainda não implementada.');
    });

    // --- PONTO DE PARTIDA ---
    carregarIngredientes();
});