const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// ✅ NO RENDER: Servir arquivos estáticos da forma correta
app.use(express.static(path.join(__dirname, "../frontend")));

// ✅ Health Check para Render (MANTENHA)
app.get("/health", (req, res) => {
    res.status(200).json({ 
        status: "OK", 
        timestamp: new Date().toISOString(),
        service: "RSVP API",
        environment: process.env.NODE_ENV || 'production'
    });
});

// ✅ Rota de teste da API
app.get("/api/test", (req, res) => {
    res.json({ 
        message: "API está funcionando no Render!", 
        timestamp: new Date().toISOString()
    });
});

// ✅ Rotas principais - CORRIGIDAS PARA RENDER
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

app.get("/presente", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/presente.html"));
});

app.get("/respostas", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/respostas.html"));
});

// 📌 Rota para listar confirmações (MANTENHA)
app.get("/api/rsvp", (req, res) => {
    console.log("📥 GET /api/rsvp - Buscando confirmações...");
    
    db.all(`SELECT * FROM rsvp ORDER BY created_at DESC`, [], (err, rows) => {
        if (err) {
            console.error("❌ Erro ao buscar dados:", err);
            return res.status(500).json({ 
                error: "Erro interno ao buscar confirmações."
            });
        }
        
        console.log(`✅ Retornando ${rows.length} confirmações`);
        res.json(rows);
    });
});

// 📌 Rota para salvar RSVP (MANTENHA)
app.post("/api/rsvp", (req, res) => {
    const { name, contact, attending, message } = req.body;

    console.log("📥 POST /api/rsvp - Recebendo RSVP:", { name, contact, attending });

    if (!name?.trim() || !contact?.trim() || !attending?.trim()) {
        return res.status(400).json({ 
            error: "Campos obrigatórios faltando." 
        });
    }

    db.run(
        `INSERT INTO rsvp (name, contact, attending, message) VALUES (?, ?, ?, ?)`,
        [name.trim(), contact.trim(), attending.trim(), message?.trim() || ""],
        function(err) {
            if (err) {
                console.error("❌ Erro ao salvar no banco:", err);
                return res.status(500).json({ 
                    error: "Erro interno do servidor." 
                });
            }
            
            console.log(`✅ RSVP salvo com ID: ${this.lastID}`);
            res.json({ 
                success: true, 
                message: "Confirmação registrada com sucesso!",
                id: this.lastID 
            });
        }
    );
});

// ✅ Middleware de erro 404 para API
app.use("/api/*", (req, res) => {
    res.status(404).json({ 
        error: "Rota da API não encontrada",
        path: req.originalUrl
    });
});

// ✅ Servir frontend para outras rotas
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// 📌 Iniciar servidor
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📍 Ambiente: ${process.env.NODE_ENV || 'production'}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`📍 API Test: http://localhost:${PORT}/api/test`);
});

module.exports = app;
