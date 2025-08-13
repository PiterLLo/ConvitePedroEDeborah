const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "../frontend")));

// 📌 Rota para salvar RSVP
app.post("/api/rsvp", (req, res) => {
    const { name, contact, attending, message } = req.body;

    if (!name?.trim() || !contact?.trim() || !attending?.trim()) {
        return res.status(400).json({ error: "Campos obrigatórios faltando" });
    }

    db.run(
        `INSERT INTO rsvp (name, contact, attending, message) VALUES (?, ?, ?, ?)`,
        [name.trim(), contact.trim(), attending.trim(), message?.trim() || ""],
        (err) => {
            if (err) {
                console.error("Erro ao salvar no banco:", err);
                return res.status(500).json({ error: "Erro ao salvar no banco" });
            }
            res.json({ success: true, message: "Confirmação registrada com sucesso!" });
        }
    );
});

// 📌 Rota para listar confirmações
app.get("/api/rsvp", (req, res) => {
    db.all(`SELECT * FROM rsvp ORDER BY created_at DESC`, [], (err, rows) => {
        if (err) {
            console.error("Erro ao buscar dados:", err);
            return res.status(500).json({ error: "Erro ao buscar dados" });
        }
        console.log("RSVPs retornados:", rows); // 🔍 para depuração
        res.json(rows);
    });
});

// 📌 Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
