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
console.log("📍 Tentando acessar frontend:", path.join(__dirname, "../frontend"));

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
        directory: __dirname,
        message: "Servidor funcionando com estrutura atual!"
    });
});

// ✅ Rota de teste da API - SIMPLES
app.get("/api/test", (req, res) => {
    console.log("✅ /api/test acessada com sucesso!");
    res.json({ 
        message: "API está funcionando!", 
        timestamp: new Date().toISOString(),
        structure: "backend/frontend mantida"
    });
});

// 📌 Rota para listar confirmações - COM MAIS LOGS
app.get("/api/rsvp", (req, res) => {
    console.log("📥 GET /api/rsvp - Buscando confirmações...");
    console.log("📍 Headers:", req.headers);
    
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

// ✅ Rotas para páginas HTML - CORRIGIDAS
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

// ✅ Middleware de logging para todas as requisições
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// ✅ Rota catch-all para debug
app.get("*", (req, res) => {
    console.log(`❌ Rota não encontrada: ${req.method} ${req.url}`);
    res.status(404).json({ 
        error: "Rota não encontrada",
        path: req.url,
        method: req.method,
        timestamp: new Date().toISOString()
    });
});

// 📌 Iniciar servidor
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📍 Estrutura mantida: backend/frontend`);
    console.log(`📍 Health: https://convitepedroedeborah.onrender.com/health`);
    console.log(`📍 API Test: https://convitepedroedeborah.onrender.com/api/test`);
    console.log(`📍 RSVP API: https://convitepedroedeborah.onrender.com/api/rsvp`);
});
