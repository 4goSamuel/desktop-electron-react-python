// Lógica pura da comunicação com o backend Python — sem depender do
// Electron, para poder ser testada com `node --test`.

import path from "node:path";

export const PREFIXO_EVENTO = "@@EVENT@@";

// Classifica uma linha do stdout do backend.
export function interpretarLinha(linha) {

    const texto = linha.trim();

    if (!texto) {
        return { tipo: "vazia" };
    }

    if (!texto.startsWith(PREFIXO_EVENTO)) {
        return { tipo: "log", texto };
    }

    try {
        return {
            tipo: "evento",
            evento: JSON.parse(texto.slice(PREFIXO_EVENTO.length)),
        };
    } catch (erro) {
        return { tipo: "invalida", texto, erro: erro.message };
    }

}

// O stdout chega em pedaços arbitrários; este leitor só entrega linhas
// completas. Chame `finalizar()` quando o processo terminar.
export function criarLeitorDeLinhas(aoReceberLinha) {

    let buffer = "";

    return {

        receber(pedaco) {
            buffer += pedaco;
            const linhas = buffer.split(/\r?\n/);
            buffer = linhas.pop();
            for (const linha of linhas) {
                aoReceberLinha(linha);
            }
        },

        finalizar() {
            if (buffer) {
                aoReceberLinha(buffer);
                buffer = "";
            }
        },

    };

}

// Comando para iniciar o backend em desenvolvimento. A variável de
// ambiente PYTHON permite escolher o interpretador (ex.: um venv).
export function resolverComandoBackend({
    raizProjeto,
    plataforma = process.platform,
    env = process.env,
    etapas,
    intervalo,
}) {

    const python = env.PYTHON || (plataforma === "win32" ? "python" : "python3");

    const args = ["-u", "main.py"];

    if (etapas !== undefined) {
        args.push("--etapas", String(etapas));
    }

    if (intervalo !== undefined) {
        args.push("--intervalo", String(intervalo));
    }

    return {
        comando: python,
        args,
        cwd: path.join(raizProjeto, "backend"),
    };

}

// Valida as opções vindas da interface antes de repassá-las ao Python.
export function validarOpcoes(opcoes = {}) {

    const etapas = Number(opcoes.etapas ?? 10);
    const intervalo = Number(opcoes.intervalo ?? 0.5);

    if (!Number.isInteger(etapas) || etapas < 1 || etapas > 1000) {
        return { ok: false, erro: "Etapas deve ser um inteiro entre 1 e 1000." };
    }

    if (!Number.isFinite(intervalo) || intervalo < 0 || intervalo > 60) {
        return { ok: false, erro: "Intervalo deve estar entre 0 e 60 segundos." };
    }

    return { ok: true, etapas, intervalo };

}
