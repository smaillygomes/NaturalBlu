// 1. Importar os módulos necessários
require('dotenv').config(); // Carrega as variáveis do arquivo .env para process.env - FAÇA ISSO PRIMEIRO!


const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');

// 2. Configurações iniciais
const app = express();
// Usa a porta definida no .env ou 3000 como padrão
const apiPort = process.env.API_PORT || 3000; 

// 3. Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend')));

// 4. Configuração da Conexão com o Banco de Dados MySQL
//    Agora lendo as informações do process.env
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, 
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT) || 3306 // parseInt para garantir que é um número
};

// Verifica se todas as configurações do banco estão presentes
if (!dbConfig.host || !dbConfig.user || !dbConfig.database) {
    console.error("ERRO: Configurações de banco de dados ausentes no .env. Verifique DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT.");
    process.exit(1); // Encerra a aplicação se configurações críticas estiverem faltando
}


// 5. Rota de Cadastro de Usuário (`/api/register`)
app.post('/api/register', async (req, res) => {
    const { nome_completo, email, telefone, senha, confirmar_senha } = req.body;

    if (!nome_completo || !email || !senha || !confirmar_senha) {
        return res.status(400).json({ message: 'Todos os campos obrigatórios devem ser preenchidos (Nome, E-mail, Senha, Confirmar Senha).' });
    }
    if (senha !== confirmar_senha) {
        return res.status(400).json({ message: 'As senhas não coincidem.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Formato de e-mail inválido.' });
    }
    if (senha.length < 6) {
        return res.status(400).json({ message: 'A senha deve ter pelo menos 6 caracteres.' });
    }

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT id FROM usuarios WHERE email = ?', [email]);
        
        if (rows.length > 0) {
            await connection.end();
            return res.status(409).json({ message: 'Este e-mail já está cadastrado.' });
        }

        const saltRounds = 10;
        const senhaHash = await bcrypt.hash(senha, saltRounds);

        const [result] = await connection.execute(
            'INSERT INTO usuarios (nome_completo, email, telefone,senha_hash) VALUES (?, ?, ?, ?)',
            [nome_completo, email, telefone, senhaHash]
        );
        await connection.end();
        res.status(201).json({ message: 'Usuário cadastrado com sucesso!', userId: result.insertId });

    } catch (error) {
        console.error('Erro no servidor ao tentar cadastrar usuário:', error);
        if (connection) {
            await connection.end();
        }
        if (error.code === 'ER_DUP_ENTRY') {
             return res.status(409).json({ message: 'Este e-mail já está cadastrado.' });
        }
        res.status(500).json({ message: 'Erro interno no servidor ao tentar cadastrar o usuário.' });
    }
});

// --- Rota de Teste (Opcional) ---
app.get('/api', (req, res) => {
    res.json({ message: 'API do NaturalBlu está funcionando!' });
});

