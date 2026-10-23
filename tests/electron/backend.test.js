import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

import {
    PREFIXO_EVENTO,
    criarLeitorDeLinhas,
    interpretarLinha,
    resolverComandoBackend,
    validarOpcoes,
} from "../../electron/backend.js";

test("interpretarLinha reconhece eventos, logs e linhas inválidas", () => {
    const evento = interpretarLinha(`${PREFIXO_EVENTO}{"tipo":"progresso","payload":{"atual":1}}`);
    assert.equal(evento.tipo, "evento");
    assert.equal(evento.evento.payload.atual, 1);

    assert.deepEqual(interpretarLinha("  texto qualquer "), { tipo: "log", texto: "texto qualquer" });
    assert.equal(interpretarLinha("   ").tipo, "vazia");
    assert.equal(interpretarLinha(`${PREFIXO_EVENTO}{quebrado`).tipo, "invalida");
});

test("criarLeitorDeLinhas junta pedaços e só entrega linhas completas", () => {
    const linhas = [];
    const leitor = criarLeitorDeLinhas((l) => linhas.push(l));
    leitor.receber("pri");
    leitor.receber("meira\r\nsegu");
    assert.deepEqual(linhas, ["primeira"]);
    leitor.receber("nda\nterc");
    assert.deepEqual(linhas, ["primeira", "segunda"]);
    leitor.finalizar();
    assert.deepEqual(linhas, ["primeira", "segunda", "terc"]);
});

test("resolverComandoBackend escolhe o Python por plataforma e respeita PYTHON", () => {
    const raiz = path.join("projeto");
    const win = resolverComandoBackend({ raizProjeto: raiz, plataforma: "win32", env: {} });
    assert.equal(win.comando, "python");
    assert.equal(win.cwd, path.join(raiz, "backend"));
    assert.deepEqual(win.args, ["-u", "main.py"]);

    const linux = resolverComandoBackend({ raizProjeto: raiz, plataforma: "linux", env: {}, etapas: 5, intervalo: 0.1 });
    assert.equal(linux.comando, "python3");
    assert.deepEqual(linux.args, ["-u", "main.py", "--etapas", "5", "--intervalo", "0.1"]);

    const venv = resolverComandoBackend({ raizProjeto: raiz, env: { PYTHON: "/venv/bin/python" } });
    assert.equal(venv.comando, "/venv/bin/python");
});

test("validarOpcoes aplica padrões e rejeita valores fora do intervalo", () => {
    assert.deepEqual(validarOpcoes(), { ok: true, etapas: 10, intervalo: 0.5 });
    assert.equal(validarOpcoes({ etapas: 0 }).ok, false);
    assert.equal(validarOpcoes({ etapas: 2.5 }).ok, false);
    assert.equal(validarOpcoes({ intervalo: -1 }).ok, false);
    assert.equal(validarOpcoes({ etapas: "abc" }).ok, false);
});
