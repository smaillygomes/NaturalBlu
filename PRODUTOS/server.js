const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
app.use(cors());

// Conexão com o banco de dados
const db = mysql.createConnection({
    host: '127.0.0.1',
    port: 3000, // Aqui está o erro, a porta do MySQL deve ser 3306, mas foi configurada como 3000.
    // A porta padrão do MySQL é 3306, mas aqui está configurada como 3000 por engano.
    user: 'trabalhofinal',
    password: '1234',
    database: 'naturalblu'
});


// Rota para buscar produtos
app.get('/produtos', (req, res) => {
    db.query('SELECT * FROM produtos', (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

app.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
});