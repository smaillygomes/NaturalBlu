 // Array para armazenar os itens do carrinho
 let cart = [];

 // Função para adicionar um produto ao carrinho
 function addToCart(productId) {
     // Verifica se o produto já está no carrinho
     const existingProduct = cart.find(item => item.id === productId);
     if (existingProduct) {
         // Incrementa a quantidade se o produto já estiver no carrinho
         existingProduct.quantity += 1;
     } else {
         // Adiciona um novo produto ao carrinho
         cart.push({ id: productId, quantity: 1 });
     }

     // Atualiza o contador do carrinho na interface
     updateCartCounter();
     console.log(cart); // Para depuração
 }

 // Função para atualizar o contador do carrinho
 function updateCartCounter() {
     const cartCounter = document.querySelector('.user-actions span');
     const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
     cartCounter.textContent = totalItems;
 }

 // Adiciona eventos de clique aos botões de carrinho
 document.querySelectorAll('.add-to-cart').forEach(button => {
     button.addEventListener('click', () => {
         const productId = parseInt(button.getAttribute('data-product-id'));
         addToCart(productId);
     });
 });