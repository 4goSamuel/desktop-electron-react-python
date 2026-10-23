import { test } from "node:test";
import assert from "node:assert/strict";

import { STATUS, estadoInicial, tarefaReducer } from "../../src/state/tarefaReducer.js";

const evento = (tipo, payload = {}) => ({ tipo: "evento", evento: { tipo, payload } });
const rodar = (...acoes) => acoes.reduce(tarefaReducer, estadoInicial);

test("fluxo completo até concluído", () => {
    const e = rodar({ tipo: "iniciar" }, evento("iniciado", { total: 2 }), evento("progresso", { atual: 1, total: 2 }),
        evento("progresso", { atual: 2, total: 2 }), evento("finalizado", { motivo: "concluido" }));
    assert.equal(e.status, STATUS.CONCLUIDO);
    assert.equal(e.atual, 2);
});

test("parada cooperativa termina como cancelado", () => {
    const e = rodar({ tipo: "iniciar" }, evento("iniciado", { total: 5 }), { tipo: "parar" },
        evento("cancelamento_solicitado"), evento("finalizado", { motivo: "cancelado" }));
    assert.equal(e.status, STATUS.CANCELADO);
});

test("processo encerrado sem aviso vira erro", () => {
    const e = rodar({ tipo: "iniciar" }, evento("iniciado", { total: 5 }),
        evento("processo_backend_encerrado", { codigo: 1, esperado: false }));
    assert.equal(e.status, STATUS.ERRO);
    assert.match(e.erro, /inesperadamente/);
});

test("encerramento do processo depois de concluir não muda o status", () => {
    const e = rodar({ tipo: "iniciar" }, evento("iniciado", { total: 1 }), evento("finalizado", { motivo: "concluido" }),
        evento("processo_backend_encerrado", { codigo: 0, esperado: false }));
    assert.equal(e.status, STATUS.CONCLUIDO);
});

test("falha ao iniciar e parar sem tarefa", () => {
    assert.equal(rodar({ tipo: "iniciar" }, { tipo: "falha_ao_iniciar", erro: "x" }).status, STATUS.ERRO);
    assert.equal(rodar({ tipo: "parar" }).status, STATUS.PARADO);
});

test("log é limitado a 200 linhas", () => {
    let e = rodar({ tipo: "iniciar" });
    for (let i = 1; i <= 300; i++) e = tarefaReducer(e, evento("progresso", { atual: i, total: 300 }));
    assert.equal(e.log.length, 200);
});
