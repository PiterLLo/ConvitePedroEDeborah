const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const db = new sqlite3.Database(path.join(__dirname, "rsvp.db"), (err) => {
    if (err) console.error("Erro ao conectar ao banco:", err);
    else console.log("Banco SQLite conectado.");
});

// Cria tabela nova com created_at, caso precise atualizar a tabela antiga
db.serialize(() => {
    // Cria tabela temporária com created_at
    db.run(`
      CREATE TABLE IF NOT EXISTS rsvp_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        contact TEXT NOT NULL,
        attending TEXT NOT NULL,
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Verifica se a tabela antiga existe
    db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='rsvp'`, (err, row) => {
        if (err) return console.error(err);

        if (row) {
            // Copia dados antigos para a nova tabela (sem created_at)
            db.run(`
              INSERT INTO rsvp_new (id, name, contact, attending, message)
              SELECT id, name, contact, attending, message FROM rsvp
            `, (err) => {
                if (err) return console.error(err);

                // Remove tabela antiga
                db.run(`DROP TABLE rsvp`, (err) => {
                    if (err) return console.error(err);

                    // Renomeia tabela nova para rsvp
                    db.run(`ALTER TABLE rsvp_new RENAME TO rsvp`, (err) => {
                        if (err) return console.error(err);
                        console.log("Tabela rsvp atualizada com created_at.");
                    });
                });
            });
        } else {
            console.log("Tabela rsvp já está atualizada.");
        }
    });
});

module.exports = db;
