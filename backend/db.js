const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const db = new sqlite3.Database(path.join(__dirname, "rsvp.db"), (err) => {
  if (err) console.error("Erro ao conectar ao banco:", err);
  else console.log("Banco SQLite conectado.");
});

db.serialize(() => {
  // Cria tabela definitiva já com created_at
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
    if (err) return console.error("Erro ao criar tabela:", err);

    // Checa se a coluna created_at já existe
    db.all(`PRAGMA table_info(rsvp)`, (err, columns) => {
      if (err) return console.error("Erro ao inspecionar tabela:", err);

      const hasCreatedAt = columns.some(col => col.name === "created_at");
      if (!hasCreatedAt) {
        console.log("Tabela antiga detectada. Migrando dados...");

        db.serialize(() => {
          db.run(`
            CREATE TABLE rsvp_new (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT NOT NULL,
              contact TEXT NOT NULL,
              attending TEXT NOT NULL,
              message TEXT,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);

          db.run(`
            INSERT INTO rsvp_new (id, name, contact, attending, message)
            SELECT id, name, contact, attending, message FROM rsvp
          `, (err) => {
            if (err) return console.error("Erro ao migrar dados:", err);

            db.run(`DROP TABLE rsvp`);
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
});

module.exports = db;
