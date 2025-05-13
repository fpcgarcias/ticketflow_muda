// Carregar variáveis de ambiente PRIMEIRO!
import dotenv from "dotenv";
dotenv.config();

// --- DEBUG --- 
console.log('DEBUG: Após dotenv.config()');
console.log('DEBUG: DATABASE_URL:', process.env.DATABASE_URL);
console.log('DEBUG: PORT:', process.env.PORT);
// --- FIM DEBUG ---

import express, { type Request, Response, NextFunction } from "express";
import { setupVite, serveStatic, log } from "./vite";
import { migrateDepartmentsToJunctionTable } from "./migrate-departments";
import { migrateActiveField } from "./migrate-active-field";
import session from "express-session";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from 'url';
import http from 'http'; // Importar http

// Calcular __dirname para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Para garantir que temos um secret único a cada inicialização
const generateSecret = () => crypto.randomBytes(32).toString('hex');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Criar o servidor HTTP ANTES de setupVite
const server = http.createServer(app);

// Inicializar serviço de notificações 
const notificationService = {
  initialize: () => {
    console.log('Serviço de notificações inicializado');
    
    // Verificar se há usuários órfãos no sistema
    setTimeout(async () => {
      try {
        const { findOrphanSupportUsers } = await import('./clean-orphan-users');
        const orphanUsers = await findOrphanSupportUsers();
        
        if (orphanUsers.length > 0) {
          console.log(`Aviso: Foram encontrados ${orphanUsers.length} usuários de suporte sem registro de atendente.`);
          console.log('Para corrigir, execute a função fixAllOrphanSupportUsers() do módulo clean-orphan-users.');
        }
      } catch (error) {
        console.error('Erro ao verificar usuários órfãos:', error);
      }
    }, 5000); // Aguardar 5 segundos para não atrapalhar a inicialização
  }
};

// Inicializar serviço
notificationService.initialize();

// Configurar a sessão
app.use(session({
  secret: process.env.SESSION_SECRET || generateSecret(),
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Desativando secure para permitir cookies em HTTP
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 1 dia
  }
}));

// Declarar tipos para sessão
declare module 'express-session' {
  interface SessionData {
    userId?: number;
    userRole?: 'admin' | 'support' | 'customer';
  }
}

// Manter o middleware de log
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// // Servir arquivos estáticos - Usar o __dirname calculado
// app.use(express.static(path.join(__dirname, "public"))); // Comentar ou remover esta linha

// Função start agora configura tudo
const start = async () => {
  try {
    console.log("Iniciando o servidor...");
    
    // Importar dinamicamente DEPOIS de dotenv.config()
    const { registerRoutes } = await import("./routes");
    const { migratePasswords } = await import("./migrate-passwords");

    // 1. Registrar rotas da API PRIMEIRO
    await registerRoutes(app);
    
    // 2. Configurar o Vite DEPOIS das rotas da API
    await setupVite(app, server);
    
    // 3. Executar migrações
    console.log("Executando migrações...");
    await migratePasswords();
    
    // 4. Iniciar servidor na porta especificada
    const PORT = process.env.PORT || 5173; 
    server.listen(PORT, () => { // Usar a instância 'server' criada anteriormente
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error("Erro ao iniciar o servidor:", error);
    process.exit(1);
  }
};

start();
