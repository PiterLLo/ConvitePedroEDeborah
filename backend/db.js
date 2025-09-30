const Database = require('better-sqlite3');
const path = require('path');

// Conectar ao banco (será criado automaticamente se não existir)
const dbPath = process.env.NODE_ENV === 'production' 
    ? path.join(__dirname, 'rsvp.db')
    : path.join(__dirname, 'rsvp.db');

const db = new Database(dbPath);

// Criar tabela se não existir
db.exec(`
    CREATE TABLE IF NOT EXISTS rsvp (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        contact TEXT NOT NULL,
        attending TEXT NOT NULL,
        message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

console.log("✅ Banco de dados SQLite conectado e tabela verificada");
console.log("📍 Caminho do banco:", dbPath);

module.exports = db;
