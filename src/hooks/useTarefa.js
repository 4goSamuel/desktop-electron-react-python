import { useCallback, useEffect, useReducer } from "react";

import { STATUS, estadoInicial, tarefaReducer } from "@/state/tarefaReducer";

// Liga a interface ao backend: envia comandos via window.api e
// atualiza o estado a partir dos eventos recebidos.
export function useTarefa() {

    const [estado, despachar] = useReducer(tarefaReducer, estadoInicial);
    const disponivel = typeof window !== "undefined" && Boolean(window.api);

    useEffect(() => {
        if (!disponivel) {
            return undefined;
        }
        return window.api.onEventoBackend((evento) => despachar({ tipo: "evento", evento }));
    }, [disponivel]);

    const iniciar = useCallback(async (opcoes) => {
        despachar({ tipo: "iniciar" });
        const resultado = await window.api.iniciarTarefa(opcoes);
        if (!resultado?.ok) {
            despachar({ tipo: "falha_ao_iniciar", erro: resultado?.erro ?? "Erro desconhecido." });
        }
    }, []);

    const parar = useCallback(async () => {
        despachar({ tipo: "parar" });
        await window.api.pararTarefa();
    }, []);

    const emAndamento = [STATUS.INICIANDO, STATUS.EXECUTANDO, STATUS.PARANDO].includes(estado.status);

    return { estado, disponivel, emAndamento, iniciar, parar };

}
