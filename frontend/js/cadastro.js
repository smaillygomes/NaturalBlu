// Este evento garante que o script só roda depois que o HTML estiver pronto.
document.addEventListener('DOMContentLoaded', () => {

    // Pegamos o formulário pelo ID que já existe no HTML
    const formCadastro = document.getElementById('formCadastro');
    // Pegamos a div onde mostraremos as mensagens de sucesso ou erro
    const areaMensagem = document.getElementById('areaMensagem');

    // Adicionamos um "espião" para o evento de submissão do formulário
    formCadastro.addEventListener('submit', async function(event) {
        // 1. Impedir o comportamento padrão de recarregar a página
        event.preventDefault();

        // 2. Limpar mensagens de feedback anteriores
        areaMensagem.innerHTML = '';
        areaMensagem.className = ''; 

        // 3. Coletar os dados do formulário de uma forma moderna
        const formData = new FormData(formCadastro);
        // Converte os dados do formulário em um objeto simples
        const dadosUsuario = Object.fromEntries(formData.entries());

        // 4. Enviar os dados para o backend usando a API fetch
        try {
            // A URL da nossa API de registro que está no server.js
            const response = await fetch('http://localhost:3000/api/register', { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify(dadosUsuario) 
            });

            // Converte a resposta do servidor (que é JSON) em um objeto
            const resultado = await response.json(); 

            if (response.ok) { // Se a resposta foi um sucesso (status 2xx)
                areaMensagem.textContent = resultado.message; 
                areaMensagem.style.color = 'green';
                formCadastro.reset(); // Limpa os campos do formulário
                
                // Opcional: Redirecionar para a página de login após 2 segundos
                setTimeout(() => {
                   // window.location.href = 'login.html'; // Descomente esta linha se já tiver a página de login
                }, 2000);

            } else { // Se a resposta foi um erro (status 4xx ou 5xx)
                areaMensagem.textContent = resultado.message || 'Ocorreu um erro ao cadastrar.'; 
                areaMensagem.style.color = 'red';
            }

        } catch (error) {
            console.error('Erro ao conectar com a API:', error);
            areaMensagem.textContent = 'Não foi possível conectar ao servidor. Verifique sua conexão ou tente novamente mais tarde.';
            areaMensagem.style.color = 'red';
        }
    });
});