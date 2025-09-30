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

// Servir arquivos estáticos da pasta frontend
app.use(express.static(path.join(__dirname, "../frontend")));

// ✅ Health Check para Render
app.get("/health", (req, res) => {
    res.status(200).json({ 
        status: "OK", 
        timestamp: new Date().toISOString(),
        service: "RSVP API",
        environment: process.env.NODE_ENV || 'development'
    });
});

// ✅ Rota de teste da API
app.get("/api/test", (req, res) => {
    res.json({ 
        message: "API está funcionando!", 
        timestamp: new Date().toISOString(),
        routes: {
            health: "/health",
            rsvp_get: "/api/rsvp (GET)",
            rsvp_post: "/api/rsvp (POST)",
            stats: "/api/stats"
        }
    });
});

// ✅ Rota principal
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "index.html"));
});

// ✅ Rota para página de presente
app.get("/presente", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "presente.html"));
});

// ✅ Rota admin para ver confirmações
app.get("/respostas", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "responsfas.html"));
});

// 📌 Rota para listar confirmações
app.get("/api/rsvp", (req, res) => {
    console.log("📥 GET /api/rsvp - Buscando confirmações...");
    
    db.all(`SELECT * FROM rsvp ORDER BY created_at DESC`, [], (err, rows) => {
        if (err) {
            console.error("❌ Erro ao buscar dados:", err);
            return res.status(500).json({ 
                error: "Erro interno ao buscar confirmações.",
                details: process.env.NODE_ENV === 'production' ? undefined : err.message
            });
        }
        
        console.log(`✅ Retornando ${rows.length} confirmações`);
        res.json(rows);
    });
});

// 📌 Rota para salvar RSVP
app.post("/api/rsvp", (req, res) => {
    const { name, contact, attending, message } = req.body;

    console.log("📥 POST /api/rsvp - Recebendo RSVP:", { name, contact, attending, message });

    // Validação
    if (!name?.trim() || !contact?.trim() || !attending?.trim()) {
        return res.status(400).json({ 
            error: "Campos obrigatórios faltando: nome, contato e confirmação são obrigatórios." 
        });
    }

    // Inserir no banco
    db.run(
        `INSERT INTO rsvp (name, contact, attending, message) VALUES (?, ?, ?, ?)`,
        [name.trim(), contact.trim(), attending.trim(), message?.trim() || ""],
        function(err) {
            if (err) {
                console.error("❌ Erro ao salvar no banco:", err);
                return res.status(500).json({ 
                    error: "Erro interno do servidor ao salvar confirmação." 
                });
            }
            
            console.log(`✅ RSVP salvo com ID: ${this.lastID}`);
            res.json({ 
                success: true, 
                message: "Confirmação registrada com sucesso! Obrigado!",
                id: this.lastID 
            });
        }
    );
});

// 📌 Rota para estatísticas
app.get("/api/stats", (req, res) => {
    db.all(`
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN attending = 'yes' THEN 1 ELSE 0 END) as confirmados,
            SUM(CASE WHEN attending = 'no' THEN 1 ELSE 0 END) as nao_confirmados
        FROM rsvp
    `, [], (err, rows) => {
        if (err) {
            console.error("Erro ao buscar estatísticas:", err);
            return res.status(500).json({ error: "Erro ao buscar estatísticas" });
        }
        
        res.json(rows[0] || { total: 0, confirmados: 0, nao_confirmados: 0 });
    });
});

// ✅ Middleware de logging para debug
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// ✅ Middleware de erro 404
app.use((req, res) => {
    console.log(`❌ Rota não encontrada: ${req.method} ${req.url}`);
    res.status(404).json({ 
        error: "Rota não encontrada",
        path: req.url,
        method: req.method
    });
});

// ✅ Middleware de tratamento de erros
app.use((err, req, res, next) => {
    console.error("💥 Erro não tratado:", err);
    res.status(500).json({ 
        error: "Erro interno do servidor",
        message: process.env.NODE_ENV === 'production' ? 'Algo deu errado!' : err.message
    });
});

// 📌 Iniciar servidor
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`📍 API Test: http://localhost:${PORT}/api/test`);
    console.log(`📍 Página principal: http://localhost:${PORT}/`);
    console.log(`📍 Admin: http://localhost:${PORT}/respostas`);
});

module.exports = app;
