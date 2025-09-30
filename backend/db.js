const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

// No Render, usar caminho absoluto
const dbPath = path.join(__dirname, "rsvp.db");

console.log("📁 Iniciando banco de dados em:", dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("❌ Erro ao conectar ao banco:", err);
    } else {
        console.log("✅ Banco SQLite conectado com sucesso");
        
        // Criar tabela se não existir
        db.run(`
            CREATE TABLE IF NOT EXISTS rsvp (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                contact TEXT NOT NULL,
                attending TEXT NOT NULL,
                message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) {
                console.error("❌ Erro ao criar tabela:", err);
            } else {
                console.log("✅ Tabela rsvp verificada/criada com sucesso");
                
                // Verificar se existem dados
                db.get("SELECT COUNT(*) as count FROM rsvp", (err, row) => {
                    if (!err) {
                        console.log(`📊 Total de registros na tabela: ${row.count}`);
                    }
                });
            }
        });
    }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('✅ Conexão com o banco fechada.');
        process.exit(0);
    });
});

module.exports = db;