// ==========================================================
// 6. Rota para Salvar um Mix Personalizado (`/api/mixes`)
// ==========================================================
app.post('/api/mixes', async (req, res) => {
    // Pega o nome do mix e a lista de nomes de ingredientes do corpo da requisição
    const { nomeMix, ingredientes } = req.body;

    // --- 1. Validação Simples ---
    if (!nomeMix || !ingredientes || !Array.isArray(ingredientes) || ingredientes.length === 0) {
        return res.status(400).json({ message: 'Nome do mix e lista de ingredientes são obrigatórios.' });
    }

    let connection; // Define a conexão fora do try para poder usar no catch/finally

    try {
        // --- 2. Conectar ao Banco ---
        connection = await mysql.createConnection(dbConfig);

        // --- 3. Iniciar Transação ---
        // Usamos transação porque precisamos inserir em duas tabelas (mixes e mix_produtos).
        // Se der erro em uma, cancelamos tudo (rollback) para não deixar dados inconsistentes.
        await connection.beginTransaction();
        console.log("Transação iniciada.");

        // --- 4. Buscar Produtos e Calcular Preço ---
        // Criamos uma lista de '?' para usar na consulta SQL 'IN' de forma segura
        const placeholders = ingredientes.map(() => '?').join(',');
        const query = `SELECT id, nome, preco FROM produtos WHERE nome IN (${placeholders})`;

        console.log("Buscando produtos:", ingredientes);
        const [produtosDoMix] = await connection.execute(query, ingredientes);

        // Verifica se todos os ingredientes enviados foram encontrados no banco
        if (produtosDoMix.length !== ingredientes.length) {
            await connection.rollback(); // Cancela a transação
            console.error("Erro: Um ou mais ingredientes não foram encontrados no banco.");
            return res.status(400).json({ message: 'Erro: Um ou mais ingredientes selecionados são inválidos.' });
        }

        // Calcula o preço total SOMANDO o preço de cada produto encontrado.
        // **Importante:** Aquele BASE_PRICE de R$29,90 do HTML original não está sendo usado aqui.
        // Estamos calculando o preço *real* baseado nos itens. Se precisar de uma taxa base,
        // podemos adicionar depois!
        const precoTotal = produtosDoMix.reduce((total, produto) => total + parseFloat(produto.preco), 0);
        console.log("Preço Total Calculado:", precoTotal);

        // --- 5. Inserir na Tabela 'mixes' ---
        // Por enquanto, não estamos associando a um usuário (usuario_id = NULL)
        const [mixResult] = await connection.execute(
            'INSERT INTO mixes (nome_mix, preco_total, usuario_id) VALUES (?, ?, ?)',
            [nomeMix, precoTotal, null] // Usando null para usuario_id
        );
        const novoMixId = mixResult.insertId; // Pega o ID do mix que acabamos de criar
        console.log("Mix inserido com ID:", novoMixId);

        // --- 6. Inserir na Tabela 'mix_produtos' ---
        // Prepara os dados para inserir todos os ingredientes de uma vez (mais eficiente)
        const mixProdutosData = produtosDoMix.map(produto => [novoMixId, produto.id]);

        // Cria a query para inserir múltiplos valores
        const insertProdutosQuery = 'INSERT INTO mix_produtos (mix_id, produto_id) VALUES ?';
        await connection.query(insertProdutosQuery, [mixProdutosData]);
        console.log("Ingredientes do mix inseridos.");

        // --- 7. Confirmar a Transação ---
        // Se chegamos até aqui sem erros, podemos confirmar todas as operações.
        await connection.commit();
        console.log("Transação confirmada (commit).");

        // --- 8. Enviar Resposta de Sucesso ---
        res.status(201).json({
            message: 'Mix personalizado criado com sucesso!',
            mixId: novoMixId,
            nome: nomeMix,
            preco: precoTotal,
            ingredientes: produtosDoMix.map(p => p.nome) // Devolve os nomes para confirmação
        });

    } catch (error) {
        // --- Tratamento de Erro ---
        console.error('Erro no servidor ao tentar salvar o mix:', error);
        // Se a conexão foi aberta e deu erro, cancelamos a transação
        if (connection) {
            console.log("Erro detectado, cancelando transação (rollback).");
            await connection.rollback();
        }
        res.status(500).json({ message: 'Erro interno no servidor ao tentar salvar o mix.' });

    } finally {
        // --- 9. Fechar Conexão ---
        // Independentemente de ter dado certo ou erro, fechamos a conexão.
        if (connection) {
            await connection.end();
            console.log("Conexão com o banco fechada.");
        }
    }
});

// ==========================================================
// 7. Rota para Listar todos os Produtos (`/api/produtos`)
// ==========================================================
app.get('/api/produtos', async (req, res) => {
    let connection;
    try {
        console.log("Recebida requisição para listar produtos.");
        connection = await mysql.createConnection(dbConfig);
        
        // Query para buscar todos os produtos que estão disponíveis para venda, em ordem alfabética.
        const [produtos] = await connection.execute(
            'SELECT * FROM produtos WHERE disponivel_venda = TRUE ORDER BY nome ASC'
        );
        
        // Envia a lista de produtos como resposta em formato JSON
        res.status(200).json(produtos);

    } catch (error) {
        console.error('Erro no servidor ao tentar listar produtos:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

// Adicionar em backend/server.js

// ==========================================================
// 8. Rota para Listar produtos disponíveis para o MIX
// ==========================================================
app.get('/api/produtos-mix', async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        
        // Query para buscar apenas os produtos marcados como 'disponivel_mix = TRUE'
        const [ingredientes] = await connection.execute(
            'SELECT * FROM produtos WHERE disponivel_mix = TRUE ORDER BY categoria, nome'
        );
        
        res.status(200).json(ingredientes);

    } catch (error) {
        console.error('Erro no servidor ao tentar listar ingredientes do mix:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

// ==========================================================
// 9. Rota para Buscar um Produto por ID (`/api/produtos/:id`)
// ==========================================================
app.get('/api/produtos/:id', async (req, res) => {
    const productId = req.params.id; // Pega o ID do produto da URL

    // Validação básica do ID
    if (!productId || isNaN(productId)) {
        return res.status(400).json({ message: 'ID do produto inválido.' });
    }

    let connection;
    try {
        console.log(`Recebida requisição para produto com ID: ${productId}`);
        connection = await mysql.createConnection(dbConfig);

        const [rows] = await connection.execute(
            'SELECT * FROM produtos WHERE id = ?',
            [productId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }

        // Retorna o primeiro produto encontrado (deve ser único pelo ID)
        res.status(200).json(rows[0]);

    } catch (error) {
        console.error(`Erro no servidor ao buscar produto com ID ${productId}:`, error);
        res.status(500).json({ message: 'Erro interno no servidor ao buscar o produto.' });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

// 10. Iniciar o Servidor
app.listen(apiPort, () => {
    console.log(`Servidor backend NaturalBlu rodando em http://localhost:${apiPort}`);
    console.log(`Endpoint de cadastro disponível em POST http://localhost:${apiPort}/api/register`);
});