// 1. Importar os módulos necessários
require('dotenv').config(); // Carrega as variáveis do arquivo .env para process.env - FAÇA ISSO PRIMEIRO!

const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const cors = require('cors');

// 2. Configurações iniciais
const app = express();
// Usa a porta definida no .env ou 3000 como padrão
const apiPort = process.env.API_PORT || 3000; 

// 3. Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// 6. Iniciar o Servidor
app.listen(apiPort, () => {
    console.log(`Servidor backend NaturalBlu rodando em http://localhost:${apiPort}`);
    console.log(`Endpoint de cadastro disponível em POST http://localhost:${apiPort}/api/register`);
});