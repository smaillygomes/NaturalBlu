// Arquivo: scripts.js

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
    
    let total = 0;
    ingredientes.forEach(ing => total += ing.price);
    
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

// Função assíncrona para salvar o mix no banco de dados E no carrinho local
async function adicionarAoCarrinho() {
    console.log("Iniciando processo para salvar o mix...");

    const nomeMix = document.getElementById('nomeMix').value || "Meu Mix Personalizado";
    const checkboxes = document.querySelectorAll('.ingrediente:checked');
    const ingredientesNomes = Array.from(checkboxes).map(cb => cb.value);

    if (ingredientesNomes.length === 0) {
        alert("Por favor, selecione pelo menos um ingrediente para o seu mix!");
        return;
    }

    const mixData = {
        nomeMix: nomeMix,
        ingredientes: ingredientesNomes
    };

    try {
        const response = await fetch('http://localhost:3000/api/mixes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mixData),
        });

        const result = await response.json();

        if (response.ok) {
            // LÓGICA DO CARRINHO
            // 1. Pega o carrinho atual do LocalStorage ou cria um array vazio.
            const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];

            // 2. Adiciona o novo mix ao carrinho.
            carrinho.push({
                id: `mix_${result.mixId}`,
                nome: result.nome,
                preco: result.preco,
                tipo: 'Mix Personalizado'
            });

            // 3. Salva o carrinho atualizado de volta no LocalStorage.
            localStorage.setItem('carrinho', JSON.stringify(carrinho));

            // 4. Avisa o usuário e o redireciona para a página inicial.
            //    (ASSUMINDO QUE SUA HOMEPAGE SE CHAMA 'index.html'. Se for outro nome, altere aqui)
            alert(`Seu mix "${result.nome}" foi criado e adicionado ao carrinho!`);
            window.location.href = 'index.html';

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
    return 100;
}

// Adiciona o listener para todos os checkboxes de ingredientes
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