// Estado da tarefa do backend, derivado exclusivamente dos eventos
// recebidos. Função pura: não depende de React nem do Electron.

export const STATUS = {
    PARADO: "parado",
    INICIANDO: "iniciando",
    EXECUTANDO: "executando",
    PARANDO: "parando",
    CONCLUIDO: "concluido",
    CANCELADO: "cancelado",
    ERRO: "erro",
};

export const estadoInicial = {
    status: STATUS.PARADO,
    atual: 0,
    total: 0,
    erro: null,
    log: [],
};

const LIMITE_LOG = 200;

function registrar(estado, texto) {
    return [...estado.log, texto].slice(-LIMITE_LOG);
}

export function tarefaReducer(estado, acao) {

    switch (acao.tipo) {

        case "iniciar":
            return { ...estadoInicial, status: STATUS.INICIANDO, log: ["Iniciando backend..."] };

        case "falha_ao_iniciar":
            return { ...estado, status: STATUS.ERRO, erro: acao.erro, log: registrar(estado, `Erro: ${acao.erro}`) };

        case "parar":
            if (estado.status !== STATUS.EXECUTANDO && estado.status !== STATUS.INICIANDO) {
                return estado;
            }
            return { ...estado, status: STATUS.PARANDO, log: registrar(estado, "Parada solicitada...") };

        case "evento":
            return aplicarEvento(estado, acao.evento);

        default:
            return estado;

    }

}

function aplicarEvento(estado, evento) {

    const payload = evento?.payload ?? {};

    switch (evento?.tipo) {

        case "iniciado":
            return { ...estado, status: STATUS.EXECUTANDO, total: payload.total ?? 0, log: registrar(estado, `Tarefa iniciada (${payload.total} etapas).`) };

        case "progresso":
            return { ...estado, atual: payload.atual, total: payload.total, log: registrar(estado, `Etapa ${payload.atual}/${payload.total}`) };

        case "cancelamento_solicitado":
            return { ...estado, status: STATUS.PARANDO };

        case "finalizado": {
            const cancelado = payload.motivo === "cancelado";
            return {
                ...estado,
                status: cancelado ? STATUS.CANCELADO : STATUS.CONCLUIDO,
                log: registrar(estado, cancelado ? "Tarefa cancelada." : "Tarefa concluída."),
            };
        }

        case "erro_fatal":
            return { ...estado, status: STATUS.ERRO, erro: payload.mensagem, log: registrar(estado, `Erro: ${payload.mensagem}`) };

        case "processo_backend_encerrado": {
            // Se o processo saiu sem avisar o fim, trata como falha.
            const emAndamento = [STATUS.INICIANDO, STATUS.EXECUTANDO, STATUS.PARANDO].includes(estado.status);
            if (emAndamento && !payload.esperado) {
                const erro = `O backend encerrou inesperadamente (código ${payload.codigo}).`;
                return { ...estado, status: STATUS.ERRO, erro, log: registrar(estado, erro) };
            }
            if (emAndamento) {
                return { ...estado, status: STATUS.CANCELADO, log: registrar(estado, "Backend encerrado.") };
            }
            return estado;
        }

        default:
            return estado;

    }

}
