import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

import {
    criarLeitorDeLinhas,
    interpretarLinha,
    resolverComandoBackend,
    validarOpcoes,
} from "./backend.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAIZ_PROJETO = path.join(__dirname, "..");

// Tempo para o backend encerrar sozinho depois do STOP antes do
// encerramento forçado.
const PARAR_TIMEOUT_MS = 8000;

const URL_DEV = process.env.VITE_DEV_SERVER_URL || "http://localhost:5173";

let janelaPrincipal = null;
let processoBackend = null;

// true quando o encerramento foi pedido por nós (botão Parar ou saída
// do app) — enviado à interface só como informação.
let saidaEsperada = false;

// Evita repetir STOP/timeouts se o usuário clicar em Parar várias vezes.
let promessaParada = null;

// Evita loop ao chamar app.quit() dentro de "before-quit".
let encerrandoApp = false;

function enviarParaInterface(canal, dados) {

    if (janelaPrincipal && !janelaPrincipal.isDestroyed()) {
        janelaPrincipal.webContents.send(canal, dados);
    }

}

function tratarLinha(linha) {

    const resultado = interpretarLinha(linha);

    if (resultado.tipo === "evento") {
        enviarParaInterface("backend-evento", resultado.evento);
    } else if (resultado.tipo === "log") {
        console.log("[backend]", resultado.texto);
    } else if (resultado.tipo === "invalida") {
        console.error("Evento inválido do backend:", resultado.erro, resultado.texto);
    }

}

function criarJanela() {

    janelaPrincipal = new BrowserWindow({

        width: 960,
        height: 680,
        minWidth: 720,
        minHeight: 520,
        center: true,

        // Igual a --bg-primary: evita flash branco no carregamento.
        backgroundColor: "#0f1117",

        // Barra de título própria (componente TitleBar).
        frame: false,
        titleBarStyle: "hidden",
        autoHideMenuBar: true,

        webPreferences: {
            preload: path.join(__dirname, "preload.cjs"),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
        },

    });

    janelaPrincipal.on("maximize", () => {
        enviarParaInterface("janela-estado", { maximizada: true });
    });

    janelaPrincipal.on("unmaximize", () => {
        enviarParaInterface("janela-estado", { maximizada: false });
    });

    if (app.isPackaged) {
        janelaPrincipal.loadFile(path.join(RAIZ_PROJETO, "dist", "index.html"));
    } else {
        janelaPrincipal.loadURL(URL_DEV);
    }

}

function iniciarBackend(opcoes) {

    if (processoBackend) {
        return { ok: false, erro: "Uma tarefa já está em execução." };
    }

    const validacao = validarOpcoes(opcoes);

    if (!validacao.ok) {
        return validacao;
    }

    const { comando, args, cwd } = resolverComandoBackend({
        raizProjeto: RAIZ_PROJETO,
        etapas: validacao.etapas,
        intervalo: validacao.intervalo,
    });

    saidaEsperada = false;

    try {
        processoBackend = spawn(comando, args, { cwd });
    } catch (erro) {
        processoBackend = null;
        return { ok: false, erro: erro.message };
    }

    const processo = processoBackend;
    const leitor = criarLeitorDeLinhas(tratarLinha);

    processo.stdout.setEncoding("utf8");
    processo.stdout.on("data", (pedaco) => leitor.receber(pedaco));

    processo.stderr.on("data", (pedaco) => {
        console.error("[backend]", pedaco.toString());
    });

    // Escrever no stdin de um processo que já saiu gera erro — ignorado.
    processo.stdin.on("error", () => {});

    processo.on("error", (erro) => {
        // Ex.: Python não encontrado no PATH.
        enviarParaInterface("backend-evento", {
            tipo: "erro_fatal",
            timestamp: new Date().toISOString(),
            payload: { mensagem: `Não foi possível iniciar o Python (${comando}): ${erro.message}` },
        });
    });

    processo.on("close", (codigo, sinal) => {

        leitor.finalizar();

        if (processoBackend === processo) {
            processoBackend = null;
        }

        enviarParaInterface("backend-evento", {
            tipo: "processo_backend_encerrado",
            timestamp: new Date().toISOString(),
            payload: { codigo, sinal, esperado: saidaEsperada },
        });

        saidaEsperada = false;

    });

    return { ok: true };

}

function pararBackend() {

    if (!processoBackend) {
        return Promise.resolve({ ok: true });
    }

    if (promessaParada) {
        return promessaParada;
    }

    const processo = processoBackend;
    saidaEsperada = true;

    promessaParada = new Promise((resolve) => {

        let finalizado = false;

        const forcar = () => {
            if (!finalizado) {
                try {
                    processo.kill("SIGKILL");
                } catch (erro) {
                    console.error("Erro ao encerrar o backend:", erro);
                }
            }
        };

        const timeout = setTimeout(forcar, PARAR_TIMEOUT_MS);

        processo.once("close", () => {
            finalizado = true;
            clearTimeout(timeout);
            resolve({ ok: true });
        });

        try {
            processo.stdin.write("STOP\n");
        } catch {
            clearTimeout(timeout);
            forcar();
        }

    }).finally(() => {
        promessaParada = null;
    });

    return promessaParada;

}

function comTratamento(acao) {

    return () => {
        try {
            return { ok: true, ...(acao() || {}) };
        } catch (erro) {
            return { ok: false, erro: erro.message };
        }
    };

}

ipcMain.handle("tarefa-iniciar", (_evento, opcoes) => iniciarBackend(opcoes));
ipcMain.handle("tarefa-parar", () => pararBackend());

ipcMain.handle("janela-minimizar", comTratamento(() => {
    janelaPrincipal?.minimize();
}));

ipcMain.handle("janela-maximizar-restaurar", comTratamento(() => {
    if (janelaPrincipal?.isMaximized()) {
        janelaPrincipal.unmaximize();
    } else {
        janelaPrincipal?.maximize();
    }
    return { maximizada: janelaPrincipal?.isMaximized() ?? false };
}));

ipcMain.handle("janela-fechar", comTratamento(() => {
    janelaPrincipal?.close();
}));

ipcMain.handle("janela-esta-maximizada", comTratamento(() => ({
    maximizada: janelaPrincipal?.isMaximized() ?? false,
})));

app.whenReady().then(criarJanela);

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

// Garante que o backend não fique órfão quando o app fecha.
app.on("before-quit", (evento) => {

    if (encerrandoApp || !processoBackend) {
        return;
    }

    evento.preventDefault();
    encerrandoApp = true;

    pararBackend().finally(() => app.quit());

});
