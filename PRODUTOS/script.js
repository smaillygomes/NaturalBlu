fetch('http://localhost:3000/produtos')
  .then(res => res.json())
  .then(produtos => {
    const container = document.getElementById('produtos');
    container.innerHTML = produtos.map(produto => `
      <div class="produto">
        <h3>${produto.nome}</h3>
        <p>${produto.descricao}</p>
        <span>R$ ${produto.preco}</span>
      </div>
    `).join('');
  });