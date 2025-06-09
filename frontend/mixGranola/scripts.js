// Conteúdo para o arquivo scripts.js

// Função para mostrar o resumo do mix na tela
function mostrarResumo() {
    const checkboxes = document.querySelectorAll('.ingrediente:checked');
    const ingredientes = Array.from(checkboxes).map(cb => {
        return {
            name: cb.value,
            price: parseFloat(cb.dataset.price),
            weight: cb.dataset.weight
        };
    });
    
    const nome = document.getElementById('nomeMix').value || "Meu Mix Personalizado";
    
    // Calcula o preço total apenas para exibição na tela
    let total = 0;
    ingredientes.forEach(ing => total += ing.price);
    
    // Atualiza os elementos do resumo no HTML
    document.getElementById('nomeSelecionado').textContent = nome;
    
    const ingredientesList = document.getElementById('ingredientesSelecionados');
    ingredientesList.innerHTML = '';
    ingredientes.forEach(ing => {
        const li = document.createElement('li');
        li.innerHTML = `
            <strong>${ing.name}</strong> 
            <span style="color: #666; font-size: 0.9em;">(${ing.weight})</span>
            <span style="color: #4a8f29; float: right;">+ R$ ${ing.price.toFixed(2).replace('.', ',')}</span>
        `;
        ingredientesList.appendChild(li);
    });
    
    document.getElementById('precoTotal').textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    document.getElementById('resumo').style.display = 'block';
    document.getElementById('resumo').scrollIntoView({ behavior: 'smooth' });
}

// Função assíncrona para salvar o mix no banco de dados via API
async function adicionarAoCarrinho() {
    console.log("Iniciando processo para salvar o mix...");

    // 1. Coletar os dados da tela
    const nomeMix = document.getElementById('nomeMix').value || "Meu Mix Personalizado";
    const checkboxes = document.querySelectorAll('.ingrediente:checked');
    const ingredientesNomes = Array.from(checkboxes).map(cb => cb.value);

    // Validação simples no frontend
    if (ingredientesNomes.length === 0) {
        alert("Por favor, selecione pelo menos um ingrediente para o seu mix!");
        return;
    }

    // 2. Montar o objeto de dados para enviar
    const mixData = {
        nomeMix: nomeMix,
        ingredientes: ingredientesNomes
    };

    console.log("Enviando para a API:", mixData);
    
    // 3. Enviar os dados para o backend com a API fetch
    try {
        const response = await fetch('http://localhost:3000/api/mixes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(mixData),
        });

        const result = await response.json();

        if (response.ok) {
            alert(`Sucesso! Seu mix "${result.nome}" foi criado e salvo!`);
        } else {
            alert(`Ocorreu um erro: ${result.message}`);
        }

    } catch (error) {
        console.error('Erro de conexão ao tentar salvar o mix:', error);
        alert('Não foi possível conectar ao servidor. Verifique se o backend está rodando e tente novamente.');
    }
}

// Função para simular o compartilhamento
function compartilharMix() {
    const nome = document.getElementById('nomeMix').value || "Meu Mix Personalizado";
    alert(`Link para compartilhar "${nome}" foi copiado para a área de transferência!`);
}

// Função para definir o limite de seleção por categoria
function getMaxSelections(category) {
    if (category.includes('base')) return 2;
    if (category.includes('Castanhas')) return 3;
    if (category.includes('Frutas')) return 2;
    return 100; // Um número alto para "sem limite" na categoria extra
}

// Adiciona o listener para todos os checkboxes de ingredientes assim que o script carrega
document.querySelectorAll('.ingrediente').forEach(checkbox => {
    checkbox.addEventListener('change', function() {
        const category = this.closest('.section').querySelector('h2').textContent;
        const maxSelections = getMaxSelections(category);
        const checkedInCategory = this.closest('.section').querySelectorAll('.ingrediente:checked').length;
        
        if (checkedInCategory > maxSelections) {
            this.checked = false;
            alert(`Você pode selecionar no máximo ${maxSelections} itens na categoria "${category.split('(')[0].trim()}".`);
        }
    });
});