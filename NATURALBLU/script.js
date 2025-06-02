// Adiciona o evento de clique para todos os botões de coração
document.querySelectorAll('.btn-favorito').forEach(btn => {
  btn.addEventListener('click', function() {
    const produtoId = this.getAttribute('data-id');
    adicionarAoCarrinho(produtoId);
  });
});

// Função para adicionar ao carrinho (exemplo simples usando localStorage)
function adicionarAoCarrinho(id) {
  let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
  carrinho.push(id);
  localStorage.setItem('carrinho', JSON.stringify(carrinho));
  alert('Produto adicionado ao carrinho!');
}