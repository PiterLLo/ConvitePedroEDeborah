const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ DEBUG: Log para verificar se o servidor está iniciando
console.log("🔄 Iniciando servidor no Render...");
console.log("📁 Diretório atual:", __dirname);
console.log("📍 Process CWD:", process.cwd());

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// ✅ CORRIGIDO: Caminho absoluto para o frontend
app.use(express.static(path.join(__dirname, "../frontend")));

// ✅ Health Check
app.get("/health", (req, res) => {
    console.log("✅ Health check acessado");
    res.status(200).json({ 
        status: "OK", 
        timestamp: new Date().toISOString(),
        message: "Servidor funcionando com better-sqlite3!",
        environment: process.env.NODE_ENV || 'development'
    });
});

// ✅ Rota de teste da API
app.get("/api/test", (req, res) => {
    console.log("✅ /api/test acessada com sucesso!");
    res.json({ 
        message: "API está funcionando!", 
        timestamp: new Date().toISOString(),
        database: "better-sqlite3"
    });
});

// 📌 Rota para listar confirmações - ATUALIZADA COM better-sqlite3
app.get("/api/rsvp", (req, res) => {
    console.log("📥 GET /api/rsvp - Buscando confirmações...");
    
    try {
        const stmt = db.prepare("SELECT * FROM rsvp ORDER BY created_at DESC");
        const rows = stmt.all();
        
        console.log(`✅ Retornando ${rows.length} confirmações`);
        res.json(rows);
    } catch (err) {
        console.error("❌ Erro ao buscar dados:", err);
        res.status(500).json({ 
            error: "Erro interno ao buscar confirmações.",
            details: process.env.NODE_ENV === 'production' ? undefined : err.message
        });
    }
});

// 📌 Rota para salvar RSVP - ATUALIZADA COM better-sqlite3
app.post("/api/rsvp", (req, res) => {
    const { name, contact, attending, message } = req.body;

    console.log("📥 POST /api/rsvp - Dados recebidos:", { 
        name, 
        contact, 
        attending, 
        message,
        body: req.body
    });

    // Validação
    if (!name?.trim() || !contact?.trim() || !attending?.trim()) {
        console.log("❌ Validação falhou - campos obrigatórios faltando");
        return res.status(400).json({ 
            error: "Campos obrigatórios faltando: nome, contato e confirmação são obrigatórios." 
        });
    }

    try {
        const stmt = db.prepare(
            "INSERT INTO rsvp (name, contact, attending, message) VALUES (?, ?, ?, ?)"
        );
        
        const result = stmt.run(
            name.trim(), 
            contact.trim(), 
            attending.trim(), 
            message?.trim() || ""
        );
        
        console.log(`✅ RSVP salvo com ID: ${result.lastInsertRowid}`);
        res.json({ 
            success: true, 
            message: "Confirmação registrada com sucesso! Obrigado!",
            id: result.lastInsertRowid 
        });
    } catch (err) {
        console.error("❌ Erro ao salvar no banco:", err);
        res.status(500).json({ 
            error: "Erro interno do servidor ao salvar confirmação.",
            details: process.env.NODE_ENV === 'production' ? undefined : err.message
        });
    }
});

// 📌 Rota para estatísticas - ATUALIZADA COM better-sqlite3
app.get("/api/stats", (req, res) => {
    try {
        const totalStmt = db.prepare("SELECT COUNT(*) as total FROM rsvp");
        const yesStmt = db.prepare("SELECT COUNT(*) as count FROM rsvp WHERE attending = 'yes'");
        const noStmt = db.prepare("SELECT COUNT(*) as count FROM rsvp WHERE attending = 'no'");
        
        const total = totalStmt.get().total;
        const confirmados = yesStmt.get().count;
        const nao_confirmados = noStmt.get().count;
        
        res.json({ total, confirmados, nao_confirmados });
    } catch (err) {
        console.error("Erro ao buscar estatísticas:", err);
        res.status(500).json({ 
            error: "Erro ao buscar estatísticas",
            details: process.env.NODE_ENV === 'production' ? undefined : err.message
        });
    }
});

// ✅ Rotas para páginas HTML
app.get("/", (req, res) => {
    console.log("📄 Servindo index.html");
    res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

app.get("/presente", (req, res) => {
    console.log("📄 Servindo presente.html");
    res.sendFile(path.join(__dirname, "../frontend/presente.html"));
});

app.get("/respostas", (req, res) => {
    console.log("📄 Servindo respostas.html");
    res.sendFile(path.join(__dirname, "../frontend/respostas.html"));
});

// ✅ Middleware de logging
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
